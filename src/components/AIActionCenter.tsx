"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export interface AlertItem {
  id: string;
  property: string;
  propertyName: string;
  title: string;
  rateTag: string;
  rateTagColor: "primary" | "accent";
  impactText: string;
  timeAgo: string;
  priority: "high" | "med" | "low";
  dateRange: string;
  currentRate: number;
  suggestedRate: number;
  increasePct: number;
  revparImpact: number;
  description: string;
  competitors: Array<{
    name: string;
    rate: number;
    change: string;
    status: "Surging" | "Stable";
  }>;
}

const INDIAN_ALERTS: AlertItem[] = [
  {
    id: "coldplay_delhi",
    property: "The Claridges",
    propertyName: "The Claridges New Delhi",
    title: "Coldplay Live & Tech Expo Surge",
    rateTag: "+24.3% Rate",
    rateTagColor: "primary",
    impactText: "Impact: +₹1,750 RevPAR",
    timeAgo: "Just now",
    priority: "high",
    dateRange: "Next Weekend (JLN Stadium & Bharat Mandapam)",
    currentRate: 7200,
    suggestedRate: 8950,
    increasePct: 24.3,
    revparImpact: 1750,
    description:
      "Global AI & Cloud Tech Expo (42k delegates) at Bharat Mandapam and Coldplay World Tour at JLN Stadium have driven competitor median to ₹11,200. With internal occupancy pacing at 68% and booking velocity up 3.2x, increasing rate to ₹8,950 captures ₹2.45L additional RevPAR without stalling conversion.",
    competitors: [
      { name: "The Imperial New Delhi", rate: 9950, change: "+12%", status: "Surging" },
      { name: "The Lodhi New Delhi", rate: 12600, change: "+8%", status: "Surging" },
      { name: "The Oberoi New Delhi", rate: 13950, change: "+5%", status: "Surging" },
      { name: "Taj Mahal Mansingh", rate: 10950, change: "+7%", status: "Surging" },
      { name: "Bloomrooms @ Janpath", rate: 4200, change: "0%", status: "Stable" },
    ],
  },
  {
    id: "mmt_parity_warning",
    property: "The Manor",
    propertyName: "The Manor New Delhi",
    title: "MakeMyTrip Parity Defend Rate",
    rateTag: "-₹600 Match",
    rateTagColor: "accent",
    impactText: "Defend Booking Velocity",
    timeAgo: "45m ago",
    priority: "med",
    dateRange: "Oct 28 - Oct 30",
    currentRate: 5900,
    suggestedRate: 5300,
    increasePct: -10.1,
    revparImpact: 600,
    description:
      "MakeMyTrip channel scan flagged competitor aggressive flash-sale in Friends Colony / South Delhi cluster. Adjusting rate to ₹5,300 with 2-night minimum length of stay restriction secures baseline volume before weekend compression kicks in.",
    competitors: [
      { name: "Bloomrooms @ Janpath", rate: 4100, change: "-6%", status: "Surging" },
      { name: "The Claridges New Delhi", rate: 7200, change: "0%", status: "Stable" },
    ],
  },
  {
    id: "tech_expo_delhi",
    property: "The Claridges",
    propertyName: "The Claridges New Delhi",
    title: "IITF Trade Fair Yield Hike",
    rateTag: "+18.4% Rate",
    rateTagColor: "primary",
    impactText: "Impact: +₹1,320 RevPAR",
    timeAgo: "2h ago",
    priority: "med",
    dateRange: "Nov 14 - Nov 18",
    currentRate: 7200,
    suggestedRate: 8520,
    increasePct: 18.4,
    revparImpact: 1320,
    description:
      "India International Trade Fair (IITF) at Pragati Maidan (1.3 mi away). B2B business traveler demand anticipated to surge starting Thursday check-ins. Recommend lifting standard corporate rates to capture unconstrained demand.",
    competitors: [
      { name: "The Imperial", rate: 10200, change: "+10%", status: "Surging" },
      { name: "Taj Mansingh", rate: 11200, change: "+6%", status: "Surging" },
    ],
  },
];

interface AIActionCenterProps {
  onSyncSuccess?: (msg: string) => void;
  selectedAlertId?: string;
  onBackToDashboard?: () => void;
}

export default function AIActionCenter({
  onSyncSuccess,
  selectedAlertId,
  onBackToDashboard,
}: AIActionCenterProps) {
  const [filter, setFilter] = useState<"all" | "high" | "saved">("all");
  const [selectedId, setSelectedId] = useState<string>(selectedAlertId || "coldplay_delhi");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [livePaceCurve, setLivePaceCurve] = useState<any[]>([]);

  useEffect(() => {
    if (selectedAlertId) {
      setSelectedId(selectedAlertId);
      setIsSynced(false);
    }
  }, [selectedAlertId]);

  useEffect(() => {
    // Fetch live recommendation from backend API
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/recommendations/latest?hotelId=1");
        const data = await res.json();
        if (data?.paceCurve) {
          setLivePaceCurve(
            data.paceCurve.map((p: any) => ({
              day: p.daysOut,
              current: p.currentOcc,
              optimized: p.optimizedOcc,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading live recommendation:", err);
      }
    };
    fetchLatest();
  }, []);

  const activeAlert = INDIAN_ALERTS.find((a) => a.id === selectedId) || INDIAN_ALERTS[0];

  const filteredAlerts = INDIAN_ALERTS.filter((item) => {
    if (filter === "high") return item.priority === "high";
    if (filter === "saved") return false;
    return true;
  });

  const curveData =
    livePaceCurve.length > 0
      ? livePaceCurve
      : [
          { day: "30d Out", current: 15, optimized: 14 },
          { day: "20d Out", current: 42, optimized: 38 },
          { day: "10d Out", current: 68, optimized: 65 },
          { day: "5d Out", current: 75, optimized: 82 },
          { day: "1d Out", current: 80, optimized: 94 },
          { day: "Check-in", current: 82, optimized: 98 },
        ];

  const handleUpdateRate = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/recommendations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: 1,
          hotelId: 1,
          customRate: activeAlert.suggestedRate,
        }),
      });
      await res.json();

      setIsUpdating(false);
      setIsSynced(true);
      if (onSyncSuccess) {
        onSyncSuccess(
          `Updated rate for ${activeAlert.propertyName} to ₹${activeAlert.suggestedRate.toLocaleString(
            "en-IN"
          )}/night. Stored in Neon & Synced with eZee Centrix.`
        );
      }
      setTimeout(() => {
        setIsSynced(false);
      }, 4000);
    } catch (e) {
      console.error(e);
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden antialiased bg-[#0B132B] text-white font-mono selection:bg-primary selection:text-background-dark">
      {/* Main Split-Pane Layout matching Stitch */}
      <main className="flex w-full h-full">
        {/* Left Pane: Alert Feed (400px) */}
        <aside className="w-[400px] h-full bg-surface border-r border-border flex flex-col flex-shrink-0 z-10">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface sticky top-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-intelligence text-[22px]">bolt</span>
              <h2 className="text-sm font-bold uppercase tracking-widest text-white font-heading">
                Action Center
              </h2>
            </div>
            <span className="text-xs text-muted border border-border rounded-sm px-2 py-0.5 font-mono">
              {filteredAlerts.length} Alerts
            </span>
          </div>

          {/* Filters */}
          <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto bg-[#141b33]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors ${
                filter === "all"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors ${
                filter === "high"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              High Priority
            </button>
            <button
              onClick={() => setFilter("saved")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors ${
                filter === "saved"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              Saved
            </button>
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.map((alert) => {
              const isSelected = alert.id === selectedId;
              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    setSelectedId(alert.id);
                    setIsSynced(false);
                  }}
                  className={`h-[105px] rounded-sm p-3 flex flex-col justify-between cursor-pointer transition-all relative group ${
                    isSelected
                      ? "bg-highlight border-t-2 border-t-intelligence border-r border-b border-l border-border shadow-[0_0_15px_rgba(255,159,28,0.15)]"
                      : "bg-background-dark border border-border hover:border-primary hover:bg-[#151d38]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          alert.priority === "high"
                            ? "bg-intelligence animate-pulse"
                            : "bg-primary"
                        }`}
                      />
                      <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[200px]">
                        {alert.property}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">{alert.timeAgo}</span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-white mb-1 truncate max-w-[240px]">
                        {alert.title}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span
                          className={`font-bold ${
                            alert.rateTagColor === "primary" ? "text-primary" : "text-accent"
                          }`}
                        >
                          {alert.rateTag}
                        </span>
                        <span className="text-muted">{alert.impactText}</span>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[20px] transition-colors ${
                        isSelected ? "text-primary" : "text-muted group-hover:text-primary"
                      }`}
                    >
                      arrow_forward
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Pane: Insight Detail */}
        <section className="flex-1 bg-background-dark flex flex-col relative min-w-0">
          {/* Top Nav Breadcrumb */}
          <div className="h-14 border-b border-border flex items-center justify-between px-8 bg-surface">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted">AI Action Center</span>
              <span className="text-muted">/</span>
              <span className="text-white font-bold">
                {activeAlert.property}: {activeAlert.title}
              </span>
            </div>
            <div className="flex gap-4">
              <button className="text-muted hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[20px]">more_horiz</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <div className="max-w-4xl mx-auto">
              {/* Context Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-sm font-bold uppercase tracking-wider ${
                        activeAlert.priority === "high"
                          ? "bg-intelligence/10 text-intelligence border border-intelligence/30"
                          : "bg-primary/10 text-primary border border-primary/30"
                      }`}
                    >
                      {activeAlert.priority === "high" ? "High Priority" : "Standard Priority"}
                    </span>
                    <span className="text-sm text-muted font-mono">{activeAlert.dateRange}</span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2 font-heading">
                    {activeAlert.title}
                  </h1>
                  <p className="text-muted text-sm max-w-2xl leading-relaxed">
                    {activeAlert.description}
                  </p>
                </div>
              </div>

              {/* Metrics Grid (3 cards matching Stitch) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Metric 1: Current Rate */}
                <div className="bg-surface border border-border rounded-sm p-5">
                  <span className="text-xs text-muted uppercase tracking-widest block mb-2 font-mono">
                    Current Rate
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    ₹{activeAlert.currentRate.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-muted">/night</span>
                  </div>
                </div>

                {/* Metric 2: Suggested Rate (Glowing Cyan) */}
                <div className="bg-surface border border-primary/40 rounded-sm p-5 relative overflow-hidden shadow-[0_0_15px_rgba(24,216,197,0.08)]">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
                  <span className="text-xs text-primary uppercase tracking-widest block mb-2 font-bold flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Suggested Rate
                  </span>
                  <div className="text-2xl font-bold text-primary font-mono">
                    ₹{activeAlert.suggestedRate.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-primary/70">/night</span>
                  </div>
                  <div className="text-xs text-primary/80 mt-2 font-mono font-semibold">
                    {activeAlert.increasePct > 0
                      ? `+${activeAlert.increasePct}% Increase`
                      : `${activeAlert.increasePct}% Match`}
                  </div>
                </div>

                {/* Metric 3: Proj. RevPAR Impact */}
                <div className="bg-surface border border-border rounded-sm p-5">
                  <span className="text-xs text-muted uppercase tracking-widest block mb-2 font-mono">
                    Proj. RevPAR Impact
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    +₹{activeAlert.revparImpact.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-muted">/room</span>
                  </div>
                </div>
              </div>

              {/* Visualization Area: Projected Booking Curve */}
              <div className="bg-surface border border-border rounded-sm p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest font-heading text-white">
                    Projected Booking Velocity Curve
                  </h3>
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2 text-muted">
                      <span className="w-3 h-0.5 bg-muted"></span> Current Trajectory
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <span className="w-3 h-0.5 bg-primary"></span> Optimized (Suggested)
                    </div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="w-full h-64 relative border-l border-b border-border/50">
                  <div className="absolute -left-7 bottom-0 text-[10px] text-muted font-mono">0%</div>
                  <div className="absolute -left-9 top-1/2 text-[10px] text-muted font-mono">50%</div>
                  <div className="absolute -left-11 top-0 text-[10px] text-muted font-mono">100%</div>
                  <div className="absolute -bottom-6 left-0 text-[10px] text-muted font-mono">30d Out</div>
                  <div className="absolute -bottom-6 right-0 text-[10px] text-muted font-mono">Check-in</div>

                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={curveData}>
                      <defs>
                        <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2EC4B6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2EC4B6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="currGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6F7D9E" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6F7D9E" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1C2541",
                          borderColor: "#3A506B",
                          fontSize: "11px",
                          fontFamily: "JetBrains Mono",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="current"
                        stroke="#6F7D9E"
                        strokeWidth={2}
                        fill="url(#currGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="optimized"
                        stroke="#2EC4B6"
                        strokeWidth={2.5}
                        fill="url(#optGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Competitor Context Table: Local Competitor Pulse */}
              <div className="bg-surface border border-border rounded-sm">
                <div className="px-5 py-4 border-b border-border">
                  <h3 className="text-sm font-bold uppercase tracking-widest font-heading text-white">
                    Local Delhi Competitor Pulse
                  </h3>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap font-mono">
                    <thead className="text-xs text-muted border-b border-border/50">
                      <tr>
                        <th className="px-5 py-3 font-normal">Hotel</th>
                        <th className="px-5 py-3 font-normal">Current Rate</th>
                        <th className="px-5 py-3 font-normal">24h Change</th>
                        <th className="px-5 py-3 font-normal">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAlert.competitors.map((comp, idx) => (
                        <tr
                          key={comp.name}
                          className={`hover:bg-highlight/30 transition-colors ${
                            idx < activeAlert.competitors.length - 1 ? "border-b border-border/20" : ""
                          }`}
                        >
                          <td className="px-5 py-3 font-medium text-white">{comp.name}</td>
                          <td className="px-5 py-3 text-white">
                            ₹{comp.rate.toLocaleString("en-IN")}
                          </td>
                          <td
                            className={`px-5 py-3 font-bold ${
                              comp.change.startsWith("+")
                                ? "text-primary"
                                : comp.change.startsWith("-")
                                ? "text-accent"
                                : "text-muted"
                            }`}
                          >
                            {comp.change}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[10px] uppercase font-bold ${
                                comp.status === "Surging"
                                  ? "bg-primary/10 text-primary"
                                  : "border border-border text-muted"
                              }`}
                            >
                              {comp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Footer */}
          <div className="absolute bottom-0 left-0 w-full bg-surface border-t border-border p-6 shadow-[0_-10px_30px_rgba(11,19,43,0.8)] z-20">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-white font-bold font-heading">
                  Push to Channel Manager
                </span>
                <span className="text-xs text-muted">
                  Syncs to MakeMyTrip, Agoda, Booking.com via eZee Centrix immediately.
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (onBackToDashboard) onBackToDashboard();
                  }}
                  className="px-6 py-2.5 text-sm font-bold text-white hover:text-muted transition-colors rounded-sm uppercase tracking-wider"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleUpdateRate}
                  disabled={isUpdating}
                  className={`px-8 py-2.5 text-sm font-bold rounded-sm transition-all flex items-center gap-2 uppercase tracking-wider ${
                    isSynced
                      ? "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                      : "bg-primary hover:bg-[#15bfae] text-[#0B132B] shadow-[0_0_15px_rgba(24,216,197,0.3)] hover:shadow-[0_0_20px_rgba(24,216,197,0.5)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      isUpdating ? "animate-spin" : ""
                    }`}
                  >
                    {isSynced ? "check" : "sync"}
                  </span>
                  {isUpdating ? "Syncing with eZee..." : isSynced ? "Synced" : "Update Rate"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
