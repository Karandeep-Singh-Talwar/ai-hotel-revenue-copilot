"use client";

import dynamic from "next/dynamic";
import React from "react";
import type { MapHotel, MapCompetitor, MapEvent, NearbyHotel } from "./TacticalDarkMap";

export interface TacticalMapWrapperProps {
  center?: [number, number];
  zoom?: number;
  focusedLocation?: { lat: number; lng: number; zoom?: number; id?: string } | null;
  activeEventId?: string | null;
  properties?: MapHotel[];
  competitors?: MapCompetitor[];
  nearbyHotels?: NearbyHotel[];
  selectedCompetitors?: string[];
  onToggleCompetitor?: (hotel: NearbyHotel) => void;
  events?: MapEvent[];
  showControls?: boolean;
  showFilters?: boolean;
  showConnectionLines?: boolean;
  onNavigateToTab?: (tab: "overview" | "matrix" | "ai_actions" | "events", targetId?: string) => void;
  onQuickReview?: (actionId: string) => void;
  onSelectEvent?: (event: MapEvent) => void;
}

const TacticalDarkMap = dynamic(() => import("./TacticalDarkMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[#050914] flex items-center justify-center border border-[#1C2541] relative overflow-hidden">
      {/* Background Radar Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1C2541_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      
      <div className="text-muted flex flex-col items-center gap-3 relative z-10">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="w-6 h-6 rounded-full border border-intelligence/40 animate-ping absolute inset-2" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Initializing Tactical Map Engine...
          </span>
          <span className="text-[10px] font-mono text-muted">
            Locking Geospatial Coordinates: Delhi NCR [28.604° N, 77.222° E]
          </span>
        </div>
      </div>
    </div>
  ),
});

export default function TacticalMapWrapper(props: TacticalMapWrapperProps) {
  return <TacticalDarkMap {...props} />;
}
