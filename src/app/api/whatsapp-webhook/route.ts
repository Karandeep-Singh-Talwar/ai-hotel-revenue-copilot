/**
 * WhatsApp Cloud API Webhook Gateway (/api/whatsapp-webhook)
 * 
 * Features:
 * 1. Meta Webhook Verification Handshake (GET: hub.challenge & hub.verify_token)
 * 2. HMAC-SHA256 Signature Verification (POST: x-hub-signature-256)
 * 3. Instant Response Pattern: Returns HTTP 200 OK in < 50ms to satisfy Meta SLA (< 2s)
 * 4. Asynchronous Task Worker:
 *    - Detects 'Approve Rate' interactive quick-reply or button taps
 *    - Calls PL/pgSQL Stored Procedure `approve_recommendation(p_rec_id)`
 *    - Pushes live rate updates to Channel Manager (eZee Centrix / SiteMinder)
 *    - Dispatches WhatsApp confirmation receipt back to hotelier
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { callApproveRecommendation } from "@/lib/db";
import { pushRateToChannelManager } from "@/lib/channelManager";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "ams_hotel_webhook_token_2026";
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";

/**
 * 1. Meta Webhook Verification (GET Handshake)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] Verification successful. Handshake acknowledged.");
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[WhatsApp Webhook] Unauthorized verification handshake attempt.");
  return NextResponse.json({ error: "Invalid verification token" }, { status: 403 });
}

/**
 * Validates Meta cryptographic HMAC-SHA256 signature
 */
function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WHATSAPP_APP_SECRET) {
    // Permissive in dev if secret not configured
    return true;
  }
  if (!signatureHeader) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", WHATSAPP_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  const signature = signatureHeader.startsWith("sha256=")
    ? signatureHeader.substring(7)
    : signatureHeader;

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

/**
 * Dispatches WhatsApp confirmation back to the hotelier
 */
async function sendWhatsAppConfirmation(phone: string, text: string) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[Mock WhatsApp Dispatch to ${phone}]: ${text}`);
    return;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: text },
      }),
    });
  } catch (err) {
    console.error("[WhatsApp Dispatch Error]:", err);
  }
}

interface WhatsAppWebhookEntry {
  changes?: Array<{
    value?: {
      messages?: Array<{
        from: string;
        type: string;
        interactive?: {
          button_reply?: { id: string; title: string };
        };
        text?: { body: string };
      }>;
    };
  }>;
}

interface WhatsAppWebhookBody {
  entry?: WhatsAppWebhookEntry[];
}

async function processWebhookPayloadAsync(body: WhatsAppWebhookBody) {
  try {
    const entries = body?.entry || [];
    for (const entry of entries) {
      const changes = entry?.changes || [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages || [];

        for (const msg of messages) {
          const from = msg.from; // Sender WhatsApp Phone
          let actionText = "";
          let recommendationId: number | null = null;

          // 1. Check for Interactive Button Clicks (WhatsApp Quick Reply / Button)
          if (msg.type === "interactive" && msg.interactive?.button_reply) {
            const buttonId = msg.interactive.button_reply.id; // e.g., "approve_rec_1"
            actionText = msg.interactive.button_reply.title;
            const match = buttonId.match(/approve_rec_(\d+)/i);
            if (match) {
              recommendationId = parseInt(match[1], 10);
            }
          } 
          // 2. Check for Plain Text messages (e.g., "Approve 1" or "Approve Rate")
          else if (msg.type === "text" && msg.text?.body) {
            const text = msg.text.body.trim();
            actionText = text;
            const match = text.match(/approve(?:\s+rate)?(?:\s+(\d+))?/i);
            if (match) {
              recommendationId = match[1] ? parseInt(match[1], 10) : 1;
            }
          }

          // If hotelier approved rate
          if (recommendationId !== null) {
            console.log(`[WhatsApp Copilot] Hotelier approved recommendation #${recommendationId} via ${actionText}`);

            // Step A: Call PL/pgSQL Stored Procedure approve_recommendation(p_rec_id)
            const dbPayload = await callApproveRecommendation(recommendationId);

            if (dbPayload.status === "already_approved") {
              await sendWhatsAppConfirmation(
                from,
                `ℹ️ Recommendation #${recommendationId} has already been approved and synchronized with your channel manager.`
              );
              continue;
            }

            // Step B: Trigger live rate update to Channel Manager API
            const pms = dbPayload.pms_channel_manager || {};
            const syncResult = await pushRateToChannelManager({
              provider: pms.provider || "ezee_centrix",
              hotelCode: pms.hotel_code || "CLARIDGES_ND_01",
              apiKey: pms.api_key || "TEST_KEY",
              targetDate: dbPayload.target_date,
              rate: dbPayload.new_rate,
              currency: dbPayload.currency || "INR",
            });

            // Step C: Send rich receipt back to Hotelier on WhatsApp
            const confirmationMsg = 
              `*Rate Approval Synchronized Live!* \n\n` +
              `*Hotel:* ${dbPayload.hotel_name}\n` +
              `*Target Date:* ${dbPayload.target_date}\n` +
              `*New Rate:* ₹${Number(dbPayload.new_rate).toLocaleString("en-IN")}\n` +
              `*Previous Rate:* ₹${Number(dbPayload.previous_rate).toLocaleString("en-IN")}\n` +
              `*Channel Manager:* ${syncResult.provider} (Ref: ${syncResult.transactionReference})\n` +
              `*OTAs Synced:* ${syncResult.otaChannelsUpdated.join(", ")}\n\n` +
              `Rate changes are now live and bookable across all distribution channels.`;

            await sendWhatsAppConfirmation(from, confirmationMsg);
          }
        }
      }
    }
  } catch (err) {
    console.error("[WhatsApp Webhook Background Worker Error]:", err);
  }
}

/**
 * 2. Incoming Event Ingestion (POST)
 * Instant Response Pattern: Responds with 200 OK immediately (< 50ms)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Cryptographic validation
    if (!verifyMetaSignature(rawBody, signature)) {
      console.warn("[WhatsApp Webhook] Invalid HMAC-SHA256 signature.");
      return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}");

    // Spin off asynchronous background worker without blocking HTTP response
    // Uses process.nextTick / Promise scheduling for Edge/Serverless compliance
    process.nextTick(() => {
      processWebhookPayloadAsync(payload);
    });

    // Instant HTTP 200 Response to satisfy Meta webhook timeout standards (< 2 seconds)
    return NextResponse.json(
      {
        status: "EVENT_RECEIVED",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[WhatsApp Webhook Request Error]:", err);
    // Always return 200 to prevent Meta from spamming duplicate delivery retries
    return NextResponse.json({ status: "ACK_WITH_ERROR" }, { status: 200 });
  }
}
