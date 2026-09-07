"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MASTER_HOTELS_CATALOG, getShortName } from "@/lib/hotelData";

// Fix for default Leaflet icon paths in Next.js bundler
/* eslint-disable @typescript-eslint/no-explicit-any */
delete (L.Icon.Default.prototype as any)._getIconUrl;
/* eslint-enable @typescript-eslint/no-explicit-any */
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface MapHotel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  currentRate: number;
  suggestedRate?: number;
  occupancy: number;
  revpar: number;
  isPrimary?: boolean;
  surgeActive?: boolean;
  alert?: string;
  actionId?: string;
}

export interface MapCompetitor {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rate: number;
  ota: string;
  status: string;
  isUndercut?: boolean;
}

export interface NearbyHotel {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  rate: number;
  stars: number;
  ota: string;
  status: string;
  isUndercut?: boolean;
  inCompSet: boolean;
  distanceKm?: number;
  zone?: string;
}

export interface MapEvent {
  id: string;
  name: string;
  venueName: string;
  lat: number;
  lng: number;
  date: string;
  attendance: string;
  impact: "High" | "Medium" | "Low";
  radiusMeters: number;
  demandForecast: string;
  distanceToClaridges: string;
}

// Client Primary Property (Lemon Tree Premier, Delhi Airport)
export const DEFAULT_PROPERTIES: MapHotel[] = [
  {
    id: "lemontree_aerocity",
    name: "Lemon Tree Premier, Delhi Airport",
    lat: 28.5505,
    lng: 77.1215,
    address: "Asset No. 6, Aerocity Hospitality District, New Delhi",
    currentRate: 5800,
    suggestedRate: 7200,
    occupancy: 75,
    revpar: 4350,
    isPrimary: true,
    surgeActive: true,
    alert: "Aviation India Expo @ Yashobhoomi driving Aerocity demand. +24.1% rate rec.",
    actionId: "yashobhoomi_aviation",
  },
];

// Complete 41 Nearby & Regional Competitor Properties
export const DEFAULT_NEARBY_HOTELS: NearbyHotel[] = MASTER_HOTELS_CATALOG.map((h) => ({
  id: h.slug,
  name: h.name,
  lat: h.lat,
  lng: h.lng,
  address: h.address,
  rate: h.rate,
  stars: h.stars,
  ota: h.ota,
  status: h.status,
  isUndercut: h.isUndercut,
  inCompSet: h.defaultInSet,
  distanceKm: h.distanceKm,
  zone: h.zone,
}));

export const DEFAULT_COMPETITORS: MapCompetitor[] = DEFAULT_NEARBY_HOTELS.filter(
  (h) => h.inCompSet
).map((h) => ({
  id: h.id,
  name: h.name,
  lat: h.lat,
  lng: h.lng,
  address: h.address,
  rate: h.rate,
  ota: h.ota,
  status: h.status,
  isUndercut: h.isUndercut,
}));

export const DEFAULT_EVENTS: MapEvent[] = [
  {
    id: "yashobhoomi_aviation",
    name: "Aviation India Expo & Trade Summit",
    venueName: "Yashobhoomi IICC, Dwarka",
    lat: 28.5524,
    lng: 77.0583,
    date: "Nov 14 - 16, 2026",
    attendance: "48,000 / day",
    impact: "High",
    radiusMeters: 5500,
    demandForecast: "+42% Demand Expected",
    distanceToClaridges: "8.2 km",
  },
  {
    id: "airport_transit_surge",
    name: "IGI Airport Weekend Transit Peak",
    venueName: "IGI Airport Terminal 3",
    lat: 28.5562,
    lng: 77.0855,
    date: "Nov 18 - 20, 2026",
    attendance: "35,000 transit",
    impact: "High",
    radiusMeters: 3800,
    demandForecast: "+32% Flight Transit Demand",
    distanceToClaridges: "3.2 km",
  },
  {
    id: "tech_expo_dwarka",
    name: "Global EV & Clean Mobility Summit",
    venueName: "Yashobhoomi Convention Center",
    lat: 28.5524,
    lng: 77.0583,
    date: "Nov 22 - 24, 2026",
    attendance: "52,000 / day",
    impact: "High",
    radiusMeters: 5500,
    demandForecast: "+38% Demand Surge",
    distanceToClaridges: "8.2 km",
  },
  {
    id: "coldplay_delhi",
    name: "Coldplay Live Tour 2026",
    venueName: "JLN Stadium (via NH-48)",
    lat: 28.5828,
    lng: 77.2344,
    date: "Nov 28, 2026",
    attendance: "65,000 attendees",
    impact: "Medium",
    radiusMeters: 4500,
    demandForecast: "+25% Weekend Bump",
    distanceToClaridges: "14.5 km",
  },
];

export interface TacticalDarkMapProps {
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

// Haversine distance calculator in kilometers
function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Controller component to register map instance and handle programmatic flyTo
function MapController({
  center,
  zoom,
  focusedLocation,
  onMapInstance,
}: {
  center: [number, number];
  zoom: number;
  focusedLocation?: { lat: number; lng: number; zoom?: number; id?: string } | null;
  onMapInstance: (map: L.Map) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMapInstance(map);
  }, [map, onMapInstance]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (focusedLocation && typeof focusedLocation.lat === "number" && typeof focusedLocation.lng === "number") {
      map.flyTo([focusedLocation.lat, focusedLocation.lng], focusedLocation.zoom || 15.5, {
        duration: 1.2,
      });
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [focusedLocation, center, zoom, map]);

  return null;
}

// Custom UI Overlay for Zooming and Centering
function MapControlButtons({
  onZoomIn,
  onZoomOut,
  onFocusAerocity,
  onFocusRegion,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFocusAerocity: () => void;
  onFocusRegion: () => void;
}) {
  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-[400]">
      <button
        onClick={onZoomIn}
        title="Zoom In"
        className="w-8 h-8 bg-[#0B132B]/95 border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#1C2541] hover:border-primary transition-all shadow-xl active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
      <button
        onClick={onZoomOut}
        title="Zoom Out"
        className="w-8 h-8 bg-[#0B132B]/95 border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#1C2541] hover:border-primary transition-all shadow-xl active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <button
        onClick={onFocusAerocity}
        title="Focus Aerocity Core (15.5x)"
        className="w-8 h-8 bg-[#0B132B]/95 border border-[#3A506B] rounded flex items-center justify-center text-primary hover:bg-[#1C2541] hover:border-primary transition-all shadow-xl active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">hotel</span>
      </button>
      <button
        onClick={onFocusRegion}
        title="View Delhi NCR Region (12x)"
        className="w-8 h-8 bg-[#0B132B]/95 border border-[#3A506B] rounded flex items-center justify-center text-slate-300 hover:bg-[#1C2541] hover:border-primary transition-all shadow-xl active:scale-95 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">map</span>
      </button>
    </div>
  );
}

export default function TacticalDarkMap({
  center = [28.5505, 77.1215], // Aerocity Hospitality District, New Delhi
  zoom = 15.5,
  focusedLocation,
  activeEventId,
  properties = DEFAULT_PROPERTIES,
  nearbyHotels = DEFAULT_NEARBY_HOTELS,
  selectedCompetitors,
  onToggleCompetitor,
  events = DEFAULT_EVENTS,
  showControls = true,
  showFilters = true,
  showConnectionLines = true,
  onNavigateToTab,
  onQuickReview,
  onSelectEvent,
}: TacticalDarkMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Layer Toggles
  const filterHotels = true;
  const [filterCompSet, setFilterCompSet] = useState(true);
  const [filterNearby, setFilterNearby] = useState(true);
  const [filterEvents, setFilterEvents] = useState(true);
  const [filterRadii, setFilterRadii] = useState(true);

  // Search Radius State (km) - Hoteliers can expand from 1 km to 25 km or "All"
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Drawer state for on-map hotel management tray
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"all" | "comp" | "nearby">("all");
  const [drawerSearch, setDrawerSearch] = useState<string>("");

  // Local state for nearby hotels list (tracks inCompSet status dynamically)
  const [localHotels, setLocalHotels] = useState<NearbyHotel[]>(nearbyHotels);

  // Synchronize when nearbyHotels prop updates or selectedCompetitors changes
  useEffect(() => {
    if (selectedCompetitors && selectedCompetitors.length > 0) {
      setLocalHotels((prev) =>
        prev.map((h) => {
          const short = getShortName(h.name);
          const inComp = selectedCompetitors.some(
            (c) =>
              c === h.name ||
              c === h.id ||
              c === short ||
              h.name.toLowerCase().includes(c.toLowerCase()) ||
              c.toLowerCase().includes(h.id.toLowerCase())
          );
          return {
            ...h,
            inCompSet: inComp,
          };
        })
      );
    } else if (selectedCompetitors && selectedCompetitors.length === 0) {
      setLocalHotels((prev) =>
        prev.map((h) => ({
          ...h,
          inCompSet: false,
        }))
      );
    } else {
      setLocalHotels(nearbyHotels);
    }
  }, [nearbyHotels, selectedCompetitors]);

  // Primary Lemon Tree Property coordinates
  const primaryHotel = useMemo(() => {
    return properties.find((p) => p.isPrimary) || properties[0];
  }, [properties]);

  // Active event object
  const activeEvent = useMemo(() => {
    if (!activeEventId) return events[0];
    return events.find((e) => e.id === activeEventId) || events[0];
  }, [activeEventId, events]);

  // Toggle comp-set addition/removal
  const handleToggleHotel = (hotelId: string) => {
    const target = localHotels.find((h) => h.id === hotelId);
    if (!target) return;
    const willBeIn = !target.inCompSet;

    setLocalHotels((prev) =>
      prev.map((h) => (h.id === hotelId ? { ...h, inCompSet: willBeIn } : h))
    );

    if (onToggleCompetitor) {
      onToggleCompetitor({
        ...target,
        inCompSet: willBeIn,
      });
    }
  };

  // Compute distance from Lemon Tree Premier for all hotels
  const hotelsWithDist = useMemo(() => {
    const targetLat = primaryHotel?.lat || center[0];
    const targetLng = primaryHotel?.lng || center[1];

    return localHotels.map((h) => {
      const dist = computeDistanceKm(targetLat, targetLng, h.lat, h.lng);
      return {
        ...h,
        distanceKm: dist,
      };
    });
  }, [localHotels, primaryHotel, center]);

  // Filter hotels strictly by the current interactive radius (or all if radius >= 25)
  const filteredByRadius = useMemo(() => {
    if (radiusKm >= 25) return hotelsWithDist;
    return hotelsWithDist.filter((h) => (h.distanceKm || 0) <= radiusKm);
  }, [hotelsWithDist, radiusKm]);

  const compSetHotels = useMemo(
    () => filteredByRadius.filter((h) => h.inCompSet),
    [filteredByRadius]
  );

  const availableNearbyHotels = useMemo(
    () => filteredByRadius.filter((h) => !h.inCompSet),
    [filteredByRadius]
  );

  // Navigation handlers
  const handleFocusAerocity = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([28.5505, 77.1215], 15.5, { duration: 1.2 });
    }
  };

  const handleFocusRegion = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([28.5350, 77.1100], 12.0, { duration: 1.2 });
    }
  };

  const handleFocusEvent = () => {
    if (mapRef.current && activeEvent) {
      mapRef.current.flyTo([activeEvent.lat, activeEvent.lng], 13.5, { duration: 1.2 });
    }
  };

  // Marker Icon Generators with Anti-Collision Styling and Hover Depth
  const createPropertyIcon = (hotel: MapHotel) => {
    const isSurge = hotel.surgeActive;
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2 z-50 hover:z-[1000]">
          <div class="flex items-center gap-1.5 bg-[#0B132B] border-2 ${
            isSurge ? "border-[#FF9F1C] text-[#FF9F1C] tactical-pulse-amber" : "border-[#2EC4B6] text-[#2EC4B6] tactical-pulse-cyan"
          } px-2.5 py-1 rounded shadow-[0_0_20px_rgba(46,196,182,0.6)] transition-all group-hover:scale-110">
            <span class="material-symbols-outlined text-[14px] ${isSurge ? 'text-[#FF9F1C]' : 'text-[#2EC4B6]'}">
              hotel
            </span>
            <div class="flex flex-col text-left leading-none">
              <span class="text-[9px] font-bold text-primary uppercase tracking-tight">Lemon Tree Premier</span>
              <span class="font-mono text-[12px] font-bold text-white tracking-tight">₹${hotel.currentRate.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div class="w-2.5 h-2.5 rotate-45 -mt-1 ${isSurge ? 'bg-[#FF9F1C]' : 'bg-[#2EC4B6]'}"></div>
        </div>
      `,
      iconSize: [140, 52],
      iconAnchor: [70, 52],
      popupAnchor: [0, -52],
    });
  };

  const createCompetitorIcon = (comp: NearbyHotel) => {
    const isUndercut = comp.isUndercut;
    const shortName = getShortName(comp.name).replace(" Aerocity", "").replace(" Airport", "");
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2 z-40 hover:z-[1000]">
          <div class="flex items-center gap-1.5 bg-[#0B132B]/95 border ${
            isUndercut ? "border-[#E71D36] text-[#E71D36]" : "border-[#FF9F1C] text-amber-300"
          } px-2 py-0.5 rounded shadow-[0_4px_12px_rgba(0,0,0,0.7)] transition-all group-hover:scale-110 group-hover:border-white">
            <span class="text-[10px] font-bold text-white tracking-tight">${shortName}</span>
            <span class="font-mono text-[10px] ${isUndercut ? "text-rose-400" : "text-amber-300"} font-bold">₹${comp.rate.toLocaleString('en-IN')}</span>
            <span class="text-[8px] font-bold text-[#0B132B] bg-amber-400 px-1 rounded uppercase font-mono">SET</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 ${isUndercut ? 'bg-[#E71D36]' : 'bg-[#FF9F1C]'}"></div>
        </div>
      `,
      iconSize: [125, 34],
      iconAnchor: [62, 34],
      popupAnchor: [0, -34],
    });
  };

  const createNearbyHotelIcon = (hotel: NearbyHotel) => {
    const shortName = getShortName(hotel.name).replace(" Aerocity", "").replace(" Airport", "");
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2 z-30 hover:z-[1000] opacity-90 hover:opacity-100">
          <div class="flex items-center gap-1 bg-[#1C2541]/95 border border-[#8A2BE2] text-purple-200 px-2 py-0.5 rounded shadow-[0_4px_12px_rgba(0,0,0,0.7)] transition-all group-hover:scale-110 group-hover:border-primary">
            <span class="text-[10px] font-semibold text-slate-200 tracking-tight">${shortName}</span>
            <span class="font-mono text-[10px] text-[#C084FC] font-bold">₹${hotel.rate.toLocaleString('en-IN')}</span>
            <span class="text-[8px] font-bold text-white bg-purple-600/90 px-1 rounded uppercase font-mono">+ADD</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 bg-[#8A2BE2]"></div>
        </div>
      `,
      iconSize: [125, 34],
      iconAnchor: [62, 34],
      popupAnchor: [0, -34],
    });
  };

  const createEventIcon = (event: MapEvent, isSelected: boolean) => {
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center cursor-pointer -translate-x-1/2 -translate-y-1/2 ${
          isSelected ? "scale-110 z-50" : "opacity-95 z-20"
        }">
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#0B132B] border-2 border-[#FF9F1C] shadow-[0_0_18px_rgba(255,159,28,0.85)] ${
            isSelected ? "tactical-pulse-amber" : ""
          }">
            <span class="material-symbols-outlined text-[14px] text-[#FF9F1C]">star</span>
          </div>
          <div class="mt-0.5 bg-[#1C2541]/95 border border-[#FF9F1C]/80 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-white shadow-md whitespace-nowrap">
            ${event.name.length > 18 ? event.name.slice(0, 16) + '...' : event.name}
          </div>
        </div>
      `,
      iconSize: [120, 52],
      iconAnchor: [60, 20],
      popupAnchor: [0, -20],
    });
  };

  return (
    <div className="relative w-full h-full bg-[#050914] overflow-hidden select-none">
      {/* Unified Tactical Top Toolbar (Zero UI Collisions) */}
      {showFilters && (
        <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Left: View Focus & Layer Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0B132B]/95 backdrop-blur-md border border-[#3A506B] px-2.5 py-1.5 rounded-lg shadow-2xl pointer-events-auto">
            <span className="font-mono text-[10px] text-muted uppercase font-bold tracking-wider mr-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              View:
            </span>

            {/* Focus Aerocity Button */}
            <button
              onClick={handleFocusAerocity}
              className="px-2 py-1 rounded font-mono text-xs flex items-center gap-1 bg-[#1C2541] hover:bg-[#2A375C] text-primary border border-primary/40 font-bold transition-all cursor-pointer shadow-sm"
              title="Focus Aerocity hotels with street-level separation"
            >
              <span className="material-symbols-outlined text-[13px]">hotel</span>
              <span>Aerocity</span>
            </button>

            {/* Focus Delhi NCR Region */}
            <button
              onClick={handleFocusRegion}
              className="px-2 py-1 rounded font-mono text-xs flex items-center gap-1 bg-[#1C2541] hover:bg-[#2A375C] text-slate-300 border border-[#3A506B] font-bold transition-all cursor-pointer shadow-sm"
              title="Zoom out to view all Delhi NCR & Gurgaon properties"
            >
              <span className="material-symbols-outlined text-[13px]">map</span>
              <span>Delhi NCR</span>
            </button>

            {/* Focus Event Button */}
            {activeEvent && (
              <button
                onClick={handleFocusEvent}
                className="px-2 py-1 rounded font-mono text-xs flex items-center gap-1 bg-intelligence/20 hover:bg-intelligence/30 text-intelligence border border-intelligence/40 font-bold transition-all cursor-pointer shadow-sm"
                title={`Center map on ${activeEvent.venueName}`}
              >
                <span className="material-symbols-outlined text-[13px]">event</span>
                <span className="hidden sm:inline">Event: {activeEvent.name.slice(0, 14)}...</span>
                <span className="sm:hidden">Event</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-[#3A506B] mx-1"></div>

            {/* Layer Toggles */}
            <button
              onClick={() => setFilterCompSet((v) => !v)}
              className={`px-2 py-1 rounded font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                filterCompSet
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-sm bg-amber-400"></span>
              <span>Comp-Set ({compSetHotels.length})</span>
            </button>

            <button
              onClick={() => setFilterNearby((v) => !v)}
              className={`px-2 py-1 rounded font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                filterNearby
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-sm bg-purple-400"></span>
              <span>Available ({availableNearbyHotels.length})</span>
            </button>

            <button
              onClick={() => setFilterEvents((v) => !v)}
              className={`px-2 py-1 rounded font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                filterEvents
                  ? "bg-intelligence/20 text-intelligence border border-intelligence/40 font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-intelligence"></span>
              <span>Events ({events.length})</span>
            </button>

            <button
              onClick={() => setFilterRadii((v) => !v)}
              className={`px-2 py-1 rounded font-mono text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                filterRadii
                  ? "bg-primary/15 text-primary border border-primary/30 font-medium"
                  : "text-muted hover:text-white border border-transparent"
              }`}
              title="Toggle search radius perimeter circle"
            >
              <span className="material-symbols-outlined text-[13px]">radar</span>
              <span className="hidden sm:inline">Ring</span>
            </button>
          </div>

          {/* Right: Interactive Radius Increaser (Requested by User) */}
          <div className="flex items-center gap-2 bg-[#0B132B]/95 backdrop-blur-md border border-[#3A506B] px-3 py-1.5 rounded-lg shadow-2xl pointer-events-auto font-mono text-xs">
            <div className="flex items-center gap-1 text-primary font-bold">
              <span className="material-symbols-outlined text-[16px]">radar</span>
              <span className="uppercase text-[10px] tracking-wider">Radius:</span>
            </div>

            {/* Decrement (-) Button */}
            <button
              onClick={() => setRadiusKm((r) => Math.max(1, r - (r <= 5 ? 1 : 2)))}
              className="w-5 h-5 rounded bg-[#1C2541] hover:bg-[#2A375C] text-white flex items-center justify-center font-bold border border-[#3A506B] cursor-pointer"
              title="Decrease search radius"
            >
              -
            </button>

            {/* Interactive Smooth Slider */}
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={radiusKm >= 25 ? 25 : radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-16 sm:w-24 accent-primary h-1.5 bg-[#1C2541] rounded-lg cursor-pointer"
              title={`Drag to adjust radius: ${radiusKm} km`}
            />

            {/* Increment (+) Button */}
            <button
              onClick={() => setRadiusKm((r) => Math.min(25, r + (r < 5 ? 1 : 2)))}
              className="w-5 h-5 rounded bg-[#1C2541] hover:bg-[#2A375C] text-white flex items-center justify-center font-bold border border-[#3A506B] cursor-pointer"
              title="Increase search radius"
            >
              +
            </button>

            {/* Live Distance Value */}
            <span className="text-white font-bold bg-[#1C2541] px-1.5 py-0.5 rounded border border-[#3A506B]/80 text-[11px] min-w-[42px] text-center">
              {radiusKm >= 25 ? "25km+" : `${radiusKm}km`}
            </span>

            {/* Quick Preset Buttons */}
            <div className="hidden xl:flex items-center gap-1 ml-1 pl-2 border-l border-[#3A506B]">
              {[
                { label: "1km", val: 1 },
                { label: "3km", val: 3 },
                { label: "5km", val: 5 },
                { label: "10km", val: 10 },
                { label: "15km", val: 15 },
                { label: "25km", val: 25 },
                { label: "All", val: 999 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => setRadiusKm(p.val)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    (radiusKm === p.val || (p.val === 999 && radiusKm >= 25))
                      ? "bg-primary text-[#0B132B]"
                      : "text-muted hover:text-white hover:bg-[#1C2541]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Live Hotel Counter Badge */}
            <span className="text-[10px] text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded hidden lg:inline-block font-semibold">
              {filteredByRadius.length} hotels
            </span>
          </div>
        </div>
      )}

      {/* Leaflet Interactive Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", background: "#050914" }}
      >
        {/* ESRI World Dark Gray Base (Clean, high-contrast dark tiles with zero watermarks or API key requirements) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          maxNativeZoom={16}
        />

        {/* ESRI World Dark Gray Reference (Street labels, airport markers, and Aerocity districts) */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          maxNativeZoom={16}
          opacity={0.85}
        />

        {/* Map Controller for programmatic flyTo and map registration */}
        <MapController
          center={center}
          zoom={zoom}
          focusedLocation={focusedLocation}
          onMapInstance={(instance) => {
            mapRef.current = instance;
          }}
        />

        {/* Custom Zoom and Recenter Controls */}
        {showControls && (
          <MapControlButtons
            onZoomIn={() => mapRef.current?.zoomIn()}
            onZoomOut={() => mapRef.current?.zoomOut()}
            onFocusAerocity={handleFocusAerocity}
            onFocusRegion={handleFocusRegion}
          />
        )}

        {/* Dynamic Search Radius Circle around Lemon Tree Premier */}
        {filterRadii && primaryHotel && (
          <Circle
            center={[primaryHotel.lat, primaryHotel.lng]}
            radius={Math.min(radiusKm, 25) * 1000}
            pathOptions={{
              color: "#2EC4B6",
              fillColor: "#2EC4B6",
              fillOpacity: 0.05,
              weight: 1.5,
              dashArray: "5, 8",
            }}
          />
        )}

        {/* Event Impact Radii Circles */}
        {filterRadii && filterEvents && events.map((event) => {
          const isSelected = activeEvent?.id === event.id;
          return (
            <React.Fragment key={`radius-${event.id}`}>
              <Circle
                center={[event.lat, event.lng]}
                radius={event.radiusMeters}
                pathOptions={{
                  color: "#FF9F1C",
                  fillColor: "#FF9F1C",
                  fillOpacity: isSelected ? 0.12 : 0.05,
                  weight: isSelected ? 1.5 : 1,
                  dashArray: "6, 6",
                }}
              />
              {isSelected && (
                <Circle
                  center={[event.lat, event.lng]}
                  radius={Math.round(event.radiusMeters * 0.45)}
                  pathOptions={{
                    color: "#FF9F1C",
                    fillColor: "#FF9F1C",
                    fillOpacity: 0.18,
                    weight: 2,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Vector Line connecting Active Event to Lemon Tree Premier */}
        {showConnectionLines && activeEvent && primaryHotel && (
          <Polyline
            positions={[
              [primaryHotel.lat, primaryHotel.lng],
              [activeEvent.lat, activeEvent.lng],
            ]}
            pathOptions={{
              color: "#FF9F1C",
              weight: 2,
              dashArray: "5, 8",
              opacity: 0.75,
            }}
          />
        )}

        {/* 1. Client Property: Lemon Tree Premier, Delhi Airport */}
        {filterHotels && properties.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.lat, hotel.lng]}
            icon={createPropertyIcon(hotel)}
          >
            <Popup>
              <div className="p-3 w-64 text-white font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    Your Client Property
                  </span>
                  {hotel.surgeActive && (
                    <span className="bg-intelligence/20 text-intelligence text-[9px] font-bold px-1.5 py-0.5 rounded">
                      SURGE ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="font-heading text-sm font-bold text-white mt-2">
                  {hotel.name}
                </h4>
                <p className="text-[11px] text-muted mb-2.5 leading-tight">
                  {hotel.address}
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2.5">
                  <div>
                    <span className="text-[10px] text-muted block">Your Price</span>
                    <span className="text-xs font-bold text-white">
                      ₹{hotel.currentRate.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Recommended</span>
                    <span className="text-xs font-bold text-primary">
                      ₹{hotel.suggestedRate?.toLocaleString("en-IN") || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Rooms Booked</span>
                    <span className="text-xs font-bold text-white">{hotel.occupancy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted block">Rev/Room</span>
                    <span className="text-xs font-bold text-white">
                      ₹{hotel.revpar.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {hotel.alert && (
                  <div className="p-1.5 bg-intelligence/10 border border-intelligence/30 rounded text-[10px] text-intelligence mb-2.5">
                    {hotel.alert}
                  </div>
                )}

                {hotel.actionId && (
                  <button
                    onClick={() => {
                      if (onQuickReview) onQuickReview(hotel.actionId!);
                      else if (onNavigateToTab) onNavigateToTab("ai_actions", hotel.actionId);
                    }}
                    className="w-full py-1.5 bg-intelligence hover:bg-[#e08910] text-background-base text-[11px] font-bold uppercase rounded transition-colors cursor-pointer"
                  >
                    View Recommended Price
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. In Comp-Set Hotels (Active Competitors) */}
        {filterCompSet && compSetHotels.map((comp) => (
          <Marker
            key={`comp-${comp.id}`}
            position={[comp.lat, comp.lng]}
            icon={createCompetitorIcon(comp)}
          >
            <Popup>
              <div className="p-3 w-64 text-white font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                  <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    In Your Comp-Set
                  </span>
                  <span className="bg-[#3A506B]/40 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                    {comp.ota}
                  </span>
                </div>

                <h4 className="font-heading text-sm font-bold text-white mt-2">{comp.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-muted mb-1">
                  <span className="text-amber-400">{"★".repeat(comp.stars)}</span>
                  <span>•</span>
                  <span>{comp.distanceKm} km away</span>
                </div>
                <p className="text-[10px] text-muted mb-2 truncate">{comp.address}</p>

                <div className="flex justify-between items-center bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2">
                  <span className="text-xs text-muted">Live Price:</span>
                  <span className="text-sm font-bold text-white">
                    ₹{comp.rate.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className={`p-1.5 rounded text-[10px] mb-2.5 ${
                  comp.isUndercut
                    ? "bg-[#E71D36]/15 border border-[#E71D36]/30 text-[#E71D36]"
                    : "bg-surface border border-[#3A506B] text-slate-300"
                }`}>
                  {comp.status}
                </div>

                {/* Remove from Comp-Set Action Button */}
                <button
                  onClick={() => handleToggleHotel(comp.id)}
                  className="w-full py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer flex items-center justify-center gap-1 mb-1.5"
                >
                  <span className="material-symbols-outlined text-[14px]">remove_circle</span>
                  Remove from Comp-Set
                </button>

                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab("matrix")}
                    className="w-full py-1.5 bg-primary/20 hover:bg-primary text-primary hover:text-[#0B132B] border border-primary/40 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">grid_on</span>
                    View in Price Matrix →
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 3. Available Nearby & Regional Hotels (Within Selected Radius) */}
        {filterNearby && availableNearbyHotels.map((hotel) => (
          <Marker
            key={`nearby-${hotel.id}`}
            position={[hotel.lat, hotel.lng]}
            icon={createNearbyHotelIcon(hotel)}
          >
            <Popup>
              <div className="p-3 w-64 text-white font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                  <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                    Available Hotel
                  </span>
                  <span className="bg-[#3A506B]/40 text-slate-300 text-[9px] px-1.5 py-0.5 rounded">
                    {hotel.ota}
                  </span>
                </div>

                <h4 className="font-heading text-sm font-bold text-white mt-2">{hotel.name}</h4>
                <div className="flex items-center gap-2 text-[11px] text-muted mb-1">
                  <span className="text-amber-400">{"★".repeat(hotel.stars)}</span>
                  <span>•</span>
                  <span>{hotel.distanceKm} km away</span>
                </div>
                <p className="text-[10px] text-muted mb-2 truncate">{hotel.address}</p>

                <div className="flex justify-between items-center bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2.5">
                  <span className="text-xs text-muted">Current Price:</span>
                  <span className="text-sm font-bold text-primary">
                    ₹{hotel.rate.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Add to Comp-Set Action Button */}
                <button
                  onClick={() => handleToggleHotel(hotel.id)}
                  className="w-full py-1.5 bg-primary hover:bg-[#15bfae] text-[#0B132B] text-[11px] font-bold uppercase rounded transition-all shadow-[0_0_12px_rgba(46,196,182,0.35)] cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add_circle</span>
                  + Add to Comp-Set
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 4. Events */}
        {filterEvents && events.map((event) => {
          const isSelected = activeEvent?.id === event.id;
          return (
            <Marker
              key={event.id}
              position={[event.lat, event.lng]}
              icon={createEventIcon(event, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectEvent) onSelectEvent(event);
                },
              }}
            >
              <Popup>
                <div className="p-3 w-64 text-white font-mono">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                    <span className="text-[10px] uppercase font-bold text-intelligence tracking-wider">
                      City Event
                    </span>
                    <span className="bg-intelligence/20 text-intelligence text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {event.impact === "High" ? "HIGH DEMAND" : "STEADY DEMAND"}
                    </span>
                  </div>

                  <h4 className="font-heading text-sm font-bold text-white mt-2">{event.name}</h4>
                  <p className="text-[11px] text-muted mb-2">{event.venueName}</p>

                  <div className="space-y-1.5 bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted">Dates:</span>
                      <span className="text-white font-bold">{event.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Attendance:</span>
                      <span className="text-intelligence font-bold">{event.attendance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">To Hotel:</span>
                      <span className="text-white font-bold">{event.distanceToClaridges}</span>
                    </div>
                  </div>

                  <div className="p-1.5 bg-intelligence/10 border border-intelligence/30 rounded text-[10px] text-intelligence mb-2.5">
                    {event.demandForecast}
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab("ai_actions", event.id);
                    }}
                    className="w-full py-1.5 bg-intelligence hover:bg-[#e08910] text-background-base text-[11px] font-bold uppercase rounded transition-colors cursor-pointer"
                  >
                    Calculate Best Price
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Hotel Directory & Comp-Set Management Slide-Up Drawer */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col items-end">
        {drawerOpen && (
          <div className="mb-2 w-80 sm:w-96 bg-[#0B132B]/95 border border-[#3A506B] rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md overflow-hidden flex flex-col max-h-[420px] animate-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="p-3 bg-[#1C2541] border-b border-[#3A506B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
                <div>
                  <span className="font-heading text-xs font-bold text-white block">
                    Regional Hotels & Comp-Set
                  </span>
                  <span className="text-[10px] font-mono text-muted">
                    Within {radiusKm >= 25 ? "Delhi NCR Region" : `${radiusKm} km radius`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:text-white size-6 flex items-center justify-center rounded hover:bg-[#2A375C] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="p-2 border-b border-[#3A506B]/50 bg-[#111827]">
              <div className="flex items-center gap-1.5 bg-[#1C2541] border border-[#3A506B] rounded px-2.5 py-1">
                <span className="material-symbols-outlined text-muted text-[14px]">search</span>
                <input
                  type="text"
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  placeholder="Search hotel name or area..."
                  className="bg-transparent text-white text-xs font-mono focus:outline-none w-full placeholder:text-muted"
                />
                {drawerSearch && (
                  <button onClick={() => setDrawerSearch("")} className="text-muted hover:text-white">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center border-b border-[#3A506B] bg-[#141d33] px-2 py-1 text-[11px] font-mono">
              <button
                onClick={() => setDrawerTab("all")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  drawerTab === "all" ? "bg-primary text-[#0B132B] font-bold" : "text-muted hover:text-white"
                }`}
              >
                All ({filteredByRadius.length})
              </button>
              <button
                onClick={() => setDrawerTab("comp")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  drawerTab === "comp" ? "bg-amber-400 text-[#0B132B] font-bold" : "text-amber-300/80 hover:text-white"
                }`}
              >
                Comp-Set ({compSetHotels.length})
              </button>
              <button
                onClick={() => setDrawerTab("nearby")}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  drawerTab === "nearby" ? "bg-purple-500 text-white font-bold" : "text-purple-300/80 hover:text-white"
                }`}
              >
                Available ({availableNearbyHotels.length})
              </button>
            </div>

            {/* Hotels List */}
            <div className="overflow-y-auto p-2 space-y-1.5 max-h-64 font-mono text-xs divide-y divide-[#3A506B]/30">
              {(drawerTab === "all"
                ? filteredByRadius
                : drawerTab === "comp"
                ? compSetHotels
                : availableNearbyHotels
              )
                .filter(
                  (h) =>
                    drawerSearch === "" ||
                    h.name.toLowerCase().includes(drawerSearch.toLowerCase()) ||
                    h.address.toLowerCase().includes(drawerSearch.toLowerCase()) ||
                    (h.zone && h.zone.toLowerCase().includes(drawerSearch.toLowerCase()))
                )
                .map((hotel) => {
                  return (
                    <div
                      key={hotel.id}
                      className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 p-1.5 rounded hover:bg-[#1C2541]/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold truncate text-[11px] font-heading">{hotel.name}</span>
                          {hotel.inCompSet ? (
                            <span className="bg-amber-400/20 text-amber-300 text-[8px] font-bold px-1 rounded uppercase">In Set</span>
                          ) : (
                            <span className="bg-purple-500/20 text-purple-300 text-[8px] font-bold px-1 rounded uppercase">Available</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400">{"★".repeat(hotel.stars)}</span>
                          <span>•</span>
                          <span>{hotel.distanceKm} km</span>
                          <span>•</span>
                          <span className="text-primary font-bold">₹{hotel.rate.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleHotel(hotel.id)}
                        className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          hotel.inCompSet
                            ? "bg-red-500/15 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30"
                            : "bg-primary hover:bg-[#15bfae] text-[#0B132B] shadow-[0_0_8px_rgba(46,196,182,0.3)]"
                        }`}
                      >
                        {hotel.inCompSet ? "Remove" : "+ Add"}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            {onNavigateToTab && (
              <div className="p-2 border-t border-[#3A506B] bg-[#141d33] flex justify-between items-center">
                <span className="text-[10px] text-muted font-mono">
                  {compSetHotels.length} hotels in Price Matrix
                </span>
                <button
                  onClick={() => onNavigateToTab("matrix")}
                  className="text-primary hover:underline text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Competitor Matrix</span>
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trigger Button / Summary HUD */}
        <div className="flex items-center gap-2 bg-surface/95 border border-[#3A506B] p-1.5 rounded shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 font-mono text-xs px-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-muted">Comp-Set:</span>
            <strong className="text-white">{compSetHotels.length}</strong>
            <span className="text-muted">•</span>
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span className="text-muted">Available:</span>
            <strong className="text-purple-300">{availableNearbyHotels.length}</strong>
          </div>

          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className="bg-[#1C2541] hover:bg-[#2A375C] border border-[#3A506B] hover:border-primary text-white px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[14px] text-primary">domain</span>
            <span>{drawerOpen ? "Hide Hotels" : `All ${filteredByRadius.length} Hotels`}</span>
            <span className="material-symbols-outlined text-[14px]">
              {drawerOpen ? "expand_more" : "expand_less"}
            </span>
          </button>
        </div>
      </div>

      {/* Subtle Tactical Radar SVG Grid Overlay for High-Tech Aesthetic */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15 z-[300]">
        <defs>
          <pattern id="tactical-hud-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3A506B" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tactical-hud-grid)" />
      </svg>
    </div>
  );
}
