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

export interface RoomCategory {
  id: string;
  name: string;
  specs: string;
  currentRate: number;
  suggestedRate: number;
  gain: number;
  increasePct: number;
  totalRooms: number;
  bookedRooms: number;
  occupancy: number;
  icon: string;
}

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
  description: string;
  roomTypes: RoomCategory[];
  competitors: Array<{
    name: string;
    rate: number;
    change: string;
    status: "Price Raised" | "Steady";
  }>;
}

const DEFAULT_ROOM_TYPES: RoomCategory[] = [
  {
    id: "superior",
    name: "Superior Room",
    specs: "280 sq ft • King or Twin Bed • City View",
    currentRate: 5800,
    suggestedRate: 7200,
    gain: 1400,
    increasePct: 24.1,
    totalRooms: 140,
    bookedRooms: 108,
    occupancy: 77,
    icon: "hotel",
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    specs: "320 sq ft • Pool & Runway View • Large Work Desk",
    currentRate: 6900,
    suggestedRate: 8450,
    gain: 1550,
    increasePct: 22.5,
    totalRooms: 85,
    bookedRooms: 61,
    occupancy: 72,
    icon: "flight_takeoff",
  },
  {
    id: "executive",
    name: "Executive Room",
    specs: "360 sq ft • High Floor • Airport Transfer & Lounge Access",
    currentRate: 8500,
    suggestedRate: 10600,
    gain: 2100,
    increasePct: 24.7,
    totalRooms: 42,
    bookedRooms: 27,
    occupancy: 64,
    icon: "meeting_room",
  },
  {
    id: "suite",
    name: "Executive Suite",
    specs: "550 sq ft • 1-Bedroom Luxury Suite • VIP Airport Transfer",
    currentRate: 12500,
    suggestedRate: 15400,
    gain: 2900,
    increasePct: 23.2,
    totalRooms: 20,
    bookedRooms: 10,
    occupancy: 50,
    icon: "king_bed",
  },
];

const AEROCITY_ALERTS: AlertItem[] = [
  {
    id: "yashobhoomi_aviation",
    property: "Lemon Tree Aerocity",
    propertyName: "Lemon Tree Premier, Delhi Airport (Aerocity)",
    title: "Aviation India Expo @ Yashobhoomi & Airport Surge",
    rateTag: "+24.1% Average",
    rateTagColor: "primary",
    impactText: "Earn +₹1,400 to +₹2,900 more per room",
    timeAgo: "Just now",
    priority: "high",
    dateRange: "Next Weekend (Nov 14 - 16)",
    description:
      "Aviation India Expo at Yashobhoomi IICC Dwarka (8.2 km via UER-II) plus peak flight transit traffic at IGI Terminal 3 have pushed Aerocity hotel prices up by 18%. With 75% of our 287 rooms booked, updating prices across our 4 room categories will capture an estimated ₹3.42L additional revenue without losing bookings.",
    roomTypes: DEFAULT_ROOM_TYPES,
    competitors: [
      { name: "Aloft New Delhi Aerocity", rate: 8400, change: "+12%", status: "Price Raised" },
      { name: "Holiday Inn Express Aerocity", rate: 6900, change: "+8%", status: "Price Raised" },
      { name: "Novotel New Delhi Aerocity", rate: 9200, change: "+15%", status: "Price Raised" },
      { name: "Pullman New Delhi Aerocity", rate: 12800, change: "+10%", status: "Price Raised" },
      { name: "Ibis New Delhi Aerocity", rate: 4600, change: "0%", status: "Steady" },
    ],
  },
  {
    id: "delhi_transit_layover",
    property: "Lemon Tree Aerocity",
    propertyName: "Lemon Tree Premier, Delhi Airport (Aerocity)",
    title: "Weekend Airport Layover Compression",
    rateTag: "+₹1,100 Increase",
    rateTagColor: "primary",
    impactText: "High Airport Footfall",
    timeAgo: "1h ago",
    priority: "med",
    dateRange: "Oct 28 - Oct 30",
    description:
      "IGI Airport T3 scheduled flight diversions and weekend transit traffic are creating high demand for walk-in and OTA same-day bookings. Recommended adjustment ensures optimal pricing for Superior and Deluxe categories.",
    roomTypes: DEFAULT_ROOM_TYPES.map((r) => ({
      ...r,
      suggestedRate: Math.round(r.currentRate * 1.16),
      gain: Math.round(r.currentRate * 0.16),
      increasePct: 16.0,
    })),
    competitors: [
      { name: "Holiday Inn Express Aerocity", rate: 6900, change: "+8%", status: "Price Raised" },
      { name: "Aloft New Delhi Aerocity", rate: 8200, change: "+6%", status: "Price Raised" },
      { name: "Ibis New Delhi Aerocity", rate: 4600, change: "0%", status: "Steady" },
    ],
  },
  {
    id: "auto_expo_dwarka",
    property: "Lemon Tree Aerocity",
    propertyName: "Lemon Tree Premier, Delhi Airport (Aerocity)",
    title: "Global EV Summit at Yashobhoomi",
    rateTag: "+22% Increase",
    rateTagColor: "primary",
    impactText: "Earn +₹1,550 more per room",
    timeAgo: "3h ago",
    priority: "med",
    dateRange: "Nov 22 - Nov 25",
    description:
      "Global Electric Vehicle & Mobility Summit at Yashobhoomi Dwarka brings over 50,000 delegates. Aerocity hotels are rapidly selling out corporate tiers. Recommend locking in higher rates for Executive Rooms and Suites early.",
    roomTypes: DEFAULT_ROOM_TYPES.map((r) => ({
      ...r,
      suggestedRate: Math.round(r.currentRate * 1.22),
      gain: Math.round(r.currentRate * 0.22),
      increasePct: 22.0,
    })),
    competitors: [
      { name: "Novotel New Delhi Aerocity", rate: 9400, change: "+14%", status: "Price Raised" },
      { name: "Pullman New Delhi Aerocity", rate: 13200, change: "+12%", status: "Price Raised" },
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
  const [selectedId, setSelectedId] = useState<string>(selectedAlertId || "yashobhoomi_aviation");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("superior");
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

  const activeAlert = AEROCITY_ALERTS.find((a) => a.id === selectedId) || AEROCITY_ALERTS[0];
  const activeRoom =
    activeAlert.roomTypes.find((r) => r.id === selectedRoomId) || activeAlert.roomTypes[0];

  const filteredAlerts = AEROCITY_ALERTS.filter((item) => {
    if (filter === "high") return item.priority === "high";
    if (filter === "saved") return false;
    return true;
  });

  const curveData =
    livePaceCurve.length > 0
      ? livePaceCurve
      : [
          { day: "30 Days Out", current: 18, optimized: 16 },
          { day: "20 Days Out", current: 48, optimized: 44 },
          { day: "10 Days Out", current: 74, optimized: 70 },
          { day: "5 Days Out", current: 80, optimized: 86 },
          { day: "1 Day Out", current: 84, optimized: 96 },
          { day: "Check-in Day", current: 86, optimized: 99 },
        ];

  const handleUpdateAllRates = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/recommendations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: 1,
          hotelId: 1,
          customRate: activeRoom.suggestedRate,
        }),
      });
      await res.json();

      setIsUpdating(false);
      setIsSynced(true);
      if (onSyncSuccess) {
        onSyncSuccess(
          `Updated all 4 room categories for Lemon Tree Premier Aerocity (Superior ₹7,200, Deluxe ₹8,450, Executive ₹10,600, Suite ₹15,400) on MakeMyTrip, Booking.com, Agoda, and front desk!`
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
    <div className="flex flex-1 h-full w-full overflow-hidden antialiased bg-[#0B132B] text-white font-body selection:bg-primary selection:text-background-dark">
      {/* Main Split-Pane */}
      <main className="flex w-full h-full">
        {/* Left Pane: Suggestions List (360px) */}
        <aside className="w-[360px] h-full bg-surface border-r border-border flex flex-col flex-shrink-0 z-10">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-surface sticky top-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-intelligence text-[22px]">lightbulb</span>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white font-heading">
                Price Suggestions
              </h2>
            </div>
            <span className="text-xs text-muted border border-border rounded-sm px-2 py-0.5 font-mono">
              {filteredAlerts.length} available
            </span>
          </div>

          {/* Filter Pills */}
          <div className="px-4 py-3 border-b border-border flex gap-2 overflow-x-auto bg-[#141b33]">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors font-mono cursor-pointer ${
                filter === "all"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              All Suggestions
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors font-mono cursor-pointer ${
                filter === "high"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              High Demand
            </button>
            <button
              onClick={() => setFilter("saved")}
              className={`px-3 py-1 text-xs rounded-sm border whitespace-nowrap transition-colors font-mono cursor-pointer ${
                filter === "saved"
                  ? "bg-highlight text-white border-border font-bold"
                  : "bg-transparent text-muted hover:text-white border-transparent"
              }`}
            >
              Saved
            </button>
          </div>

          {/* List of Suggestions */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {filteredAlerts.map((alert) => {
              const isSelected = alert.id === selectedId;
              return (
                <div
                  key={alert.id}
                  onClick={() => {
                    setSelectedId(alert.id);
                    setIsSynced(false);
                  }}
                  className={`h-[110px] rounded-sm p-3.5 flex flex-col justify-between cursor-pointer transition-all relative group ${
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
                      <span className="text-xs font-bold text-white uppercase tracking-wider truncate max-w-[180px] font-mono">
                        {alert.property}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono">{alert.timeAgo}</span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium text-white mb-1 truncate max-w-[220px]">
                        {alert.title}
                      </p>
                      <div className="flex gap-2 text-xs font-mono">
                        <span
                          className={`font-bold ${
                            alert.rateTagColor === "primary" ? "text-primary" : "text-accent"
                          }`}
                        >
                          {alert.rateTag}
                        </span>
                        <span className="text-muted truncate max-w-[150px]">{alert.impactText}</span>
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

        {/* Right Pane: Room Types & Pricing Details */}
        <section className="flex-1 bg-background-dark flex flex-col relative min-w-0">
          {/* Top Breadcrumb */}
          <div className="h-14 border-b border-border flex items-center justify-between px-8 bg-surface">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted">Lemon Tree Aerocity</span>
              <span className="text-muted">/</span>
              <span className="text-white font-bold">
                {activeAlert.title}
              </span>
            </div>
            <span className="text-xs text-muted font-mono">{activeAlert.dateRange}</span>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 pb-32">
            <div className="max-w-5xl mx-auto space-y-8">
              {/* Event Context Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-2.5 py-1 text-xs rounded-sm font-bold uppercase tracking-wider font-mono ${
                      activeAlert.priority === "high"
                        ? "bg-intelligence/10 text-intelligence border border-intelligence/30"
                        : "bg-primary/10 text-primary border border-primary/30"
                    }`}
                  >
                    {activeAlert.priority === "high" ? "High Demand — Action Recommended" : "Market Price Update"}
                  </span>
                  <span className="text-sm text-muted font-mono">{activeAlert.dateRange}</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 font-heading">
                  {activeAlert.title}
                </h1>
                <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
                  {activeAlert.description}
                </p>
              </div>

              {/* 3 Live Telemetry Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Rooms Booked Today */}
                <div className="bg-surface border border-[#3A506B] rounded-sm p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] uppercase font-bold text-muted tracking-wider">
                      Rooms Booked Today
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/30">
                      Live Front Desk
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">75%</span>
                    <span className="text-xs text-muted font-mono">216 of 287 rooms booked</span>
                  </div>
                  <div className="w-full bg-[#0B132B] rounded-full h-1.5 mt-3 overflow-hidden border border-[#3A506B]/40">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                </div>

                {/* Aerocity Average Price */}
                <div className="bg-surface border border-[#3A506B] rounded-sm p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] uppercase font-bold text-muted tracking-wider">
                      Aerocity Average Price
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Up 18% This Week
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-white">₹9,200</span>
                    <span className="text-xs text-muted font-mono">across 5 Aerocity hotels</span>
                  </div>
                  <p className="text-[11px] text-muted mt-3 truncate">
                    Aloft & Novotel leading weekend price surge
                  </p>
                </div>

                {/* Major Demand Driver */}
                <div className="bg-surface border border-intelligence/40 rounded-sm p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] uppercase font-bold text-intelligence tracking-wider">
                      Major Demand Driver
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-intelligence/15 text-intelligence border border-intelligence/30">
                      High Surge
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white font-heading truncate mt-1">
                    Aviation India Expo & Trade Meet
                  </p>
                  <p className="text-[11px] text-muted font-mono mt-1">
                    Yashobhoomi IICC Dwarka (8.2 km • 48k attendees)
                  </p>
                </div>
              </div>

              {/* CORE SECTION: TYPES OF ROOMS VISIBLE WITH RESPECTIVE PRICING */}
              <div className="bg-surface border border-primary/40 rounded-sm p-6 shadow-[0_0_20px_rgba(46,196,182,0.1)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-[#3A506B]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">bedroom_parent</span>
                      <h2 className="text-base font-bold text-white font-heading">
                        Room Types & Respective Pricing
                      </h2>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/30 text-[10px] font-mono font-bold rounded">
                        4 Categories
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      Click any room type below to inspect its pricing curve and competitor comparison.
                    </p>
                  </div>
                  <span className="text-xs text-primary font-mono font-semibold mt-2 sm:mt-0">
                    Active: <strong className="text-white">{activeRoom.name}</strong>
                  </span>
                </div>

                {/* 4 Room Types Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeAlert.roomTypes.map((room) => {
                    const isSelected = room.id === selectedRoomId;
                    return (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`rounded-sm p-4 border transition-all cursor-pointer flex flex-col justify-between relative ${
                          isSelected
                            ? "bg-highlight border-2 border-primary shadow-[0_0_15px_rgba(46,196,182,0.3)] ring-1 ring-primary"
                            : "bg-[#0B132B] border-[#3A506B] hover:border-primary/60 hover:bg-[#131d3b]"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <span className="size-2 rounded-full bg-primary animate-ping"></span>
                          </div>
                        )}

                        <div>
                          {/* Room Category Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              {room.icon}
                            </span>
                            <h3 className="font-heading font-bold text-sm text-white">
                              {room.name}
                            </h3>
                          </div>
                          <p className="text-[11px] text-muted leading-tight mb-4 min-h-[32px]">
                            {room.specs}
                          </p>

                          {/* Room Pricing Comparison */}
                          <div className="space-y-2 bg-surface/80 p-2.5 rounded border border-[#3A506B]/60 font-mono mb-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted">Current:</span>
                              <span className="text-slate-300 font-medium">
                                ₹{room.currentRate.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-primary font-bold">Recommended:</span>
                              <span className="text-primary font-bold text-sm">
                                ₹{room.suggestedRate.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-[#3A506B]/40 flex justify-between items-center text-[11px]">
                              <span className="text-emerald-400 font-bold">Gain:</span>
                              <span className="text-emerald-400 font-bold">
                                +₹{room.gain.toLocaleString("en-IN")} (+{room.increasePct}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Occupancy Indicator */}
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-muted mb-1">
                            <span>Booked:</span>
                            <span className="text-white font-bold">
                              {room.bookedRooms}/{room.totalRooms} ({room.occupancy}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#0B132B] rounded-full h-1 overflow-hidden">
                            <div
                              className="bg-primary h-1 rounded-full"
                              style={{ width: `${room.occupancy}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVE ROOM DETAIL HERO PRICING CARD */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metric 1: Current Price */}
                <div className="bg-surface border border-border rounded-sm p-5">
                  <span className="text-xs text-muted uppercase tracking-wider block mb-2 font-mono">
                    Current Price • {activeRoom.name}
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    ₹{activeRoom.currentRate.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-muted ml-1">/ night</span>
                  </div>
                  <p className="text-xs text-muted mt-2">Current price on MakeMyTrip, Agoda & Booking.com</p>
                </div>

                {/* Metric 2: Recommended Price */}
                <div className="bg-surface border border-primary/50 rounded-sm p-5 relative overflow-hidden shadow-[0_0_15px_rgba(24,216,197,0.12)]">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
                  <span className="text-xs text-primary uppercase tracking-wider block mb-2 font-bold flex items-center gap-1 font-mono">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Recommended Price • {activeRoom.name}
                  </span>
                  <div className="text-2xl font-bold text-primary font-mono">
                    ₹{activeRoom.suggestedRate.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-primary/70 ml-1">/ night</span>
                  </div>
                  <div className="text-xs text-primary/80 mt-2 font-mono font-semibold">
                    +₹{activeRoom.gain.toLocaleString("en-IN")} (+{activeRoom.increasePct}% increase)
                  </div>
                </div>

                {/* Metric 3: Extra Revenue */}
                <div className="bg-surface border border-border rounded-sm p-5">
                  <span className="text-xs text-muted uppercase tracking-wider block mb-2 font-mono">
                    Estimated Extra Earnings
                  </span>
                  <div className="text-2xl font-bold text-white font-mono">
                    +₹{activeRoom.gain.toLocaleString("en-IN")}
                    <span className="text-xs font-normal text-muted ml-1">/ room booked</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-mono mt-2">
                    +₹{((activeRoom.totalRooms - activeRoom.bookedRooms) * activeRoom.gain).toLocaleString("en-IN")} potential category gain
                  </p>
                </div>
              </div>

              {/* Chart: Expected Booking Speed */}
              <div className="bg-surface border border-border rounded-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-heading text-white">
                      Expected Room Booking Speed ({activeRoom.name})
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      How fast rooms will fill up between now and check-in day in Aerocity
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-mono">
                    <div className="flex items-center gap-2 text-muted">
                      <span className="w-3 h-0.5 bg-muted"></span> At Current Price (₹{activeRoom.currentRate.toLocaleString("en-IN")})
                    </div>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="w-3 h-0.5 bg-primary"></span> With Recommended (₹{activeRoom.suggestedRate.toLocaleString("en-IN")})
                    </div>
                  </div>
                </div>

                <div className="w-full h-64 relative border-l border-b border-border/50">
                  <div className="absolute -left-7 bottom-0 text-[10px] text-muted font-mono">0%</div>
                  <div className="absolute -left-9 top-1/2 text-[10px] text-muted font-mono">50%</div>
                  <div className="absolute -left-11 top-0 text-[10px] text-muted font-mono">100%</div>
                  <div className="absolute -bottom-6 left-0 text-[10px] text-muted font-mono">30 Days Out</div>
                  <div className="absolute -bottom-6 right-0 text-[10px] text-muted font-mono">Check-in Day</div>

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
                          fontSize: "12px",
                          fontFamily: "JetBrains Mono",
                          color: "#FFFFFF",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="current"
                        name="Current Rate % Booked"
                        stroke="#6F7D9E"
                        strokeWidth={2}
                        fill="url(#currGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="optimized"
                        name="Recommended Rate % Booked"
                        stroke="#2EC4B6"
                        strokeWidth={2.5}
                        fill="url(#optGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Aerocity Competitor Prices Table */}
              <div className="bg-surface border border-border rounded-sm">
                <div className="px-5 py-4 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider font-heading text-white">
                      What Nearby Aerocity Hotels Are Charging Today
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Competitor prices in the Aerocity Hospitality District
                    </p>
                  </div>
                  <span className="text-xs text-muted font-mono">Comparing with: {activeRoom.name}</span>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap font-body">
                    <thead className="text-xs text-muted border-b border-border/50 font-mono">
                      <tr>
                        <th className="px-5 py-3 font-medium">Hotel</th>
                        <th className="px-5 py-3 font-medium">Current Online Price</th>
                        <th className="px-5 py-3 font-medium">Change in 24 Hours</th>
                        <th className="px-5 py-3 font-medium">Market Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {activeAlert.competitors.map((comp, idx) => (
                        <tr
                          key={comp.name}
                          className={`hover:bg-highlight/30 transition-colors ${
                            idx < activeAlert.competitors.length - 1 ? "border-b border-border/20" : ""
                          }`}
                        >
                          <td className="px-5 py-3 font-medium text-white font-body">{comp.name}</td>
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
                                comp.status === "Price Raised"
                                  ? "bg-primary/10 text-primary border border-primary/30"
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

          {/* Sticky Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 w-full bg-surface border-t border-border p-5 shadow-[0_-10px_30px_rgba(11,19,43,0.8)] z-20">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-white font-bold font-heading">
                  Apply Recommended Prices for Lemon Tree Aerocity
                </span>
                <span className="text-xs text-muted">
                  Updates Superior (₹7,200), Deluxe (₹8,450), Executive (₹10,600), Suite (₹15,400) on MakeMyTrip, Booking.com & Agoda.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (onBackToDashboard) onBackToDashboard();
                  }}
                  className="px-5 py-2.5 text-xs font-mono font-bold text-muted hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                >
                  Not Now
                </button>
                <button
                  onClick={handleUpdateAllRates}
                  disabled={isUpdating}
                  className={`px-7 py-2.5 text-xs font-mono font-bold rounded-sm transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer ${
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
                  {isUpdating
                    ? "Updating All Booking Sites..."
                    : isSynced
                    ? "Updated & Live Everywhere!"
                    : "Apply All 4 Room Rates"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
