"use client";

import React, { useState } from "react";
import GlobalOverview from "../components/GlobalOverview";
import CompetitorMatrix from "../components/CompetitorMatrix";
import AIActionCenter from "../components/AIActionCenter";
import EventTimeline, { EventItem } from "../components/EventTimeline";

interface ToastNotification {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
}

export default function HotelRevenueDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "matrix" | "ai_actions" | "events">(
    "overview"
  );
  const [selectedProperty, setSelectedProperty] = useState("The Claridges New Delhi");
  const [selectedAlertId, setSelectedAlertId] = useState<string>("ed_sheeran");
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
    }, 4500);
  };

  const handleSimulateWhatsAppApproval = async () => {
    setSimulatingWebhook(true);
    try {
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
          "WhatsApp Copilot Approved",
          "Received 'Approve Rate' event from +919810123456. Neon stored procedure executed & ARI pushed to Channel Manager!"
        );
      }
    } catch (err) {
      console.error("Webhook test failed:", err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  const handleQuickReview = (alertId: string) => {
    setSelectedAlertId(alertId);
    setActiveTab("ai_actions");
  };

  const handleEventPricingJump = (event: EventItem) => {
    setSelectedAlertId("ed_sheeran");
    setActiveTab("ai_actions");
    addToast(
      "Event Forecast Loaded",
      `AI Action Center pre-filtered for ${event.name} (${event.date}).`
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden antialiased bg-[#0B132B] text-white font-body selection:bg-primary selection:text-[#0B132B]">
      {/* 1. LEFT SIDEBAR NAVIGATION (Shared Component matching Google Stitch) */}
      <aside className="relative flex h-full flex-col bg-[#111817] overflow-x-hidden w-64 flex-shrink-0 border-r border-[#3c5351] select-none">
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex flex-col gap-4">
            {/* Brand Header */}
            <div className="flex gap-3 items-center mb-4">
              <div className="aspect-square rounded size-10 bg-surface border border-primary flex items-center justify-center shadow-[0_0_10px_rgba(46,196,182,0.3)]">
                <span className="material-symbols-outlined text-primary text-[22px]">hotel_class</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-white text-base font-heading font-semibold leading-normal">
                  RevCommand
                </h1>
                <select
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    addToast("Property Switched", `Active property context: ${e.target.value}`);
                  }}
                  className="bg-transparent text-muted text-xs font-medium leading-normal outline-none cursor-pointer hover:text-white"
                >
                  <option value="5 Properties" className="bg-[#1C2541] text-white">5 Properties</option>
                  <option value="Riverside Boutique" className="bg-[#1C2541] text-white">Riverside Boutique</option>
                  <option value="Downtown Suites" className="bg-[#1C2541] text-white">Downtown Suites</option>
                  <option value="City Suites" className="bg-[#1C2541] text-white">City Suites</option>
                  <option value="Airport Hub" className="bg-[#1C2541] text-white">Airport Hub</option>
                </select>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex flex-col gap-2">
              {/* Tab 1: Overview */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-left w-full cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-surface border-l-2 border-primary text-white"
                    : "hover:bg-surface/50 text-muted hover:text-white"
                }`}
              >
                <div className={activeTab === "overview" ? "text-primary" : "text-muted"}>
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{
                      fontVariationSettings: activeTab === "overview" ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    dashboard
                  </span>
                </div>
                <p className="text-sm font-medium leading-normal">Overview</p>
              </button>

              {/* Tab 2: Matrix */}
              <button
                onClick={() => setActiveTab("matrix")}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-left w-full cursor-pointer ${
                  activeTab === "matrix"
                    ? "bg-surface border-l-2 border-primary text-white"
                    : "hover:bg-surface/50 text-muted hover:text-white"
                }`}
              >
                <div className={activeTab === "matrix" ? "text-primary" : "text-muted"}>
                  <span className="material-symbols-outlined text-[20px]">grid_on</span>
                </div>
                <p className="text-sm font-medium leading-normal">Matrix</p>
              </button>

              {/* Tab 3: AI Actions */}
              <button
                onClick={() => setActiveTab("ai_actions")}
                className={`flex items-center justify-between px-3 py-2 rounded transition-colors text-left w-full cursor-pointer ${
                  activeTab === "ai_actions"
                    ? "bg-surface border-l-2 border-primary text-white"
                    : "hover:bg-surface/50 text-muted hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={activeTab === "ai_actions" ? "text-primary" : "text-muted"}>
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </div>
                  <p className="text-sm font-medium leading-normal">AI Actions</p>
                </div>
                <span className="bg-intelligence text-background-base font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                  3
                </span>
              </button>

              {/* Tab 4: Events */}
              <button
                onClick={() => setActiveTab("events")}
                className={`flex items-center gap-3 px-3 py-2 rounded transition-colors text-left w-full cursor-pointer ${
                  activeTab === "events"
                    ? "bg-surface border-l-2 border-primary text-white"
                    : "hover:bg-surface/50 text-muted hover:text-white"
                }`}
              >
                <div className={activeTab === "events" ? "text-primary" : "text-muted"}>
                  <span className="material-symbols-outlined text-[20px]">event</span>
                </div>
                <p className="text-sm font-medium leading-normal">Events</p>
              </button>
            </nav>
          </div>

          {/* Bottom Controls & User Profile */}
          <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-[#3A506B]/50">
            {/* WhatsApp Copilot Simulation Trigger */}
            <button
              onClick={handleSimulateWhatsAppApproval}
              disabled={simulatingWebhook}
              className="bg-[#1C2541] hover:bg-[#2A375C] border border-[#3A506B] hover:border-primary text-white px-3 py-2 rounded text-xs font-mono flex items-center justify-between transition-all cursor-pointer shadow-sm group disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px]">WhatsApp Copilot</span>
              </div>
              <span className="text-[10px] text-primary group-hover:underline">
                {simulatingWebhook ? "Sending..." : "Simulate"}
              </span>
            </button>

            {/* User Profile Card matching Stitch */}
            <div className="flex items-center gap-3 px-2 py-1">
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 border border-primary/40"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120')",
                }}
              />
              <div className="flex flex-col min-w-0">
                <p className="text-white text-sm font-medium leading-none truncate">A. Mercer</p>
                <p className="text-muted text-xs mt-1 leading-none font-mono">Manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN ACTIVE SCREEN */}
      <main className="flex flex-1 h-full min-w-0 overflow-hidden relative">
        {activeTab === "overview" && (
          <GlobalOverview
            onNavigateToTab={(tab, alertId) => {
              if (alertId) setSelectedAlertId(alertId);
              setActiveTab(tab);
            }}
            onQuickReview={handleQuickReview}
          />
        )}

        {activeTab === "matrix" && (
          <CompetitorMatrix
            onBack={() => setActiveTab("overview")}
            onRateUpdated={(msg) => addToast("Matrix Rate Sync", msg)}
          />
        )}

        {activeTab === "ai_actions" && (
          <AIActionCenter
            selectedAlertId={selectedAlertId}
            onBackToDashboard={() => setActiveTab("overview")}
            onSyncSuccess={(msg) => addToast("Rate Updated & Pushed", msg)}
          />
        )}

        {activeTab === "events" && (
          <EventTimeline
            onGeneratePricing={handleEventPricingJump}
            onSelectEvent={(evt) => console.log("Selected event:", evt)}
          />
        )}
      </main>

      {/* 3. TOAST NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#1C2541] border border-primary/40 text-white px-4 py-3 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-start space-x-3 w-84 animate-slide-in backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">
              check_circle
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white font-mono">{toast.title}</h4>
              <p className="text-[11px] text-muted mt-0.5 leading-tight">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
