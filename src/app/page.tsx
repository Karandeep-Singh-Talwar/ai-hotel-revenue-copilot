"use client";

import React, { useState } from "react";
import AIActionCenter from "../components/AIActionCenter";
import CompetitorMatrix from "../components/CompetitorMatrix";
import EventTimeline, { EventItem } from "../components/EventTimeline";

interface ToastNotification {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
}

export default function HotelRevenueDashboard() {
  const [activeTab, setActiveTab] = useState<"action_center" | "matrix" | "events">("action_center");
  const [selectedAlertId, setSelectedAlertId] = useState<string>("coldplay_delhi");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  const addToast = (
    title: string,
    message: string,
    type: "success" | "info" | "warning" = "success"
  ) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleSimulateWhatsAppApproval = async () => {
    setSimulatingWebhook(true);
    try {
      // Simulate WhatsApp message reply from General Manager
      const mockMetaPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      from: "+919810123456",
                      type: "interactive",
                      interactive: {
                        button_reply: {
                          id: "approve_rec_1",
                          title: "Approve Rate",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await fetch("/api/whatsapp-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockMetaPayload),
      });
      const data = await res.json();

      if (data.status === "EVENT_RECEIVED") {
        addToast(
          "WhatsApp Rates Approved!",
          "The General Manager approved new rates for Lemon Tree Premier Aerocity (Superior ₹7,200, Deluxe ₹8,450, Executive ₹10,600, Suite ₹15,400). All booking sites (MakeMyTrip, Booking.com, Agoda) updated!"
        );
      }
    } catch (err) {
      console.error("Webhook test failed:", err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleEventPricingJump = (event: EventItem) => {
    setSelectedAlertId("yashobhoomi_aviation");
    setActiveTab("action_center");
    addToast(
      "Price Recommendation Ready",
      `Calculated the best room prices for ${event.name} (${event.date}). Showing details now.`
    );
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#0B132B] text-white font-body selection:bg-primary selection:text-[#0B132B]">
      {/* 1. TOP HEADER (Simple, Friendly & Modern) */}
      <header className="h-16 flex-shrink-0 bg-[#0B132B] border-b border-[#3A506B] px-6 flex items-center justify-between z-30 select-none">
        {/* Left: Hotel Name & System Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded bg-[#1C2541] border border-primary flex items-center justify-center shadow-[0_0_12px_rgba(46,196,182,0.3)]">
              <span className="font-mono text-primary font-bold text-lg leading-none">₹</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-heading font-bold tracking-tight">
                  Smart Hotel Pricing
                </span>
                <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/30 font-mono text-[9px] font-bold rounded uppercase">
                  Live & Connected
                </span>
              </div>
              <span className="text-muted text-[11px] font-mono tracking-normal">
                Lemon Tree Premier, Delhi Airport (Aerocity) • 287 Rooms • Asset 6, Hospitality District
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3 Simple Tabs */}
        <nav className="flex items-center gap-1 bg-[#1C2541] p-1 rounded-sm border border-[#3A506B]">
          {/* Tab 1: Price Recommendations */}
          <button
            onClick={() => setActiveTab("action_center")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "action_center"
                ? "bg-primary text-[#0B132B] shadow-[0_0_10px_rgba(46,196,182,0.35)]"
                : "text-muted hover:text-white hover:bg-[#2A375C]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">lightbulb</span>
            <span>Price Recommendations</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-sm ${
                activeTab === "action_center"
                  ? "bg-[#0B132B] text-primary"
                  : "bg-intelligence text-[#0B132B]"
              }`}
            >
              3 new
            </span>
          </button>

          {/* Tab 2: Nearby Hotel Prices */}
          <button
            onClick={() => setActiveTab("matrix")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "matrix"
                ? "bg-primary text-[#0B132B] shadow-[0_0_10px_rgba(46,196,182,0.35)]"
                : "text-muted hover:text-white hover:bg-[#2A375C]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_on</span>
            <span>Nearby Hotel Prices</span>
          </button>

          {/* Tab 3: City Events & Demand */}
          <button
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === "events"
                ? "bg-primary text-[#0B132B] shadow-[0_0_10px_rgba(46,196,182,0.35)]"
                : "text-muted hover:text-white hover:bg-[#2A375C]"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            <span>City Events & Demand</span>
          </button>
        </nav>

        {/* Right: Status & WhatsApp Test */}
        <div className="flex items-center gap-3">
          {/* Database Connected Badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono bg-[#1C2541] border border-[#3A506B] text-muted px-2.5 py-1 rounded-sm">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Database Connected</span>
          </div>

          {/* Booking Sites Connected Badge */}
          <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono bg-[#1C2541] border border-[#3A506B] text-muted px-2.5 py-1 rounded-sm">
            <span className="size-1.5 rounded-full bg-primary"></span>
            <span>OTAs Synced</span>
          </div>

          {/* WhatsApp Simulator Button */}
          <button
            onClick={handleSimulateWhatsAppApproval}
            disabled={simulatingWebhook}
            className="bg-[#1C2541] hover:bg-[#2A375C] border border-[#3A506B] hover:border-primary text-white px-3.5 py-1.5 rounded-sm text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-sm group disabled:opacity-50"
            title="Simulates GM tapping 'Approve Rate' on their WhatsApp message"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold">WhatsApp Test</span>
            <span className="text-[10px] text-primary group-hover:underline">
              {simulatingWebhook ? "Sending..." : "Approve ₹8,950"}
            </span>
          </button>
        </div>
      </header>

      {/* 2. MAIN ACTIVE VIEW */}
      <main className="flex flex-1 h-[calc(100vh-64px)] min-w-0 overflow-hidden relative">
        {/* Tab 1: Price Recommendations */}
        {activeTab === "action_center" && (
          <div className="w-full h-full animate-in fade-in duration-200">
            <AIActionCenter
              selectedAlertId={selectedAlertId}
              onBackToDashboard={() => setActiveTab("matrix")}
              onSyncSuccess={(msg) => addToast("New Price Applied", msg)}
            />
          </div>
        )}

        {/* Tab 2: Nearby Hotel Prices */}
        {activeTab === "matrix" && (
          <div className="w-full h-full animate-in fade-in duration-200">
            <CompetitorMatrix
              onBack={() => setActiveTab("action_center")}
              onRateUpdated={(msg) => addToast("Price Updated", msg)}
            />
          </div>
        )}

        {/* Tab 3: City Events & Demand */}
        {activeTab === "events" && (
          <div className="w-full h-full animate-in fade-in duration-200">
            <EventTimeline
              onGeneratePricing={handleEventPricingJump}
              onSelectEvent={(evt) => console.log("Selected event:", evt)}
            />
          </div>
        )}
      </main>

      {/* 3. NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#1C2541] border border-primary/50 text-white px-4 py-3 rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-start space-x-3 w-96 animate-slide-in backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
              check_circle
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono tracking-wide">
                {toast.title}
              </h4>
              <p className="text-[11px] text-muted mt-0.5 leading-relaxed font-body">
                {toast.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
