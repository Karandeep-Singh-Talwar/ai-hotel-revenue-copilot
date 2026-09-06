"use client";

import React, { useState, useEffect } from "react";
import { RecommendationData } from "./AIActionCenter";

export interface EventItem {
  id: number;
  name: string;
  eventDate: string;
  venueName: string;
  lat: number;
  lng: number;
  expectedAttendance: number;
  category: string;
  surgePercentage: number;
  surgeBadge: string;
  description: string;
  distanceKm: number;
  distanceMiles: number;
  distanceFormatted: string;
}

interface EventTimelineProps {
  onSelectEventDate?: (date: string, eventName: string) => void;
  onSuggestionGenerated?: (recommendation: RecommendationData) => void;
}

export default function EventTimeline({
  onSelectEventDate,
  onSuggestionGenerated,
}: EventTimelineProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [generatingForId, setGeneratingForId] = useState<number | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events/timeline");
      const json = await res.json();
      setEvents(json.events || []);
      if (json.events?.length > 0) {
        setSelectedEventId(json.events[0].id);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSuggestions = async (event: EventItem) => {
    setGeneratingForId(event.id);
    try {
      const res = await fetch("/api/recommendations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: 1,
          targetDate: event.eventDate,
          eventName: event.name,
        }),
      });
      const data = await res.json();
      if (data.success && onSuggestionGenerated) {
        onSuggestionGenerated(data.recommendation);
      }
      if (onSelectEventDate) {
        onSelectEventDate(event.eventDate, event.name);
      }
    } catch (err) {
      console.error("Error generating pricing suggestion:", err);
    } finally {
      setGeneratingForId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm animate-pulse flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Scanning Local Ticketing & Convention Portals...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">
              Event Intelligence Portal & Compression Signals
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Geospatial demand drivers scraped from BookMyShow, Paytm Insider, and Major NCR Expo Centers.
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
          {events.length} Active Demand Drivers
        </span>
      </div>

      {/* Timeline Feed */}
      <div className="p-6 divide-y divide-gray-100">
        {events.map((event) => {
          const isSelected = selectedEventId === event.id;
          const isGenerating = generatingForId === event.id;

          return (
            <div
              key={event.id}
              className={`py-5 first:pt-0 last:pb-0 transition-all rounded-lg ${
                isSelected ? "bg-gray-50/50 p-4 border border-gray-200/80 my-2" : ""
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Date & Core Details */}
                <div className="flex items-start space-x-4">
                  {/* Calendar Badge */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-gray-100 border border-gray-200 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-gray-400">
                      {new Date(event.eventDate).toLocaleString("default", { month: "short" })}
                    </span>
                    <span className="text-lg font-bold font-mono text-gray-900 leading-none">
                      {new Date(event.eventDate).getDate()}
                    </span>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {event.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black text-white">
                        {event.category}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {event.surgeBadge}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.venueName} (<strong>{event.distanceFormatted}</strong>)
                      </span>
                      <span className="flex items-center font-mono">
                        <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.expectedAttendance.toLocaleString()} Expected Visitors
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed pt-1">
                      {event.description}
                    </p>
                  </div>
                </div>

                {/* Right: Active Suggestion Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleGenerateSuggestions(event)}
                    disabled={isGenerating}
                    className="w-full md:w-auto bg-gray-900 hover:bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Calculating Rate...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate Pricing Suggestions</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
