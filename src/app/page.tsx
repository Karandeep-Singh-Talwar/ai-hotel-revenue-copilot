"use client";

import React, { useState } from "react";
import AIActionCenter, { RecommendationData } from "../components/AIActionCenter";
import CompetitorMatrix from "../components/CompetitorMatrix";
import EventTimeline from "../components/EventTimeline";
import MapWrapper from "../components/MapWrapper";

interface ToastNotification {
  id: string;
  type: "success" | "info" | "warning";
  title: string;
  message: string;
}

export default function HotelRevenueDashboard() {
  const [activeTab, setActiveTab] = useState<"action_center" | "matrix" | "events" | "geospatial">("action_center");
  const [selectedProperty, setSelectedProperty] = useState("The Claridges New Delhi");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeRecommendation, setActiveRecommendation] = useState<RecommendationData | null>(null);

  // Comp-Set State for Geospatial & Dynamic Updates
  const [competitorsList, setCompetitorsList] = useState<string[]>([
    "The Imperial New Delhi",
    "The Lodhi New Delhi",
    "The Oberoi New Delhi",
    "Taj Mahal Hotel New Delhi",
  ]);

  const [simulatingWebhook, setSimulatingWebhook] = useState(false);

  const addToast = (title: string, message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleToggleCompetitor = async (compName: string) => {
    const isPresent = competitorsList.includes(compName);
    const updated = isPresent
      ? competitorsList.filter((c) => c !== compName)
      : [...competitorsList, compName];
    setCompetitorsList(updated);

    try {
      const res = await fetch("/api/comp-set/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: 1,
          competitorIds: [101, 102, 103, 104], // Mapped IDs
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast(
          "Comp-Set Updated",
          `${compName} ${isPresent ? "removed from" : "added to"} active competitive surveillance.`
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateWhatsAppApproval = async () => {
    setSimulatingWebhook(true);
    try {
      // Simulate Meta WhatsApp webhook interactive payload
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
          "WhatsApp Copilot Triggered",
          "Received 'Approve Rate' event from +919810123456. Neon stored procedure executed & ARI pushed to Channel Manager!"
        );
      }
    } catch (err) {
      console.error("Webhook test failed:", err);
    } finally {
      setSimulatingWebhook(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      {/* 1. TOP UTILITY BAR (MULTI-TENANT AGENCY CONTEXT) */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 shadow-md">
                ₹
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white block">RevOps Intelligence</span>
                <span className="text-[10px] text-slate-400 font-mono block">Agency Multi-Tenant Gateway</span>
              </div>
            </div>

            <div className="hidden md:block h-5 w-px bg-slate-800"></div>

            {/* Property Switcher */}
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-xs text-slate-400">Property:</span>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="The Claridges New Delhi">The Claridges New Delhi (140 keys • Central Delhi)</option>
                <option value="The Manor Friends Colony">The Manor New Delhi (45 keys • South Delhi)</option>
                <option value="Apex Luxury Portfolio">All Agency Properties (Consolidated)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* WhatsApp Webhook Simulation Trigger */}
            <button
              onClick={handleSimulateWhatsAppApproval}
              disabled={simulatingWebhook}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{simulatingWebhook ? "Dispatching..." : "Simulate WhatsApp 'Approve'"}</span>
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Neon DB Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. TABBED NAVIGATION */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("action_center")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "action_center"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>⚡ AI Action Center</span>
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "matrix"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📊 Competitor Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "events"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>📍 Event Intelligence</span>
          </button>
          <button
            onClick={() => setActiveTab("geospatial")}
            className={`py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
              activeTab === "geospatial"
                ? "border-slate-950 text-slate-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>🗺️ Comp-Set Geo Map</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {activeTab === "action_center" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* AI Action Center Hero & Directive */}
            <AIActionCenter
              onSyncSuccess={(msg) => addToast("Channel Manager Synchronized", msg, "success")}
              externalRecommendation={activeRecommendation}
            />

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Internal Occupancy
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    PMS LIVE
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold font-mono text-slate-900">68%</span>
                  <span className="text-xs text-slate-400">95 / 140 rooms booked</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "68%" }}></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Comp-Set Median
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    +8.4% 48h
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold font-mono text-slate-900">₹11,350</span>
                  <span className="text-xs text-slate-400">across 4 luxury comps</span>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  The Oberoi & The Lodhi leading market compression.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Active Demand Driver
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800">
                    HIGH SURGE
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                  Global AI & Cloud Tech Expo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Bharat Mandapam (2.1 km away) • 42k attendees
                </p>
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab("events")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    View All 4 Events →
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Live Competitor Matrix Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Competitor Surveillance Grid</h2>
                <button
                  onClick={() => setActiveTab("matrix")}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  Full Matrix View →
                </button>
              </div>
              <CompetitorMatrix
                onRateUpdated={(msg) => addToast("Rate Updated Live", msg, "success")}
              />
            </div>
          </div>
        )}

        {activeTab === "matrix" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <CompetitorMatrix
              onRateUpdated={(msg) => addToast("Rate Updated Live", msg, "success")}
            />
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <EventTimeline
              onSuggestionGenerated={(rec: RecommendationData) => {
                setActiveRecommendation(rec);
                setActiveTab("action_center");
                addToast(
                  "Pricing Suggestion Generated",
                  `Target rate calculated at ₹${Number(rec.recommendedRate || rec.currentRate).toLocaleString("en-IN")}. Switched to Action Center.`
                );
              }}
            />
          </div>
        )}

        {activeTab === "geospatial" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-base font-bold text-slate-900">Competitor Set Geospatial Map</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Surrounding competitor cluster for The Claridges New Delhi (Dr APJ Abdul Kalam Road).
              </p>
            </div>

            <div className="h-96 w-full rounded-xl overflow-hidden border border-slate-200">
              <MapWrapper
                targetLocation={[28.5998, 77.2185]}
                radiusKm={4.5}
                nearbyHotels={[
                  { id: "101", name: "The Imperial New Delhi", lat: 28.6239, lng: 77.2188 },
                  { id: "102", name: "The Lodhi New Delhi", lat: 28.5934, lng: 77.2384 },
                  { id: "103", name: "The Oberoi New Delhi", lat: 28.5989, lng: 77.2392 },
                  { id: "104", name: "Taj Mahal Hotel New Delhi", lat: 28.6047, lng: 77.2248 },
                  { id: "105", name: "Bloomrooms @ Janpath", lat: 28.6251, lng: 77.2178 },
                ]}
                selectedCompetitors={competitorsList}
                onToggleCompetitor={handleToggleCompetitor}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-800">Active Comp-Set Surveillance:</span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {competitorsList.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-medium bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-700 flex items-center space-x-1"
                    >
                      <span>{c}</span>
                      <button
                        onClick={() => handleToggleCompetitor(c)}
                        className="text-slate-400 hover:text-red-500 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Managed via PL/pgSQL update_comp_set()
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 4. TOAST NOTIFICATION CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-md w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start space-x-3 animate-in slide-in-from-bottom-5 duration-300"
          >
            <div className="shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                ✓
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-white">{t.title}</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
