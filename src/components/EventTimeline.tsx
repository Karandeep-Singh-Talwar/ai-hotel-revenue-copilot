"use client";

import React, { useState, useEffect, useMemo } from "react";
import TacticalMapWrapper from "./TacticalMapWrapper";
import type { MapEvent } from "./TacticalDarkMap";
import { getShortName } from "./CompetitorMatrix";

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

export interface EventTimelineProps {
  onSelectEvent?: (event: EventItem) => void;
  onGeneratePricing?: (event: EventItem) => void;
  onCompetitorToggled?: (msg: string) => void;
  onNavigateToTab?: (tab: "listings" | "action_center" | "matrix" | "events") => void;
  activeCompetitors?: string[];
  onToggleCompetitor?: (hotelName: string) => void;
}

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "yashobhoomi_aviation",
    name: "Aviation India Expo & Trade Summit",
    date: "NOV 14",
    venueName: "Yashobhoomi IICC, Dwarka (Sector 25)",
    lat: 28.5524,
    lng: 77.0583,
    impact: "High",
    attendance: "48,000",
    distance: "8.2 km (12 mins)",
    demandForecast: "+42% more guests looking for rooms",
    icon: "flight_takeoff",
    rawEventDate: "2026-11-14",
  },
  {
    id: "airport_transit_surge",
    name: "IGI Airport Weekend Transit Peak",
    date: "NOV 18",
    venueName: "IGI Airport Terminal 3 (Aerocity Corridor)",
    lat: 28.5562,
    lng: 77.0855,
    impact: "High",
    attendance: "35,000",
    distance: "3.2 km (5 mins)",
    demandForecast: "+32% more guests looking for rooms",
    icon: "connecting_airports",
    rawEventDate: "2026-11-18",
  },
  {
    id: "tech_expo_dwarka",
    name: "Global EV & Clean Mobility Summit",
    date: "NOV 22",
    venueName: "Yashobhoomi Convention Center, Dwarka",
    lat: 28.5524,
    lng: 77.0583,
    impact: "High",
    attendance: "52,000",
    distance: "8.2 km (12 mins)",
    demandForecast: "+38% more guests looking for rooms",
    icon: "electric_car",
    rawEventDate: "2026-11-22",
  },
  {
    id: "coldplay_delhi",
    name: "Coldplay Live Tour 2026",
    date: "NOV 28",
    venueName: "Jawaharlal Nehru Stadium (via NH-48)",
    lat: 28.5828,
    lng: 77.2344,
    impact: "Medium",
    attendance: "65,000",
    distance: "14.5 km away",
    demandForecast: "+25% more guests looking for rooms",
    icon: "stadium",
    rawEventDate: "2026-11-28",
  },
];

export default function EventTimeline({
  onSelectEvent,
  onGeneratePricing,
  onCompetitorToggled,
  onNavigateToTab,
  activeCompetitors,
  onToggleCompetitor,
}: EventTimelineProps) {
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [filter, setFilter] = useState<"all" | "High" | "Medium" | "Low">("High");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(INITIAL_EVENTS[0]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [mapFocus, setMapFocus] = useState<"aerocity" | "event">("aerocity");

  const handleToggleCompetitor = async (hotel: any) => {
    const shortName = getShortName(hotel.name);
    if (onToggleCompetitor) {
      onToggleCompetitor(shortName);
    }
    if (onCompetitorToggled) {
      onCompetitorToggled(
        hotel.inCompSet
          ? `Added ${hotel.name} to Comp-Set! Column added to Competitor Matrix.`
          : `Removed ${hotel.name} from Comp-Set.`
      );
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events/timeline");
      const json = await res.json();

      if (json?.events && json.events.length > 0) {
        const mapped: EventItem[] = json.events.map((e: any) => {
          const isHigh = e.expectedAttendance > 35000 || e.surgePercentage > 25;
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
            lat: typeof e.lat === "number" ? e.lat : 28.5524,
            lng: typeof e.lng === "number" ? e.lng : 77.0583,
            impact,
            attendance: e.expectedAttendance.toLocaleString("en-IN"),
            distance: `${e.distanceKm || 8.2} km away`,
            demandForecast: `+${e.surgePercentage || 28}% more guests looking for rooms`,
            icon:
              e.category?.includes("Concert") || e.category?.includes("Music")
                ? "stadium"
                : e.category?.includes("Aviation") || e.category?.includes("Airport")
                ? "flight_takeoff"
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
      radiusMeters: e.impact === "High" ? 5500 : 3500,
      demandForecast: e.demandForecast || "+28% more guests looking for rooms",
      distanceToClaridges: e.distance,
    }));
  }, [events]);

  const focusedLocation = useMemo(() => {
    if (mapFocus === "aerocity") {
      return {
        lat: 28.5505,
        lng: 77.1215,
        zoom: 14,
        id: "aerocity_cluster",
      };
    }
    if (!active) return null;
    return {
      lat: active.lat,
      lng: active.lng,
      zoom: 13,
      id: active.id,
    };
  }, [mapFocus, active]);

  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-[#0B132B] text-white">
      {/* Main Split-Pane */}
      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Left Pane: Timeline (50%) */}
        <section className="w-full md:w-1/2 flex flex-col h-full border-r border-[#3A506B] bg-[#0B132B]">
          {/* Header */}
          <header className="px-6 py-6 border-b border-[#3A506B]">
            <h2 className="text-2xl font-bold leading-tight font-heading mb-1">
              Upcoming City Events & Demand
            </h2>
            <p className="text-muted text-xs font-normal">
              Major expos at Yashobhoomi, airport flight surges, and Delhi summits driving bookings to Lemon Tree Aerocity
            </p>

            {/* Filters */}
            <div className="flex gap-2.5 mt-4 flex-wrap">
              <button
                onClick={() => setFilter("High")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors cursor-pointer ${
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
                  High Demand
                </p>
              </button>

              <button
                onClick={() => setFilter("Medium")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors cursor-pointer ${
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
                  Medium Demand
                </p>
              </button>

              <button
                onClick={() => setFilter("Low")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors cursor-pointer ${
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
                  Low Demand
                </p>
              </button>

              <button
                onClick={() => setFilter("all")}
                className={`flex h-8 items-center justify-center rounded px-3 transition-colors cursor-pointer ${
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
                          <h3 className="text-base font-bold text-white font-heading">{event.name}</h3>
                          <p className="text-xs text-muted font-mono">{event.venueName}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-[10px] font-mono border rounded ${
                            isHigh
                              ? "bg-intelligence bg-opacity-10 text-intelligence border-intelligence font-bold"
                              : "bg-primary bg-opacity-10 text-primary border-primary font-medium"
                          }`}
                        >
                          {isHigh ? "HIGH DEMAND" : "STEADY DEMAND"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted mb-0.5 font-mono">Expected Footfall</p>
                          <p className="text-sm font-mono text-white font-bold">
                            {event.attendance} people
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted mb-0.5 font-mono">Distance to Aerocity</p>
                          <p className="text-sm font-mono text-white font-bold">{event.distance}</p>
                        </div>
                      </div>

                      {event.demandForecast && (
                        <div className="mt-4 pt-3 border-t border-[#3A506B] flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-primary font-mono text-xs font-bold">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            <span>{event.demandForecast}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateClick(event);
                            }}
                            disabled={generatingId === event.id}
                            className="bg-primary hover:bg-[#15bfae] text-background-base px-3 py-1.5 rounded text-xs font-bold font-mono transition-all shadow-[0_0_10px_rgba(46,196,182,0.3)] disabled:opacity-50 cursor-pointer"
                          >
                            {generatingId === event.id ? "Calculating..." : "Calculate Best Price"}
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

        {/* Right Pane: Interactive Map (50%) */}
        <section className="hidden md:flex md:w-1/2 relative h-full overflow-hidden bg-[#050914] border-l border-[#3A506B]">
          <TacticalMapWrapper
            center={[28.5505, 77.1215]}
            zoom={15}
            focusedLocation={focusedLocation}
            activeEventId={active?.id}
            events={mapEvents}
            selectedCompetitors={activeCompetitors}
            showControls={true}
            showFilters={true}
            showConnectionLines={true}
            onToggleCompetitor={handleToggleCompetitor}
            onNavigateToTab={(tab) => {
              if (onNavigateToTab) {
                if (tab === "overview") onNavigateToTab("listings");
                else if (tab === "ai_actions") onNavigateToTab("action_center");
                else if (tab === "matrix") onNavigateToTab("matrix");
                else if (tab === "events") onNavigateToTab("events");
              }
            }}
            onSelectEvent={(ev) => {
              const match = events.find((e) => e.id === ev.id);
              if (match) {
                setSelectedEvent(match);
                setMapFocus("event");
                if (onSelectEvent) onSelectEvent(match);
              }
            }}
            onQuickReview={() => {
              if (active) handleGenerateClick(active);
            }}
          />

          {/* Active Event Compact Indicator (Non-blocking bottom-left chip) */}
          {active && (
            <div className="absolute bottom-24 left-6 z-[390] max-w-sm pointer-events-auto bg-[#0B132B]/95 border border-intelligence/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 pb-1 border-b border-[#3A506B]/50">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-intelligence text-sm animate-pulse">event</span>
                  <span className="font-mono text-[9px] uppercase font-bold text-intelligence tracking-wider">
                    Focused Event
                  </span>
                </div>
                <span className="text-[9px] font-mono text-muted">{active.date}</span>
              </div>
              <h4 className="font-heading text-xs font-bold text-white mt-1 truncate">{active.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-muted">
                <span className="text-white">{active.distance}</span>
                <span>•</span>
                <span className="text-intelligence font-bold">{active.demandForecast || "+35% Demand"}</span>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
