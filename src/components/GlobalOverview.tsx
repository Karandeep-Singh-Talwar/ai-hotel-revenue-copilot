"use client";

import React, { useState, useEffect } from "react";
import TacticalMapWrapper from "./TacticalMapWrapper";

interface GlobalOverviewProps {
  onNavigateToTab: (tab: "overview" | "matrix" | "ai_actions" | "events", alertId?: string) => void;
  onQuickReview?: (alertId: string) => void;
}

export default function GlobalOverview({ onNavigateToTab, onQuickReview }: GlobalOverviewProps) {
  const [focusedLocation, setFocusedLocation] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    id?: string;
  } | null>({
    lat: 28.604,
    lng: 77.222,
    zoom: 13,
    id: "claridges",
  });
  const [revpar, setRevpar] = useState("₹8,950");
  const occ = "78.4%";
  const [undercutsCount, setUndercutsCount] = useState(3);
  const surgesCount = 3;

  useEffect(() => {
    // Fetch live matrix and recommendation metrics
    const fetchMetrics = async () => {
      try {
        const [recRes, matrixRes] = await Promise.all([
          fetch("/api/recommendations/latest?hotelId=1"),
          fetch("/api/rates/matrix?hotelId=1"),
        ]);
        const recData = await recRes.json();
        const matrixData = await matrixRes.json();

        if (recData?.recommendedRate) {
          setRevpar(`₹${recData.recommendedRate.toLocaleString("en-IN")}`);
        }
        if (matrixData?.competitors) {
          // Count undercutting competitors
          const undercuts = matrixData.competitors.filter(
            (c: any) => (c.channels?.MakeMyTrip?.rate || 0) < (matrixData.myHotel?.standardRate || 7200)
          ).length;
          setUndercutsCount(undercuts > 0 ? undercuts : 2);
        }
      } catch (err) {
        console.error("Error loading overview metrics:", err);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="flex flex-1 h-full min-w-0 overflow-hidden bg-[#0B132B]">
      {/* Central Column: KPI Row + Interactive Tactical Dark Map */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* KPI Row (120px) matching Stitch */}
        <div className="flex h-[120px] flex-shrink-0 border-b border-[#3A506B] bg-[#0B132B] p-4 gap-4 overflow-x-auto">
          {/* KPI Block 1: Total RevPAR */}
          <div 
            onClick={() => setFocusedLocation({ lat: 28.5998, lng: 77.2185, zoom: 14, id: "claridges" })}
            className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:border-primary hover:bg-[#2A375C] transition-colors group cursor-pointer"
            title="Click to center on The Claridges New Delhi"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
                Total RevPAR
              </p>
              <span className="material-symbols-outlined text-muted text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                my_location
              </span>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-white font-mono text-2xl font-bold leading-none">{revpar}</p>
              <div className="flex items-center text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span className="font-mono text-xs font-bold">+24.3%</span>
              </div>
            </div>
            <p className="text-muted text-[11px] font-mono mt-auto">vs. last 7 days</p>
          </div>

          {/* KPI Block 2: Portfolio Occ */}
          <div 
            onClick={() => setFocusedLocation({ lat: 28.5632, lng: 77.2654, zoom: 14, id: "manor" })}
            className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:border-primary hover:bg-[#2A375C] transition-colors group cursor-pointer"
            title="Click to center on The Manor Friends Colony"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
                Portfolio Occ
              </p>
              <span className="material-symbols-outlined text-muted text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                my_location
              </span>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-white font-mono text-2xl font-bold leading-none">{occ}</p>
              <div className="flex items-center text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                <span className="font-mono text-xs font-bold">+2.1%</span>
              </div>
            </div>
            <p className="text-muted text-[11px] font-mono mt-auto">Target: 75%</p>
          </div>

          {/* KPI Block 3: Comp Undercuts */}
          <div 
            onClick={() => setFocusedLocation({ lat: 28.6251, lng: 77.2178, zoom: 15, id: "bloomrooms" })}
            className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:border-accent hover:bg-[#2A375C] transition-colors group cursor-pointer"
            title="Click to view undercutting competitors in CP"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
                Comp Undercuts
              </p>
              <span className="material-symbols-outlined text-muted text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                my_location
              </span>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-white font-mono text-2xl font-bold leading-none">{undercutsCount}</p>
              <div className="flex items-center text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm">
                <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                <span className="font-mono text-xs font-bold">-2</span>
              </div>
            </div>
            <p className="text-muted text-[11px] font-mono mt-auto">Across 5 OTA channels</p>
          </div>

          {/* KPI Block 4: Active Surges */}
          <div 
            onClick={() => setFocusedLocation({ lat: 28.5828, lng: 77.2344, zoom: 14, id: "coldplay_delhi" })}
            className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:border-intelligence hover:bg-[#2A375C] transition-colors group cursor-pointer"
            title="Click to view JLN Stadium Coldplay Surge Focus"
          >
            <div className="flex items-center justify-between">
              <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
                Active Surges
              </p>
              <span className="material-symbols-outlined text-intelligence text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                my_location
              </span>
            </div>
            <div className="flex items-end gap-3 mt-1">
              <p className="text-intelligence font-mono text-2xl font-bold leading-none">
                {surgesCount}
              </p>
              <div className="flex items-center text-intelligence bg-intelligence/10 px-1.5 py-0.5 rounded-sm">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                <span className="font-mono text-xs font-bold">Action Req</span>
              </div>
            </div>
            <p className="text-muted text-[11px] font-mono mt-auto">Next 30 days</p>
          </div>
        </div>

        {/* Interactive Tactical Dark Map Area (Delhi NCR Surveillance Grid) */}
        <div className="relative flex-1 bg-[#050914] overflow-hidden">
          <TacticalMapWrapper
            center={[28.604, 77.222]}
            zoom={13}
            focusedLocation={focusedLocation}
            onNavigateToTab={onNavigateToTab}
            onQuickReview={onQuickReview}
          />
        </div>
      </div>

      {/* Right Drawer: AI Action Center (Quick Alerts, 320px) */}
      <div className="w-[320px] h-full bg-surface border-l border-[#3A506B] flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-[#3A506B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-intelligence text-[20px]">bolt</span>
            <h2 className="font-heading text-base font-semibold text-white">AI Actions</h2>
          </div>
          <span className="bg-intelligence text-background-base font-mono text-xs font-bold px-2 py-0.5 rounded-sm">
            3
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Alert Card 1 (High Priority - Coldplay World Tour) */}
          <div
            onClick={() => setFocusedLocation({ lat: 28.5828, lng: 77.2344, zoom: 14, id: "coldplay_delhi" })}
            className="bg-background-base border border-[#3A506B] border-t-2 border-t-intelligence rounded p-3 hover:bg-[#2A375C] transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-muted font-medium">The Claridges New Delhi</span>
              <span className="font-mono text-xs text-intelligence bg-intelligence/10 px-1.5 py-0.5 rounded-sm font-semibold">
                High
              </span>
            </div>
            <p className="text-sm font-medium leading-snug mb-3 text-white">
              Coldplay World Tour announced at JLN Stadium. Competitors raising rates by +28%.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                <span className="font-mono text-sm font-bold">+24.3% Rec</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTab("ai_actions", "coldplay_delhi");
                }}
                className="text-xs font-medium text-white bg-surface border border-[#3A506B] px-2.5 py-1 rounded hover:border-primary transition-colors"
              >
                Review
              </button>
            </div>
          </div>

          {/* Alert Card 2 (Med Priority - Parity Warning on MakeMyTrip) */}
          <div
            onClick={() => setFocusedLocation({ lat: 28.6251, lng: 77.2178, zoom: 15, id: "bloomrooms" })}
            className="bg-background-base border border-[#3A506B] border-t-2 border-t-primary rounded p-3 hover:bg-[#2A375C] transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-muted font-medium">The Manor New Delhi</span>
              <span className="font-mono text-xs text-muted bg-surface px-1.5 py-0.5 rounded-sm">
                Med
              </span>
            </div>
            <p className="text-sm font-medium leading-snug mb-3 text-white">
              MakeMyTrip parity warning. Bloomrooms undercutting standard tier by ₹1,700.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-accent">
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                <span className="font-mono text-sm font-bold">-₹600 Rec</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTab("matrix");
                }}
                className="text-xs font-medium text-white bg-surface border border-[#3A506B] px-2.5 py-1 rounded hover:border-primary transition-colors"
              >
                Review
              </button>
            </div>
          </div>

          {/* Alert Card 3 (Tech Summit at Bharat Mandapam) */}
          <div
            onClick={() => setFocusedLocation({ lat: 28.6184, lng: 77.2415, zoom: 14, id: "tech_expo" })}
            className="bg-background-base border border-[#3A506B] rounded p-3 hover:bg-[#2A375C] transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-muted font-medium">The Claridges New Delhi</span>
              <span className="font-mono text-xs text-muted bg-surface px-1.5 py-0.5 rounded-sm">
                Med
              </span>
            </div>
            <p className="text-sm font-medium leading-snug mb-3 text-white">
              Global AI & Cloud Tech Expo (42k delegates) at Bharat Mandapam Pragati Maidan.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                <span className="font-mono text-sm font-bold">+18.4% Rec</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTab("ai_actions", "tech_expo_delhi");
                }}
                className="text-xs font-medium text-white bg-surface border border-[#3A506B] px-2.5 py-1 rounded hover:border-primary transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
