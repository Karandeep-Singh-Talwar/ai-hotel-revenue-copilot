"use client";

import React, { useState, useEffect } from "react";

export interface EventItem {
  id: string;
  name: string;
  date: string;
  venueName: string;
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

export default function EventTimeline({ onSelectEvent, onGeneratePricing }: EventTimelineProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("High");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [mapZoom, setMapZoom] = useState(1);
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
            impact,
            attendance: e.expectedAttendance.toLocaleString("en-IN"),
            distance: `${e.distanceMiles || 1.3} mi (${e.distanceKm || 2.1} km)`,
            demandForecast: `+${e.surgePercentage || 24}% Forecasted Demand`,
            icon:
              e.category.includes("Concert") || e.category.includes("Music")
                ? "stadium"
                : e.category.includes("Medical")
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
                  className={`text-xs font-mono ${
                    filter === "Medium" ? "text-primary font-bold" : "text-muted"
                  }`}
                >
                  Medium Impact
                </p>
              </button>

              <button
                onClick={() => setFilter("Low")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors ${
                  filter === "Low"
                    ? "bg-primary bg-opacity-10 border border-primary"
                    : "bg-surface border border-[#3A506B]"
                }`}
              >
                <p
                  className={`text-xs font-mono ${
                    filter === "Low" ? "text-primary font-bold" : "text-muted"
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

        {/* Right Pane: Tactical Event Map (50%) */}
        <section className="hidden md:flex md:w-1/2 bg-surface relative h-full overflow-hidden select-none">
          {/* Tactical Map Canvas */}
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-300"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,159,28,0.18) 0%, transparent 60%), linear-gradient(rgba(11,19,43,0.7), rgba(5,9,20,0.85)), url('/stitch/events.png')`,
              backgroundBlendMode: "overlay",
              transform: `scale(${mapZoom})`,
            }}
          />

          {/* Tactical Vector Grid Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <defs>
              <pattern id="event-grid-delhi" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3A506B" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#event-grid-delhi)" />
          </svg>

          {/* Map Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 0.2, 1.8))}
              className="bg-surface border border-[#3A506B] text-white p-2 rounded shadow-lg hover:bg-[#2A375C] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">zoom_in</span>
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 0.2, 0.8))}
              className="bg-surface border border-[#3A506B] text-white p-2 rounded shadow-lg hover:bg-[#2A375C] transition-colors"
            >
              <span className="material-symbols-outlined text-sm">zoom_out</span>
            </button>
          </div>

          {/* Tactical Radar Pulse & Markers */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            {/* Concentric Pulse Rings */}
            <div className="absolute inset-0 m-auto w-52 h-52 bg-intelligence bg-opacity-10 rounded-full border border-intelligence border-opacity-30 animate-pulse" />
            <div className="absolute inset-0 m-auto w-36 h-36 bg-intelligence bg-opacity-20 rounded-full border border-intelligence border-opacity-50" />

            {/* Event Center Pin */}
            <div className="absolute inset-0 m-auto w-5 h-5 bg-intelligence rounded-full shadow-[0_0_18px_rgba(255,159,28,0.9)] z-20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[12px] text-background-base font-bold">
                star
              </span>
            </div>

            {/* Client Properties (The Claridges & The Manor) */}
            <div className="absolute -top-14 -left-16 w-3.5 h-3.5 bg-background-base border-2 border-primary rounded shadow-[0_0_8px_rgba(46,196,182,0.6)] z-20" />
            <div className="absolute top-12 left-20 w-3.5 h-3.5 bg-background-base border-2 border-primary rounded shadow-[0_0_8px_rgba(46,196,182,0.6)] z-20" />
          </div>

          {/* Floating Venue Tag */}
          {active && (
            <div className="absolute top-[40%] left-[53%] bg-surface/95 border border-intelligence/70 px-3.5 py-2 rounded shadow-xl backdrop-blur-xs pointer-events-none z-20">
              <p className="text-xs font-bold text-white font-heading">{active.name}</p>
              <p className="text-[10px] text-intelligence font-mono">
                {active.venueName} • {active.attendance} Expected
              </p>
              <p className="text-[10px] text-muted font-mono">{active.distance} to Claridges</p>
            </div>
          )}

          {/* Map Legend Bottom Bar */}
          <div className="absolute bottom-6 left-6 right-6 bg-surface border border-[#3A506B] p-3 rounded flex items-center justify-between shadow-xl z-20">
            <div className="flex items-center gap-5 text-xs font-mono text-muted">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-intelligence rounded-full shadow-[0_0_6px_rgba(255,159,28,0.8)]"></div>
                <span>Venue Surge Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 border border-primary bg-background-base"></div>
                <span>Claridges & Manor</span>
              </div>
            </div>
            <div className="text-xs text-muted font-mono">Radius: 3.5 km</div>
          </div>
        </section>
      </main>
    </div>
  );
}
