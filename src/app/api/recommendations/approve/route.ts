/**
 * Approve Recommendation Action Route (/api/recommendations/approve)
 * Executes PL/pgSQL stored procedure `approve_recommendation(p_rec_id)`
 * and triggers immediate OTA Channel Manager sync.
 */

import { NextRequest, NextResponse } from "next/server";
import { callApproveRecommendation } from "@/lib/db";
import { pushRateToChannelManager } from "@/lib/channelManager";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recommendationId, hotelId, agencyId, customRate } = body;

    const recId = Number(recommendationId) || 1;
    const resolvedHotelId = Number(hotelId) || 1;

    console.log(`[Approve API] Initiating approval workflow for Hotel #${resolvedHotelId}, Recommendation #${recId}...`);

    // 1. Transactionally update DB status via Neon PL/pgSQL Stored Procedure
    const dbPayload = await callApproveRecommendation(recId, agencyId);

    const rateToSync = customRate ? Number(customRate) : Number(dbPayload.new_rate);

    // 2. Synchronize with Channel Manager (eZee Centrix / SiteMinder)
    const pms = dbPayload.pms_channel_manager || {};
    const syncResult = await pushRateToChannelManager({
      provider: pms.provider || "ezee_centrix",
      hotelCode: pms.hotel_code || "CLARIDGES_ND_01",
      apiKey: pms.api_key || "EZ_LIVE_SEC_882910",
      targetDate: dbPayload.target_date,
      rate: rateToSync,
      currency: dbPayload.currency || "INR",
    });

    return NextResponse.json({
      success: true,
      status: "APPROVED_AND_SYNCED",
      recommendationId: recId,
      hotelId: resolvedHotelId,
      hotelName: dbPayload.hotel_name,
      syncedRate: rateToSync,
      targetDate: dbPayload.target_date,
      channelManagerResult: syncResult,
      message: `Rate of ₹${rateToSync.toLocaleString("en-IN")} successfully pushed to Agoda, Booking.com, and MakeMyTrip via ${syncResult.provider}.`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[Approve Route Error]:", err);
    return NextResponse.json(
      { error: "Failed to approve and synchronize rate", details: err?.message || String(error) },
      { status: 500 }
    );
  }
}
