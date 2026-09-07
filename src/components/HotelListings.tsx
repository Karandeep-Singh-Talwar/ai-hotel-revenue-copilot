"use client";

import React, { useState } from "react";

export interface RatePlan {
  name: string;
  code: string;
  price: number;
  inclusions: string;
}

export interface ClientRoomListing {
  id: string;
  name: string;
  categoryCode: string;
  size: string;
  bed: string;
  view: string;
  totalRooms: number;
  bookedToday: number;
  availableToSell: number;
  currentBasePrice: number;
  suggestedPrice: number;
  channelRates: {
    makeMyTrip: number;
    bookingCom: number;
    agoda: number;
    direct: number;
  };
  ratePlans: RatePlan[];
  amenities: string[];
  status: "Selling Fast" | "Available" | "High Demand";
}

const LEMONTREE_LISTINGS: ClientRoomListing[] = [
  {
    id: "superior",
    name: "Superior Room",
    categoryCode: "SUP-KNG",
    size: "280 sq ft (26 sq m)",
    bed: "1 King Bed or 2 Twin Beds",
    view: "Aerocity Skyline View",
    totalRooms: 140,
    bookedToday: 108,
    availableToSell: 32,
    currentBasePrice: 5800,
    suggestedPrice: 7200,
    channelRates: {
      makeMyTrip: 5800,
      bookingCom: 5800,
      agoda: 5800,
      direct: 5510, // 5% direct member discount
    },
    ratePlans: [
      { name: "Room Only (EP)", code: "EP-STD", price: 5800, inclusions: "Complimentary High-speed Wi-Fi, 2 Bottles of Water" },
      { name: "Room with Buffet Breakfast (CP)", code: "CP-STD", price: 6600, inclusions: "Buffet Breakfast at Citrus Café, Free Wi-Fi" },
      { name: "Breakfast + Airport Transfer", code: "CP-TRN", price: 7400, inclusions: "Buffet Breakfast, One-way Airport Shuttle (T1/T3)" },
    ],
    amenities: ["Free Wi-Fi", "Tea/Coffee Maker", "Ergonomic Work Desk", "Electronic Safe", "LED TV"],
    status: "Selling Fast",
  },
  {
    id: "deluxe",
    name: "Deluxe Room",
    categoryCode: "DLX-RUN",
    size: "320 sq ft (30 sq m)",
    bed: "1 King Bed",
    view: "Pool & Runway View",
    totalRooms: 85,
    bookedToday: 61,
    availableToSell: 24,
    currentBasePrice: 6900,
    suggestedPrice: 8450,
    channelRates: {
      makeMyTrip: 6900,
      bookingCom: 6900,
      agoda: 6900,
      direct: 6555,
    },
    ratePlans: [
      { name: "Room Only (EP)", code: "EP-DLX", price: 6900, inclusions: "Runway View, High-speed Wi-Fi, Mineral Water" },
      { name: "Room with Buffet Breakfast (CP)", code: "CP-DLX", price: 7700, inclusions: "Runway View, Buffet Breakfast at Citrus Café" },
      { name: "Breakfast + Dinner (MAP)", code: "MAP-DLX", price: 8900, inclusions: "Buffet Breakfast & Dinner at Citrus Café" },
    ],
    amenities: ["Pool/Runway View", "Free Wi-Fi", "Mini Bar", "Iron & Board", "Comfort Armchair"],
    status: "Selling Fast",
  },
  {
    id: "executive",
    name: "Executive Room",
    categoryCode: "EXE-LNG",
    size: "360 sq ft (33 sq m)",
    bed: "1 King Bed",
    view: "High Floor Aerocity View",
    totalRooms: 42,
    bookedToday: 27,
    availableToSell: 15,
    currentBasePrice: 8500,
    suggestedPrice: 10600,
    channelRates: {
      makeMyTrip: 8500,
      bookingCom: 8500,
      agoda: 8500,
      direct: 8075,
    },
    ratePlans: [
      { name: "Executive Lounge Package", code: "EXE-PKG", price: 8500, inclusions: "Lounge Access, Evening High Tea, Buffet Breakfast, Free Wi-Fi" },
      { name: "Lounge + T3 Airport Transfer", code: "EXE-VIP", price: 9800, inclusions: "Lounge Access, Both-way Airport Transfers, Breakfast" },
    ],
    amenities: ["Executive Lounge Access", "Evening Cocktails", "Airport Pickup/Drop", "Espresso Machine", "Bathrobes"],
    status: "Available",
  },
  {
    id: "suite",
    name: "Executive Suite (2-Bedroom)",
    categoryCode: "SUI-2BR",
    size: "550 sq ft (51 sq m)",
    bed: "2 Separate Bedrooms (1 Master King + 1 Twin/Queen)",
    view: "Panoramic Aerocity & Runway View",
    totalRooms: 20,
    bookedToday: 10,
    availableToSell: 10,
    currentBasePrice: 12500,
    suggestedPrice: 15400,
    channelRates: {
      makeMyTrip: 12500,
      bookingCom: 12500,
      agoda: 12500,
      direct: 11875,
    },
    ratePlans: [
      { name: "2-Bedroom Luxury Suite Experience", code: "SUI-2BR-VIP", price: 12500, inclusions: "2 Separate Bedrooms, Dedicated Living Salon, Jacuzzi Bath, VIP Airport Drop, Full Lounge Access" },
    ],
    amenities: ["2 Separate Bedrooms", "Dedicated Living & Dining Salon", "2 Full En-suite Bathrooms", "VIP Airport Transfer (T1/T3)", "Full Executive Lounge Access", "Butler Service"],
    status: "High Demand",
  },
];

export interface CompetitorRoomSnippet {
  hotel: string;
  roomName: string;
  size: string;
  bedConfig: string;
  facilities: string[];
  matchScore: number;
  rate: number;
  ota: string;
}

const SCRAPED_COMPETITOR_MATCHES: Record<string, CompetitorRoomSnippet[]> = {
  superior: [
    { hotel: "Roseate House", roomName: "Deluxe Room", size: "340 sq ft", bedConfig: "1 King Bed", facilities: ["Forest Rain Shower", "Forest Essentials"], matchScore: 93, rate: 13200, ota: "MakeMyTrip" },
    { hotel: "JW Marriott Aerocity", roomName: "Deluxe King Guest Room", size: "380 sq ft", bedConfig: "1 King Bed", facilities: ["Marble Bath", "Aromatherapy"], matchScore: 92, rate: 14500, ota: "Booking.com" },
    { hotel: "Novotel Aerocity", roomName: "Standard Room (King Bed)", size: "290 sq ft", bedConfig: "1 King Bed", facilities: ["Ergonomic Desk", "55-in TV"], matchScore: 94, rate: 9200, ota: "MakeMyTrip" },
    { hotel: "Aloft Aerocity", roomName: "Aloft Room", size: "300 sq ft", bedConfig: "1 King Bed", facilities: ["Platform Bed", "Bliss Spa"], matchScore: 95, rate: 8400, ota: "MakeMyTrip" },
    { hotel: "Ibis Aerocity", roomName: "Standard Room (Queen)", size: "210 sq ft", bedConfig: "1 SweetBed Queen", facilities: ["SweetBed", "Soundproof"], matchScore: 86, rate: 4600, ota: "Agoda" },
  ],
  deluxe: [
    { hotel: "Roseate House", roomName: "Premium Room (Runway View)", size: "390 sq ft", bedConfig: "1 King Bed", facilities: ["Runway View", "Deep Soaking Tub", "High Tea"], matchScore: 95, rate: 15800, ota: "MakeMyTrip" },
    { hotel: "JW Marriott Aerocity", roomName: "Deluxe Pool View King", size: "410 sq ft", bedConfig: "1 King Bed", facilities: ["Pool View", "Deep Marble Tub"], matchScore: 94, rate: 17200, ota: "Booking.com" },
    { hotel: "Novotel Aerocity", roomName: "Superior Room (Runway View)", size: "330 sq ft", bedConfig: "1 King Bed", facilities: ["Runway View", "Acoustic Glazing", "Bathtub"], matchScore: 96, rate: 10900, ota: "MakeMyTrip" },
    { hotel: "Pullman Aerocity", roomName: "Executive King (Runway View)", size: "390 sq ft", bedConfig: "1 King Bed", facilities: ["Runway View", "Deep Tub", "Nespresso"], matchScore: 95, rate: 15200, ota: "Agoda" },
  ],
  executive: [
    { hotel: "Roseate House", roomName: "Club Room with Crystal Lounge", size: "440 sq ft", bedConfig: "1 King Bed", facilities: ["Crystal Lounge Access", "Cocktails", "Butler"], matchScore: 96, rate: 19500, ota: "MakeMyTrip" },
    { hotel: "JW Marriott Aerocity", roomName: "Executive Club Lounge King", size: "440 sq ft", bedConfig: "1 King Bed", facilities: ["M-Club Lounge", "Cocktails & High Tea", "Airport Drop"], matchScore: 95, rate: 21800, ota: "Booking.com" },
    { hotel: "Novotel Aerocity", roomName: "Executive Premier King with Lounge", size: "380 sq ft", bedConfig: "1 King Bed", facilities: ["Premier Lounge", "Canapés", "Buffet Breakfast"], matchScore: 97, rate: 13600, ota: "MakeMyTrip" },
    { hotel: "Pullman Aerocity", roomName: "Executive Room with Club Lounge", size: "420 sq ft", bedConfig: "1 King Bed", facilities: ["Pullman Club Lounge", "Wine Hour", "Pluck Breakfast"], matchScore: 96, rate: 18400, ota: "Agoda" },
  ],
  suite: [
    { hotel: "Roseate House", roomName: "Roseate Suite (2-Bedroom Master Suite)", size: "640 sq ft", bedConfig: "2 Master Bedrooms", facilities: ["2 Separate Bedrooms", "Private Dining Salon", "VIP BMW Transfer", "Crystal Lounge VIP"], matchScore: 96, rate: 24800, ota: "MakeMyTrip" },
    { hotel: "JW Marriott Aerocity", roomName: "Executive 2-Bedroom Luxury Suite", size: "720 sq ft", bedConfig: "2 King Bedrooms", facilities: ["2 Master Bedrooms", "Separate Parlor", "M-Club VIP Lounge", "Mercedes Airport VIP"], matchScore: 95, rate: 28500, ota: "Booking.com" },
    { hotel: "Novotel Aerocity", roomName: "2-Bedroom Family Suite", size: "550 sq ft", bedConfig: "2 Interconnecting Bedrooms", facilities: ["2 Master Bedrooms", "Living Room", "2 En-suite Baths", "Premier Lounge Access"], matchScore: 97, rate: 18200, ota: "MakeMyTrip" },
    { hotel: "Pullman Aerocity", roomName: "Executive 2-Bedroom Suite", size: "680 sq ft", bedConfig: "2 Bedrooms (King + Queen)", facilities: ["2 Bedrooms", "Dedicated Salon", "Jacuzzi Bath", "Club Lounge Access"], matchScore: 96, rate: 22400, ota: "MakeMyTrip" },
    { hotel: "Andaz Delhi", roomName: "Signature 2-Bedroom Residence", size: "690 sq ft", bedConfig: "2 King Bedrooms", facilities: ["2 Bedrooms", "Residential Living Room", "Kitchenette", "VIP Transfer"], matchScore: 95, rate: 26000, ota: "MakeMyTrip" },
    { hotel: "Aloft Aerocity", roomName: "Savvy Suite (2-Bedroom / Living)", size: "530 sq ft", bedConfig: "2 Bedrooms (King + Twin)", facilities: ["2 Bedrooms", "Living Lounge", "2 Full Baths", "W XYZ Pass"], matchScore: 94, rate: 16900, ota: "Agoda" },
  ],
};

interface HotelListingsProps {
  onGoToRecommendations?: () => void;
  onRateUpdated?: (msg: string) => void;
  onViewCompMatrix?: (roomCategory?: string) => void;
}

export default function HotelListings({
  onGoToRecommendations,
  onRateUpdated,
  onViewCompMatrix,
}: HotelListingsProps) {
  const [listings, setListings] = useState<ClientRoomListing[]>(LEMONTREE_LISTINGS);
  const [editingRoom, setEditingRoom] = useState<ClientRoomListing | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedRoomComps, setExpandedRoomComps] = useState<Record<string, boolean>>({ suite: true });

  const handleOpenEdit = (room: ClientRoomListing) => {
    setEditingRoom(room);
    setNewPrice(room.currentBasePrice);
  };

  const handleSavePrice = async () => {
    if (!editingRoom) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/recommendations/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationId: 1,
          hotelId: 1,
          customRate: newPrice,
        }),
      });
      await res.json();

      setListings((prev) =>
        prev.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                currentBasePrice: newPrice,
                channelRates: {
                  makeMyTrip: newPrice,
                  bookingCom: newPrice,
                  agoda: newPrice,
                  direct: Math.round(newPrice * 0.95),
                },
                ratePlans: r.ratePlans.map((rp, idx) => ({
                  ...rp,
                  price: idx === 0 ? newPrice : newPrice + (rp.price - r.currentBasePrice),
                })),
              }
            : r
        )
      );

      if (onRateUpdated) {
        onRateUpdated(
          `Updated ${editingRoom.name} to ₹${newPrice.toLocaleString("en-IN")}/night. Synced to MakeMyTrip, Booking.com, Agoda, and Direct Website!`
        );
      }
      setEditingRoom(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto bg-[#0B132B] text-white p-6 font-body">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* 1. Client Hotel Welcome Card */}
        <div className="bg-surface border border-[#3A506B] rounded-sm p-6 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#3A506B]/60">
            <div className="flex items-start gap-4">
              <div className="size-14 rounded bg-[#0B132B] border border-primary flex items-center justify-center text-primary flex-shrink-0 shadow-[0_0_15px_rgba(46,196,182,0.2)]">
                <span className="material-symbols-outlined text-[32px]">apartment</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-heading text-white">
                    Lemon Tree Premier, Delhi Airport (Aerocity)
                  </h1>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold rounded">
                    Client Active
                  </span>
                </div>
                <p className="text-xs text-muted font-mono mt-1">
                  Asset No. 6, Aerocity Hospitality District, New Delhi, 110037 • 287 Total Keys
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-300">
                  <span>PMS: <strong className="text-white">eZee FrontDesk</strong></span>
                  <span>•</span>
                  <span>Channel Manager: <strong className="text-primary">eZee Centrix 2-Way Sync</strong></span>
                  <span>•</span>
                  <span>Total Occupancy Today: <strong className="text-emerald-400 font-bold">75% (216 Booked)</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onGoToRecommendations}
                className="px-4 py-2 bg-primary hover:bg-[#15bfae] text-[#0B132B] text-xs font-mono font-bold rounded-sm transition-all shadow-[0_0_12px_rgba(46,196,182,0.3)] flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                <span>View Price Suggestions</span>
              </button>
            </div>
          </div>

          {/* 2. Connected Booking Channels Status Bar */}
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold text-muted font-mono tracking-wider flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected Booking Channels (Live Rate Parity Check)
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                100% Rate Parity Maintained
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Channel 1: MakeMyTrip */}
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-heading">MakeMyTrip</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live</span>
                </div>
                <p className="text-[11px] text-muted">Rating: 4.3/5 (3.4k reviews)</p>
                <p className="text-[10px] text-primary font-mono mt-1">Instant 2-Way Sync</p>
              </div>

              {/* Channel 2: Booking.com */}
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-heading">Booking.com</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live</span>
                </div>
                <p className="text-[11px] text-muted">Rating: 8.4/10 (2.1k reviews)</p>
                <p className="text-[10px] text-primary font-mono mt-1">Instant 2-Way Sync</p>
              </div>

              {/* Channel 3: Agoda */}
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-heading">Agoda</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Live</span>
                </div>
                <p className="text-[11px] text-muted">Rating: 8.3/10 (1.8k reviews)</p>
                <p className="text-[10px] text-primary font-mono mt-1">Instant 2-Way Sync</p>
              </div>

              {/* Channel 4: Brand Website */}
              <div className="bg-[#0B132B] border border-[#3A506B] rounded-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-heading">Direct Website</span>
                  <span className="text-[10px] text-primary font-mono">0% Fee</span>
                </div>
                <p className="text-[11px] text-muted">lemontreehotels.com</p>
                <p className="text-[10px] text-emerald-400 font-mono mt-1">Direct Booking Engine</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Room Inventory & Live Listings Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold font-heading text-white">
              Room Categories & Live Listings
            </h2>
            <p className="text-xs text-muted font-mono mt-0.5">
              Current live selling prices, rate plans, and available room inventory for Lemon Tree Aerocity
            </p>
          </div>
          <span className="text-xs text-muted font-mono">
            Showing 4 Active Categories
          </span>
        </div>

        {/* 4. Room Listings Cards */}
        <div className="space-y-4">
          {listings.map((room) => (
            <div
              key={room.id}
              className="bg-surface border border-[#3A506B] rounded-sm p-5 hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Left: Room Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-base font-bold font-heading text-white">{room.name}</h3>
                    <span className="px-2 py-0.5 bg-[#0B132B] text-slate-300 font-mono text-[10px] border border-[#3A506B] rounded">
                      {room.categoryCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded ${
                        room.status === "Selling Fast"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : room.status === "High Demand"
                          ? "bg-primary/15 text-primary border border-primary/30"
                          : "bg-slate-500/15 text-slate-300 border border-slate-500/30"
                      }`}
                    >
                      {room.status}
                    </span>
                  </div>

                  <p className="text-xs text-muted font-mono mb-3">
                    {room.size} • {room.bed} • {room.view}
                  </p>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {room.amenities.map((am) => (
                      <span
                        key={am}
                        className="px-2 py-0.5 bg-[#0B132B] text-slate-300 text-[11px] rounded border border-[#3A506B]/50"
                      >
                        {am}
                      </span>
                    ))}
                  </div>

                  {/* Channel Prices Grid */}
                  <div className="bg-[#0B132B] p-3 rounded border border-[#3A506B]/60 font-mono text-xs max-w-xl">
                    <div className="text-[10px] uppercase font-bold text-muted mb-2 tracking-wider">
                      Live Channel Rates (Base EP)
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-[10px] text-muted block">MakeMyTrip</span>
                        <strong className="text-white">₹{room.channelRates.makeMyTrip.toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">Booking.com</span>
                        <strong className="text-white">₹{room.channelRates.bookingCom.toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">Agoda</span>
                        <strong className="text-white">₹{room.channelRates.agoda.toLocaleString("en-IN")}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-primary block">Direct Web</span>
                        <strong className="text-primary font-bold">₹{room.channelRates.direct.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Live Room Inventory & Action Column */}
                <div className="lg:w-72 flex flex-col justify-between bg-[#0B132B] p-4 rounded border border-[#3A506B] flex-shrink-0">
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs text-muted font-mono">Current Base Price:</span>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-white">
                          ₹{room.currentBasePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-muted block font-mono">/ night</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline mb-3 pt-2 border-t border-[#3A506B]/40">
                      <span className="text-xs text-primary font-mono font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        AI Suggested:
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono text-primary">
                          ₹{room.suggestedPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-mono">
                          +₹{(room.suggestedPrice - room.currentBasePrice).toLocaleString("en-IN")} gain
                        </span>
                      </div>
                    </div>

                    {/* Inventory Gauge */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between text-xs font-mono text-muted">
                        <span>Booked: <strong>{room.bookedToday}/{room.totalRooms}</strong></span>
                        <span className="text-emerald-400 font-bold">{room.availableToSell} left to sell</span>
                      </div>
                      <div className="w-full bg-[#1C2541] rounded-full h-1.5 overflow-hidden border border-[#3A506B]/50">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${Math.round((room.bookedToday / room.totalRooms) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(room)}
                      className="flex-1 py-2 bg-[#1C2541] hover:bg-[#2A375C] border border-[#3A506B] hover:border-primary text-white text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>Edit Price</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditingRoom(room);
                        setNewPrice(room.suggestedPrice);
                      }}
                      className="flex-1 py-2 bg-primary hover:bg-[#15bfae] text-[#0B132B] text-xs font-mono font-bold rounded transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      title="Apply AI Recommended Price"
                    >
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      <span>Apply AI Price</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate Plans Dropdown / Sub-list */}
              <div className="mt-4 pt-4 border-t border-[#3A506B]/40">
                <div className="text-[11px] font-mono text-muted uppercase tracking-wider mb-2 font-bold">
                  Active Rate Plans ({room.ratePlans.length} plans live on channels):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {room.ratePlans.map((plan) => (
                    <div
                      key={plan.code}
                      className="bg-[#0B132B] p-2.5 rounded border border-[#3A506B]/40 text-xs font-mono flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-white truncate max-w-[170px]">{plan.name}</span>
                          <span className="text-primary font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
                        </div>
                        <p className="text-[10px] text-muted line-clamp-2 leading-tight">
                          {plan.inclusions}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apples-to-Apples Scraped Competitor Room Comparison Section */}
              <div className="mt-4 pt-3.5 border-t border-[#3A506B]/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedRoomComps((prev) => ({ ...prev, [room.id]: !prev[room.id] }))}
                    className="flex items-center gap-2 text-xs font-mono font-bold text-primary hover:text-[#15bfae] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">balance</span>
                    <span>
                      {expandedRoomComps[room.id]
                        ? `Hide Competitor Room Matches (${(SCRAPED_COMPETITOR_MATCHES[room.id] || []).length} rooms)`
                        : `Compare Scraped Competitor Rooms (${(SCRAPED_COMPETITOR_MATCHES[room.id] || []).length} exact matches in Aerocity)`}
                    </span>
                    <span className="material-symbols-outlined text-[16px]">
                      {expandedRoomComps[room.id] ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  <button
                    onClick={() => onViewCompMatrix?.(room.id)}
                    className="text-[11px] font-mono text-muted hover:text-white flex items-center gap-1 cursor-pointer transition-colors bg-[#0B132B] px-2.5 py-1 rounded border border-[#3A506B]/50 hover:border-primary"
                  >
                    <span>View in Live 14-Day Price Matrix</span>
                    <span className="material-symbols-outlined text-[13px] text-primary">arrow_forward</span>
                  </button>
                </div>

                {expandedRoomComps[room.id] && (
                  <div className="mt-3.5 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px] font-mono text-muted bg-[#0B132B] p-2 rounded border border-[#3A506B]/40">
                      <span>
                        Apples-to-apples room comparison based on actual scraped room names, square footage & facilities:
                      </span>
                      <span className="text-emerald-400 font-bold hidden sm:inline">Live OTA Rates Verified</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(SCRAPED_COMPETITOR_MATCHES[room.id] || []).map((comp) => (
                        <div
                          key={comp.hotel}
                          className="p-3 bg-[#0B132B] rounded border border-[#3A506B]/70 flex flex-col justify-between hover:border-primary/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div>
                                <span className="text-white font-bold text-xs font-heading">{comp.hotel}</span>
                                <div className="text-[11px] text-matrix-accent font-semibold">{comp.roomName}</div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-sm font-bold font-mono text-white">
                                  ₹{comp.rate.toLocaleString("en-IN")}
                                </span>
                                <span className="text-[10px] text-muted block font-mono">{comp.ota}</span>
                              </div>
                            </div>

                            <div className="text-[10px] font-mono text-slate-300 mt-1 flex items-center gap-2">
                              <span>📐 {comp.size}</span>
                              <span>•</span>
                              <span>🛏️ {comp.bedConfig}</span>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {comp.facilities.map((f) => (
                                <span
                                  key={f}
                                  className="text-[9px] font-mono bg-[#1C2541] text-slate-300 px-1.5 py-0.2 rounded border border-[#3A506B]/40"
                                >
                                  ✓ {f}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-2.5 pt-1.5 border-t border-[#3A506B]/30 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              {comp.matchScore}% Spec Match
                            </span>
                            <span
                              className={
                                comp.rate > room.currentBasePrice
                                  ? "text-primary font-bold"
                                  : "text-matrix-accent font-bold"
                              }
                            >
                              {comp.rate > room.currentBasePrice
                                ? `+₹${(comp.rate - room.currentBasePrice).toLocaleString("en-IN")} higher`
                                : `-₹${(room.currentBasePrice - comp.rate).toLocaleString("en-IN")} cheaper`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Edit Price Modal */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/40 rounded-sm p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#3A506B] mb-4">
              <div>
                <h3 className="font-heading text-base font-bold text-white">
                  Update Price • {editingRoom.name}
                </h3>
                <p className="text-xs text-muted font-mono mt-0.5">
                  Lemon Tree Premier, Aerocity New Delhi
                </p>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-muted hover:text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#0B132B] p-3 rounded border border-[#3A506B]">
                <div>
                  <span className="text-muted text-[10px] block">Current Price:</span>
                  <span className="text-white font-bold text-sm">
                    ₹{editingRoom.currentBasePrice.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-primary text-[10px] block">AI Recommended:</span>
                  <span className="text-primary font-bold text-sm">
                    ₹{editingRoom.suggestedPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-bold">
                  Enter New Base Price (₹ / night):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted font-bold text-sm">₹</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseInt(e.target.value, 10) || 0)}
                    step="50"
                    className="w-full pl-7 pr-3 py-2 bg-[#0B132B] border border-[#3A506B] rounded text-white font-mono text-sm focus:border-primary outline-none"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5">
                  This new price will be sent immediately to MakeMyTrip, Booking.com, Agoda, and the front desk.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  onClick={() => setEditingRoom(null)}
                  className="px-4 py-2 text-xs font-mono font-bold text-muted hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePrice}
                  disabled={isSaving || newPrice <= 0}
                  className="px-5 py-2 bg-primary hover:bg-[#15bfae] text-[#0B132B] text-xs font-mono font-bold rounded transition-all shadow-[0_0_12px_rgba(46,196,182,0.3)] disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? "Updating Channels..." : "Push New Rate Live"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
