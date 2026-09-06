"use client";

import React, { useState, useEffect } from "react";

interface GlobalOverviewProps {
  onNavigateToTab: (tab: "overview" | "matrix" | "ai_actions" | "events", alertId?: string) => void;
  onQuickReview?: (alertId: string) => void;
}

export default function GlobalOverview({ onNavigateToTab, onQuickReview }: GlobalOverviewProps) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPin, setSelectedPin] = useState<string | null>("claridges");
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
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:bg-[#2A375C] transition-colors group cursor-default">
            <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
              Total RevPAR
            </p>
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
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:bg-[#2A375C] transition-colors group cursor-default">
            <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
              Portfolio Occ
            </p>
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
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:bg-[#2A375C] transition-colors group cursor-default">
            <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
              Comp Undercuts
            </p>
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
          <div className="flex min-w-[200px] flex-1 flex-col gap-2 rounded bg-surface p-4 border border-[#3A506B] hover:bg-[#2A375C] transition-colors group cursor-default">
            <p className="text-muted text-xs font-semibold leading-normal uppercase tracking-wider">
              Active Surges
            </p>
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
        <div className="relative flex-1 bg-[#050914] overflow-hidden select-none">
          {/* Tactical Satellite Dark Map Layer */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-300"
            style={{
              backgroundImage: `radial-gradient(circle at center, rgba(46,196,182,0.09) 0%, transparent 60%), radial-gradient(circle at 55% 48%, rgba(255,159,28,0.14) 0%, transparent 45%), linear-gradient(rgba(11,19,43,0.85), rgba(5,9,20,0.95)), url('/stitch/overview.png')`,
              backgroundBlendMode: "overlay",
              transform: `scale(${zoomLevel})`,
            }}
          />

          {/* Tactical Radar Grid & Concentric Rings */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
            <defs>
              <pattern id="tactical-grid-delhi" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#3A506B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tactical-grid-delhi)" />
            {/* Concentric radar surveillance rings centered on Central Delhi */}
            <circle
              cx="50%"
              cy="48%"
              r="85"
              fill="none"
              stroke="#FF9F1C"
              strokeWidth="1.2"
              strokeDasharray="4,4"
              className="animate-pulse opacity-50"
            />
            <circle
              cx="50%"
              cy="48%"
              r="170"
              fill="none"
              stroke="#2EC4B6"
              strokeWidth="0.75"
              strokeDasharray="6,6"
              className="opacity-30"
            />
          </svg>

          {/* Depth Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-background-base via-transparent to-transparent opacity-80 pointer-events-none"></div>

          {/* Property Pins (Delhi NCR Properties) */}
          {/* Pin 1: The Claridges New Delhi (Primary Property - Active Surge) */}
          <div
            className="absolute top-[48%] left-[50%] group cursor-pointer z-20"
            onClick={() => {
              setSelectedPin("claridges");
              if (onQuickReview) onQuickReview("coldplay_delhi");
              else onNavigateToTab("ai_actions");
            }}
          >
            <div className="relative pulse-halo w-7 h-7 bg-background-base border-2 border-intelligence rounded-sm flex items-center justify-center shadow-[0_0_18px_rgba(255,159,28,0.7)] transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-intelligence text-[15px]">trending_up</span>
            </div>
            {/* Tooltip */}
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-surface border border-intelligence rounded p-3 transition-opacity z-30 shadow-2xl ${
                selectedPin === "claridges" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <p className="font-heading text-sm font-semibold mb-1 text-white">
                The Claridges New Delhi
              </p>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted text-xs">Current Rate</span>
                <span className="font-mono text-xs text-white font-bold">₹7,200</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-muted text-xs">AI Suggested</span>
                <span className="font-mono text-xs text-primary font-bold">₹8,950</span>
              </div>
              <div className="mt-2 bg-intelligence/10 border border-intelligence/30 rounded-sm p-1.5 flex items-start gap-2">
                <span className="material-symbols-outlined text-intelligence text-[14px] mt-0.5">
                  warning
                </span>
                <p className="text-[11px] leading-tight text-intelligence font-medium">
                  Coldplay & Tech Expo surge. +24.3% rate rec.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTab("ai_actions", "coldplay_delhi");
                }}
                className="mt-2 w-full py-1 text-center bg-intelligence text-background-base rounded-sm font-mono text-[10px] font-bold uppercase hover:bg-opacity-90"
              >
                Review Action
              </button>
            </div>
          </div>

          {/* Pin 2: The Manor New Delhi (Friends Colony West) */}
          <div
            className="absolute top-[64%] left-[62%] group cursor-pointer"
            onClick={() => setSelectedPin("manor")}
          >
            <div className="relative w-6 h-6 bg-background-base border-2 border-primary rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(46,196,182,0.4)] transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-primary text-[14px]">hotel</span>
            </div>
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-surface border border-[#3A506B] rounded p-2.5 transition-opacity z-10 shadow-xl ${
                selectedPin === "manor" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <p className="font-heading text-xs font-semibold text-white">The Manor Friends Colony</p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-muted text-xs">Rate</span>
                <span className="font-mono text-xs text-primary font-bold">₹5,900</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-xs">Occ</span>
                <span className="font-mono text-xs text-white">84%</span>
              </div>
            </div>
          </div>

          {/* Pin 3: The Imperial New Delhi (Competitor - Janpath) */}
          <div
            className="absolute top-[34%] left-[46%] group cursor-pointer"
            onClick={() => setSelectedPin("imperial")}
          >
            <div className="relative w-5 h-5 bg-background-base border border-slate-500 rounded-sm flex items-center justify-center transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-slate-400 text-[12px]">domain</span>
            </div>
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-surface border border-[#3A506B] rounded p-2 transition-opacity z-10 shadow-lg ${
                selectedPin === "imperial" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <p className="font-heading text-xs font-semibold text-white">The Imperial New Delhi</p>
              <p className="font-mono text-xs text-slate-300 mt-0.5">MMT: ₹9,950</p>
            </div>
          </div>

          {/* Pin 4: The Lodhi New Delhi (Competitor) */}
          <div
            className="absolute top-[52%] left-[58%] group cursor-pointer"
            onClick={() => setSelectedPin("lodhi")}
          >
            <div className="relative w-5 h-5 bg-background-base border border-slate-500 rounded-sm flex items-center justify-center transition-all group-hover:scale-110">
              <span className="material-symbols-outlined text-slate-400 text-[12px]">domain</span>
            </div>
            <div
              className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-surface border border-[#3A506B] rounded p-2 transition-opacity z-10 shadow-lg ${
                selectedPin === "lodhi" ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <p className="font-heading text-xs font-semibold text-white">The Lodhi New Delhi</p>
              <p className="font-mono text-xs text-slate-300 mt-0.5">MMT: ₹12,600</p>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-10">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 1.8))}
              className="w-8 h-8 bg-surface border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#2A375C] transition-colors shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
              className="w-8 h-8 bg-surface border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#2A375C] transition-colors shadow-lg active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
          </div>
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
            onClick={() => onNavigateToTab("ai_actions", "coldplay_delhi")}
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
            onClick={() => onNavigateToTab("matrix")}
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
            onClick={() => onNavigateToTab("ai_actions", "tech_expo_delhi")}
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
