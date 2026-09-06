"use client";

import React, { useState, useEffect, useMemo } from "react";
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

// Default Live Delhi NCR Data
export const DEFAULT_PROPERTIES: MapHotel[] = [
  {
    id: "claridges",
    name: "The Claridges New Delhi",
    lat: 28.5998,
    lng: 77.2185,
    address: "12 Dr APJ Abdul Kalam Rd, Motilal Nehru Marg Area",
    currentRate: 7200,
    suggestedRate: 8950,
    occupancy: 78,
    revpar: 5616,
    isPrimary: true,
    surgeActive: true,
    alert: "Coldplay Live & Tech Expo surge. Suggested +24.3% rate rec.",
    actionId: "coldplay_delhi",
  },
  {
    id: "manor",
    name: "The Manor New Delhi",
    lat: 28.5632,
    lng: 77.2654,
    address: "77 Friends Colony West, New Delhi",
    currentRate: 5900,
    suggestedRate: 6450,
    occupancy: 84,
    revpar: 4956,
    isPrimary: false,
    surgeActive: false,
    alert: "Corporate steady weekend demand. +9.3% optimization.",
  },
];

export const DEFAULT_COMPETITORS: MapCompetitor[] = [
  {
    id: "imperial",
    name: "The Imperial New Delhi",
    lat: 28.6239,
    lng: 77.2188,
    address: "Janpath, Connaught Place",
    rate: 9950,
    ota: "MakeMyTrip",
    status: "Surging (+38% vs baseline)",
    isUndercut: false,
  },
  {
    id: "lodhi",
    name: "The Lodhi New Delhi",
    lat: 28.5934,
    lng: 77.2384,
    address: "Lodhi Road, CGO Complex",
    rate: 18500,
    ota: "Booking.com",
    status: "High Demand (+12%)",
    isUndercut: false,
  },
  {
    id: "oberoi",
    name: "The Oberoi New Delhi",
    lat: 28.5989,
    lng: 77.2392,
    address: "Dr Zakir Hussain Marg",
    rate: 22000,
    ota: "Agoda",
    status: "Sold Out (92% Occ)",
    isUndercut: false,
  },
  {
    id: "taj_mansingh",
    name: "Taj Mansingh New Delhi",
    lat: 28.6047,
    lng: 77.2248,
    address: "1 Mansingh Road",
    rate: 15200,
    ota: "MakeMyTrip",
    status: "Surging (+28% next weekend)",
    isUndercut: false,
  },
  {
    id: "bloomrooms",
    name: "Bloomrooms @ Janpath",
    lat: 28.6251,
    lng: 77.2178,
    address: "Janpath, CP",
    rate: 4200,
    ota: "Goibibo",
    status: "Undercutting Standard Tier (-15%)",
    isUndercut: true,
  },
];

export const DEFAULT_EVENTS: MapEvent[] = [
  {
    id: "coldplay_delhi",
    name: "Coldplay Live Tour 2026",
    venueName: "Jawaharlal Nehru Stadium",
    lat: 28.5828,
    lng: 77.2344,
    date: "Nov 14 - 16, 2026",
    attendance: "65,000 / day",
    impact: "High",
    radiusMeters: 4500,
    demandForecast: "+42% Surge Expected",
    distanceToClaridges: "2.1 km",
  },
  {
    id: "tech_expo",
    name: "India International Tech Expo",
    venueName: "Bharat Mandapam, Pragati Maidan",
    lat: 28.6184,
    lng: 77.2415,
    date: "Nov 18 - 20, 2026",
    attendance: "35,000 delegates",
    impact: "High",
    radiusMeters: 5000,
    demandForecast: "+28% Corporate Inflow",
    distanceToClaridges: "3.8 km",
  },
  {
    id: "delhi_marathon",
    name: "Delhi Half Marathon 2026",
    venueName: "JLN Stadium & Central Vista",
    lat: 28.5828,
    lng: 77.2344,
    date: "Nov 24, 2026",
    attendance: "28,000 runners",
    impact: "Medium",
    radiusMeters: 3500,
    demandForecast: "+18% Weekend Bump",
    distanceToClaridges: "2.1 km",
  },
  {
    id: "fintech_summit",
    name: "Global Fintech Summit 2026",
    venueName: "Yashobhoomi IICC, Dwarka",
    lat: 28.5524,
    lng: 77.0583,
    date: "Dec 02 - 04, 2026",
    attendance: "45,000 attendees",
    impact: "High",
    radiusMeters: 6000,
    demandForecast: "Aerocity spillover into Central Delhi",
    distanceToClaridges: "18.5 km",
  },
];

interface TacticalDarkMapProps {
  center?: [number, number];
  zoom?: number;
  focusedLocation?: { lat: number; lng: number; zoom?: number; id?: string } | null;
  activeEventId?: string | null;
  properties?: MapHotel[];
  competitors?: MapCompetitor[];
  events?: MapEvent[];
  showControls?: boolean;
  showFilters?: boolean;
  showConnectionLines?: boolean;
  onNavigateToTab?: (tab: "overview" | "matrix" | "ai_actions" | "events", targetId?: string) => void;
  onQuickReview?: (actionId: string) => void;
  onSelectEvent?: (event: MapEvent) => void;
}

// Controller component to handle map flying and size invalidation
function MapController({
  center,
  zoom,
  focusedLocation,
}: {
  center: [number, number];
  zoom: number;
  focusedLocation?: { lat: number; lng: number; zoom?: number; id?: string } | null;
}) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount & container resize
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (focusedLocation && typeof focusedLocation.lat === "number" && typeof focusedLocation.lng === "number") {
      map.flyTo([focusedLocation.lat, focusedLocation.lng], focusedLocation.zoom || 14, {
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
  defaultCenter = [28.604, 77.222],
}: {
  defaultCenter?: [number, number];
}) {
  const map = useMap();

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-[400]">
      <button
        onClick={() => map.zoomIn()}
        title="Zoom In"
        className="w-8 h-8 bg-surface/95 border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#2A375C] hover:border-primary transition-all shadow-xl active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
      </button>
      <button
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        className="w-8 h-8 bg-surface/95 border border-[#3A506B] rounded flex items-center justify-center text-white hover:bg-[#2A375C] hover:border-primary transition-all shadow-xl active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">remove</span>
      </button>
      <button
        onClick={() => map.flyTo(defaultCenter, 13, { duration: 1.2 })}
        title="Center Central Delhi"
        className="w-8 h-8 bg-surface/95 border border-[#3A506B] rounded flex items-center justify-center text-primary hover:bg-[#2A375C] hover:border-primary transition-all shadow-xl active:scale-95"
      >
        <span className="material-symbols-outlined text-[16px]">my_location</span>
      </button>
    </div>
  );
}

export default function TacticalDarkMap({
  center = [28.604, 77.222], // Central Delhi NCR (India Gate / APJ Kalam corridor)
  zoom = 13,
  focusedLocation,
  activeEventId,
  properties = DEFAULT_PROPERTIES,
  competitors = DEFAULT_COMPETITORS,
  events = DEFAULT_EVENTS,
  showControls = true,
  showFilters = true,
  showConnectionLines = true,
  onNavigateToTab,
  onQuickReview,
  onSelectEvent,
}: TacticalDarkMapProps) {
  // Layer Toggles
  const [filterHotels, setFilterHotels] = useState(true);
  const [filterCompSet, setFilterCompSet] = useState(true);
  const [filterEvents, setFilterEvents] = useState(true);
  const [filterRadii, setFilterRadii] = useState(true);

  // Active event object
  const activeEvent = useMemo(() => {
    if (!activeEventId) return events[0];
    return events.find((e) => e.id === activeEventId) || events[0];
  }, [activeEventId, events]);

  // Primary Claridges Property coordinates
  const primaryClaridges = useMemo(() => {
    return properties.find((p) => p.isPrimary) || properties[0];
  }, [properties]);

  // Marker Icon Generators
  const createPropertyIcon = (hotel: MapHotel) => {
    const isSurge = hotel.surgeActive;
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2">
          <div class="flex items-center gap-1.5 bg-[#0B132B] border-2 ${
            isSurge ? "border-[#FF9F1C] text-[#FF9F1C] tactical-pulse-amber" : "border-[#2EC4B6] text-[#2EC4B6] tactical-pulse-cyan"
          } px-2 py-1 rounded shadow-[0_0_16px_rgba(0,0,0,0.9)] transition-transform group-hover:scale-110">
            <span class="material-symbols-outlined text-[13px] ${isSurge ? 'text-[#FF9F1C]' : 'text-[#2EC4B6]'}">
              ${isSurge ? 'trending_up' : 'hotel'}
            </span>
            <span class="font-mono text-[11px] font-bold text-white tracking-tight">₹${hotel.currentRate.toLocaleString('en-IN')}</span>
            ${isSurge ? '<span class="text-[9px] font-bold text-[#FF9F1C] bg-[#FF9F1C]/15 px-1 rounded">SURGE</span>' : ''}
          </div>
          <div class="w-2.5 h-2.5 rotate-45 -mt-1 ${isSurge ? 'bg-[#FF9F1C]' : 'bg-[#2EC4B6]'}"></div>
        </div>
      `,
      iconSize: [110, 48],
      iconAnchor: [55, 48],
      popupAnchor: [0, -48],
    });
  };

  const createCompetitorIcon = (comp: MapCompetitor) => {
    const isUndercut = comp.isUndercut;
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center group cursor-pointer -translate-x-1/2 -translate-y-1/2 opacity-90 hover:opacity-100">
          <div class="flex items-center gap-1 bg-[#0B132B]/95 border ${
            isUndercut ? "border-[#E71D36] text-[#E71D36]" : "border-[#3A506B] text-slate-300"
          } px-1.5 py-0.5 rounded shadow-lg transition-transform group-hover:scale-105">
            <span class="material-symbols-outlined text-[11px] ${isUndercut ? 'text-[#E71D36]' : 'text-slate-400'}">domain</span>
            <span class="font-mono text-[10px] text-slate-200">₹${comp.rate.toLocaleString('en-IN')}</span>
          </div>
          <div class="w-1.5 h-1.5 rotate-45 -mt-0.5 ${isUndercut ? 'bg-[#E71D36]' : 'bg-[#3A506B]'}"></div>
        </div>
      `,
      iconSize: [80, 32],
      iconAnchor: [40, 32],
      popupAnchor: [0, -32],
    });
  };

  const createEventIcon = (event: MapEvent, isSelected: boolean) => {
    return L.divIcon({
      className: "custom-tactical-marker",
      html: `
        <div class="flex flex-col items-center cursor-pointer -translate-x-1/2 -translate-y-1/2 ${
          isSelected ? "scale-110 z-30" : "opacity-95"
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
      {/* Tactical Top Filter Bar */}
      {showFilters && (
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Tactical Filters */}
          <div className="flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-[#3A506B] px-3 py-1.5 rounded shadow-2xl pointer-events-auto">
            <span className="font-mono text-[10px] text-muted uppercase font-bold tracking-wider mr-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
              Layers:
            </span>

            <button
              onClick={() => setFilterHotels((v) => !v)}
              className={`px-2 py-0.5 rounded font-mono text-xs flex items-center gap-1.5 transition-colors ${
                filterHotels
                  ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-sm bg-primary"></span>
              Our Hotels ({properties.length})
            </button>

            <button
              onClick={() => setFilterCompSet((v) => !v)}
              className={`px-2 py-0.5 rounded font-mono text-xs flex items-center gap-1.5 transition-colors ${
                filterCompSet
                  ? "bg-[#3A506B]/50 text-white border border-[#3A506B] font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-sm bg-slate-400"></span>
              Comp Set ({competitors.length})
            </button>

            <button
              onClick={() => setFilterEvents((v) => !v)}
              className={`px-2 py-0.5 rounded font-mono text-xs flex items-center gap-1.5 transition-colors ${
                filterEvents
                  ? "bg-intelligence/20 text-intelligence border border-intelligence/40 font-bold"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-intelligence"></span>
              Events ({events.length})
            </button>

            <button
              onClick={() => setFilterRadii((v) => !v)}
              className={`px-2 py-0.5 rounded font-mono text-xs flex items-center gap-1.5 transition-colors ${
                filterRadii
                  ? "bg-intelligence/15 text-intelligence border border-intelligence/30 font-medium"
                  : "text-muted hover:text-white border border-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">radar</span>
              Surge Radii
            </button>
          </div>

          {/* Tactical Status Tag */}
          <div className="hidden lg:flex items-center gap-2 bg-surface/90 backdrop-blur-md border border-[#3A506B] px-3 py-1.5 rounded shadow-xl font-mono text-[11px] pointer-events-auto">
            <span className="text-primary font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
              DELHI NCR GRID
            </span>
            <span className="text-muted">|</span>
            <span className="text-muted">28.5998° N, 77.2185° E</span>
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
        {/* CartoDB Dark Matter Tiles (High contrast, dark tactical look) */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> | OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* Map Controller for programmatic flyTo and resize handling */}
        <MapController center={center} zoom={zoom} focusedLocation={focusedLocation} />

        {/* Custom Zoom and Recenter Controls */}
        {showControls && <MapControlButtons defaultCenter={center} />}

        {/* Event Impact Radii Circles */}
        {filterRadii && filterEvents && events.map((event) => {
          const isSelected = activeEvent?.id === event.id;
          return (
            <React.Fragment key={`radius-${event.id}`}>
              {/* Outer Radius Impact Zone */}
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
              {/* Inner High Impact Core */}
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

        {/* Vector Line connecting Active Event to Claridges */}
        {showConnectionLines && activeEvent && primaryClaridges && (
          <Polyline
            positions={[
              [primaryClaridges.lat, primaryClaridges.lng],
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

        {/* Client Properties (The Claridges & The Manor) */}
        {filterHotels && properties.map((hotel) => (
          <Marker
            key={hotel.id}
            position={[hotel.lat, hotel.lng]}
            icon={createPropertyIcon(hotel)}
          >
            <Popup>
              <div className="p-3 w-64 text-white">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                  <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-wider">
                    {hotel.isPrimary ? "Primary Property" : "Portfolio Property"}
                  </span>
                  {hotel.surgeActive && (
                    <span className="bg-intelligence/20 text-intelligence font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                      SURGE ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="font-heading text-sm font-bold text-white mt-2">
                  {hotel.name}
                </h4>
                <p className="text-[11px] text-muted font-mono mb-2.5 leading-tight">
                  {hotel.address}
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2.5">
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Current Rate</span>
                    <span className="font-mono text-xs font-bold text-white">
                      ₹{hotel.currentRate.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-mono block">AI Suggested</span>
                    <span className="font-mono text-xs font-bold text-primary">
                      ₹{hotel.suggestedRate?.toLocaleString("en-IN") || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-mono block">Occupancy</span>
                    <span className="font-mono text-xs font-bold text-white">{hotel.occupancy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted font-mono block">RevPAR</span>
                    <span className="font-mono text-xs font-bold text-white">
                      ₹{hotel.revpar.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {hotel.alert && (
                  <div className="p-1.5 bg-intelligence/10 border border-intelligence/30 rounded text-[10px] font-mono text-intelligence mb-2.5">
                    {hotel.alert}
                  </div>
                )}

                {hotel.actionId && (
                  <button
                    onClick={() => {
                      if (onQuickReview) onQuickReview(hotel.actionId!);
                      else if (onNavigateToTab) onNavigateToTab("ai_actions", hotel.actionId);
                    }}
                    className="w-full py-1.5 bg-intelligence hover:bg-[#e08910] text-background-base font-mono text-[11px] font-bold uppercase rounded transition-colors"
                  >
                    Review Action Strategy
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Competitors */}
        {filterCompSet && competitors.map((comp) => (
          <Marker
            key={comp.id}
            position={[comp.lat, comp.lng]}
            icon={createCompetitorIcon(comp)}
          >
            <Popup>
              <div className="p-3 w-60 text-white">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                  <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Competitor Intelligence
                  </span>
                  <span className="bg-[#3A506B]/40 text-slate-300 font-mono text-[9px] px-1.5 py-0.5 rounded">
                    {comp.ota}
                  </span>
                </div>

                <h4 className="font-heading text-sm font-bold text-white mt-2">{comp.name}</h4>
                <p className="text-[11px] text-muted font-mono mb-2">{comp.address}</p>

                <div className="flex justify-between items-center bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2">
                  <span className="text-xs text-muted font-mono">Scraped Rate:</span>
                  <span className="font-mono text-sm font-bold text-white">
                    ₹{comp.rate.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className={`p-1.5 rounded text-[10px] font-mono mb-2.5 ${
                  comp.isUndercut
                    ? "bg-[#E71D36]/15 border border-[#E71D36]/30 text-[#E71D36]"
                    : "bg-surface border border-[#3A506B] text-slate-300"
                }`}>
                  {comp.status}
                </div>

                {onNavigateToTab && (
                  <button
                    onClick={() => onNavigateToTab("matrix")}
                    className="w-full py-1 bg-surface hover:bg-[#2A375C] border border-[#3A506B] text-white font-mono text-[10px] font-bold uppercase rounded transition-colors"
                  >
                    View in Matrix
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Events */}
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
                <div className="p-3 w-64 text-white">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#3A506B]">
                    <span className="font-mono text-[10px] uppercase font-bold text-intelligence tracking-wider">
                      Live Surge Event
                    </span>
                    <span className="bg-intelligence/20 text-intelligence font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                      {event.impact} IMPACT
                    </span>
                  </div>

                  <h4 className="font-heading text-sm font-bold text-white mt-2">{event.name}</h4>
                  <p className="text-[11px] text-muted font-mono mb-2">{event.venueName}</p>

                  <div className="space-y-1.5 bg-[#0B132B] p-2 rounded border border-[#3A506B] mb-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted">Dates:</span>
                      <span className="text-white font-bold">{event.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Attendance:</span>
                      <span className="text-intelligence font-bold">{event.attendance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">To Claridges:</span>
                      <span className="text-white font-bold">{event.distanceToClaridges}</span>
                    </div>
                  </div>

                  <div className="p-1.5 bg-intelligence/10 border border-intelligence/30 rounded text-[10px] font-mono text-intelligence mb-2.5">
                    {event.demandForecast}
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateToTab) onNavigateToTab("ai_actions", event.id);
                    }}
                    className="w-full py-1.5 bg-intelligence hover:bg-[#e08910] text-background-base font-mono text-[11px] font-bold uppercase rounded transition-colors"
                  >
                    Generate Event Pricing Strategy
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

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
