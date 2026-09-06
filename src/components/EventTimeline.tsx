"use client";

import React, { useState, useEffect, useMemo } from "react";
import TacticalMapWrapper from "./TacticalMapWrapper";
import type { MapEvent } from "./TacticalDarkMap";

export interface EventItem {
  id: string;
  name: string;
  date: string;
  venueName: string;
  lat: number;
  lng: number;
  impact: "High" | "Medium" | "Low";
  attendance: string;
  distance: string;
  demandForecast?: string;
  icon: string;
  rawEventDate?: string;
}

interface EventTimelineProps {
  onSelectEvent?: (event: EventItem) => void;
  onGeneratePricing?: (event: EventItem) => void;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "coldplay_delhi",
    name: "Coldplay Live Tour 2026",
    date: "NOV 14",
    venueName: "Jawaharlal Nehru Stadium",
    lat: 28.5828,
    lng: 77.2344,
    impact: "High",
    attendance: "65,000",
    distance: "1.3 mi (2.1 km)",
    demandForecast: "+42% Forecasted Demand",
    icon: "stadium",
    rawEventDate: "2026-11-14",
  },
  {
    id: "tech_expo",
    name: "India International Tech Expo",
    date: "NOV 18",
    venueName: "Bharat Mandapam (Pragati Maidan)",
    lat: 28.6184,
    lng: 77.2415,
    impact: "High",
    attendance: "42,000",
    distance: "2.4 mi (3.8 km)",
    demandForecast: "+28% Forecasted Demand",
    icon: "business_center",
    rawEventDate: "2026-11-18",
  },
  {
    id: "delhi_marathon",
    name: "Delhi Half Marathon 2026",
    date: "NOV 24",
    venueName: "JLN Stadium & Central Vista",
    lat: 28.5828,
    lng: 77.2344,
    impact: "Medium",
    attendance: "28,000",
    distance: "1.3 mi (2.1 km)",
    demandForecast: "+18% Forecasted Demand",
    icon: "sports_score",
    rawEventDate: "2026-11-24",
  },
  {
    id: "fintech_summit",
    name: "Global Fintech Summit 2026",
    date: "DEC 02",
    venueName: "Yashobhoomi IICC, Dwarka",
    lat: 28.5524,
    lng: 77.0583,
    impact: "High",
    attendance: "45,000",
    distance: "11.5 mi (18.5 km)",
    demandForecast: "+34% Forecasted Demand",
    icon: "domain",
    rawEventDate: "2026-12-02",
  },
];

export default function EventTimeline({ onSelectEvent, onGeneratePricing }: EventTimelineProps) {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("High");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(INITIAL_EVENTS[0]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/timeline");
      const json = await res.json();

      if (json?.events && json.events.length > 0) {
        const mapped: EventItem[] = json.events.map((e: any) => {
          const isHigh = e.expectedAttendance > 40000 || e.surgePercentage > 25;
          const isMed = e.expectedAttendance >= 15000 && !isHigh;
          const impact = isHigh ? "High" : isMed ? "Medium" : "Low";

          const dObj = new Date(e.eventDate);
          const dateStr = dObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return {
            id: String(e.id),
            name: e.name,
            date: dateStr.toUpperCase(),
            venueName: e.venueName,
            lat: typeof e.lat === "number" ? e.lat : 28.5828,
            lng: typeof e.lng === "number" ? e.lng : 77.2344,
            impact,
            attendance: e.expectedAttendance.toLocaleString("en-IN"),
            distance: `${e.distanceMiles || 1.3} mi (${e.distanceKm || 2.1} km)`,
            demandForecast: `+${e.surgePercentage || 24}% Forecasted Demand`,
            icon:
              e.category?.includes("Concert") || e.category?.includes("Music")
                ? "stadium"
                : e.category?.includes("Medical")
                ? "local_hospital"
                : "business_center",
            rawEventDate: e.eventDate,
          };
        });

        setEvents(mapped);
        setSelectedEvent(mapped[0]);
      }
    } catch (err) {
      console.error("Error loading events:", err);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    return e.impact === filter;
  });

  const handleGenerateClick = async (event: EventItem) => {
    setGeneratingId(event.id);
    try {
      await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: 1,
          targetDate: event.rawEventDate || new Date().toISOString().split("T")[0],
          eventName: event.name,
        }),
      });
      if (onGeneratePricing) {
        onGeneratePricing(event);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingId(null);
    }
  };

  const active = selectedEvent || events[0];

  const mapEvents: MapEvent[] = useMemo(() => {
    return events.map((e) => ({
      id: e.id,
      name: e.name,
      venueName: e.venueName,
      lat: e.lat,
      lng: e.lng,
      date: e.date,
      attendance: e.attendance,
      impact: e.impact,
      radiusMeters: e.impact === "High" ? 4500 : 3500,
      demandForecast: e.demandForecast || "+24% Forecasted Demand",
      distanceToClaridges: e.distance,
    }));
  }, [events]);

  const focusedLocation = useMemo(() => {
    if (!active) return null;
    return {
      lat: active.lat,
      lng: active.lng,
      zoom: 13,
      id: active.id,
    };
  }, [active]);

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* Main Split-Pane matching Google Stitch */}
      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Pane: Timeline (50%) */}
        <section className="w-full md:w-1/2 flex flex-col h-full border-r border-[#3A506B] bg-[#0B132B]">
          {/* Header */}
          <header className="px-6 py-6 border-b border-[#3A506B]">
            <h2 className="text-[32px] font-bold leading-tight font-heading mb-2">
              Event Intelligence
            </h2>
            <p className="text-muted text-sm font-normal">
              Correlate Delhi NCR city events with occupancy forecasting
            </p>

            {/* Filters */}
            <div className="flex gap-3 mt-4 flex-wrap">
              <button
                onClick={() => setFilter("High")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors ${
                  filter === "High"
                    ? "bg-intelligence bg-opacity-10 border border-intelligence"
                    : "bg-surface border border-[#3A506B]"
                }`}
              >
                <p
                  className={`text-xs font-mono font-bold ${
                    filter === "High" ? "text-intelligence" : "text-muted"
                  }`}
                >
                  High Impact
                </p>
              </button>

              <button
                onClick={() => setFilter("Medium")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors ${
                  filter === "Medium"
                    ? "bg-primary bg-opacity-10 border border-primary"
                    : "bg-surface border border-[#3A506B]"
                }`}
              >
                <p
                  className={`text-xs font-mono font-bold ${
                    filter === "Medium" ? "text-primary" : "text-muted"
                  }`}
                >
                  Medium Impact
                </p>
              </button>

              <button
                onClick={() => setFilter("Low")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors ${
                  filter === "Low"
                    ? "bg-muted bg-opacity-20 border border-muted"
                    : "bg-surface border border-[#3A506B]"
                }`}
              >
                <p
                  className={`text-xs font-mono font-medium ${
                    filter === "Low" ? "text-white" : "text-muted"
                  }`}
                >
                  Low Impact
                </p>
              </button>

              <button
                onClick={() => setFilter("all")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors ${
                  filter === "all"
                    ? "bg-highlight border border-border"
                    : "bg-surface border border-[#3A506B]"
                }`}
              >
                <p
                  className={`text-xs font-mono ${
                    filter === "all" ? "text-white font-bold" : "text-muted"
                  }`}
                >
                  All Events
                </p>
              </button>
            </div>
          </header>

          {/* Timeline Scroll Area */}
          <div className="flex-1 overflow-y-auto timeline-scroll p-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-10 top-6 bottom-0 w-[2px] bg-[#3A506B] z-0"></div>

            {/* Event Cards */}
            <div className="space-y-6 relative z-10">
              {filteredEvents.map((event) => {
                const isSelected = active?.id === event.id;
                const isHigh = event.impact === "High";

                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      if (onSelectEvent) onSelectEvent(event);
                    }}
                    className="flex gap-6 group cursor-pointer"
                  >
                    {/* Timeline Node */}
                    <div className="flex flex-col items-center mt-1">
                      <div
                        className={`w-8 h-8 rounded-full bg-surface border-2 flex items-center justify-center z-10 transition-colors ${
                          isHigh
                            ? "border-intelligence group-hover:bg-intelligence group-hover:text-background-base"
                            : "border-primary group-hover:bg-primary group-hover:text-background-base"
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{event.icon}</span>
                      </div>
                    </div>

                    {/* Event Card Content */}
                    <div
                      className={`flex-1 bg-surface border rounded p-4 transition-colors relative overflow-hidden ${
                        isSelected
                          ? isHigh
                            ? "border-intelligence shadow-[0_0_15px_rgba(255,159,28,0.2)]"
                            : "border-primary shadow-[0_0_15px_rgba(46,196,182,0.2)]"
                          : "border-[#3A506B] hover:border-primary"
                      }`}
                    >
                      {/* Left color bar */}
                      <div
                        className={`absolute top-0 left-0 w-1 h-full ${
                          isHigh ? "bg-intelligence" : "bg-primary"
                        }`}
                      />

                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-primary font-mono mb-1">{event.date}</p>
                          <h3 className="text-lg font-bold text-white font-heading">{event.name}</h3>
                          <p className="text-xs text-muted font-mono">{event.venueName}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-[10px] font-mono border rounded ${
                            isHigh
                              ? "bg-intelligence bg-opacity-10 text-intelligence border-intelligence font-bold"
                              : "bg-primary bg-opacity-10 text-primary border-primary font-medium"
                          }`}
                        >
                          {event.impact.toUpperCase()} IMPACT
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-muted mb-1 font-mono">Expected Attendance</p>
                          <p className="text-sm font-mono text-white font-bold">
                            {event.attendance}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-1 font-mono">Distance to Claridges</p>
                          <p className="text-sm font-mono text-white font-bold">{event.distance}</p>
                        </div>
                      </div>

                      {event.demandForecast && (
                        <div className="mt-4 pt-4 border-t border-[#3A506B] flex justify-between items-center">
                          <div className="flex items-center gap-2 text-primary font-mono text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            <span>{event.demandForecast}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateClick(event);
                            }}
                            disabled={generatingId === event.id}
                            className="bg-primary hover:bg-[#15bfae] text-background-base px-3 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-[0_0_10px_rgba(46,196,182,0.3)] disabled:opacity-50"
                          >
                            {generatingId === event.id ? "Analyzing..." : "Generate Pricing"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Pane: Tactical Real Leaflet Event Map (50%) */}
        <section className="hidden md:flex md:w-1/2 relative h-full overflow-hidden bg-[#050914] border-l border-[#3A506B]">
          <TacticalMapWrapper
            center={[active?.lat || 28.5828, active?.lng || 77.2344]}
            zoom={13}
            focusedLocation={focusedLocation}
            activeEventId={active?.id}
            events={mapEvents}
            showControls={true}
            showFilters={true}
            showConnectionLines={true}
            onSelectEvent={(ev) => {
              const match = events.find((e) => e.id === ev.id);
              if (match) {
                setSelectedEvent(match);
                if (onSelectEvent) onSelectEvent(match);
              }
            }}
            onQuickReview={() => {
              if (active) handleGenerateClick(active);
            }}
          />

          {/* Tactical Active Venue Surveillance HUD Overlay */}
          {active && (
            <div className="absolute top-16 left-4 bg-surface/95 border border-intelligence px-3.5 py-2.5 rounded shadow-2xl backdrop-blur-md z-[400] max-w-sm pointer-events-none">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-intelligence text-base animate-pulse">radar</span>
                <span className="font-mono text-[10px] uppercase font-bold text-intelligence tracking-wider">
                  Tactical Surveillance Focus
                </span>
              </div>
              <h4 className="font-heading text-sm font-bold text-white truncate">{active.name}</h4>
              <p className="text-[11px] text-primary font-mono">{active.venueName}</p>
              <div className="flex items-center gap-4 mt-2 text-[11px] font-mono text-muted">
                <span>Expected: <strong className="text-white">{active.attendance}</strong></span>
                <span>Distance: <strong className="text-white">{active.distance}</strong></span>
              </div>
              {active.demandForecast && (
                <div className="mt-2 text-[10px] font-mono text-intelligence bg-intelligence/15 px-2 py-0.5 rounded inline-block font-bold">
                  {active.demandForecast}
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
