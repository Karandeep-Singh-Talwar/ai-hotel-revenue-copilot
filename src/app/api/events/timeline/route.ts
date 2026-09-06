/**
 * Events Intelligence Timeline API (/api/events/timeline)
 * Returns scheduled local events, concerts, and exhibitions with
 * Haversine-computed distances and projected demand surge indicators.
 */

import { NextResponse } from "next/server";

function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export async function GET() {
  // Default hotel location (The Claridges New Delhi)
  const hotelLat = 28.5998;
  const hotelLng = 77.2185;

  const today = new Date();

  const eventsData = [
    {
      id: 1,
      name: "Global AI & Cloud Tech Expo 2026",
      eventDate: new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0],
      venueName: "Bharat Mandapam (Pragati Maidan)",
      lat: 28.6184,
      lng: 77.2415,
      expectedAttendance: 42000,
      category: "Tech Exhibition / Conference",
      surgePercentage: 24,
      surgeBadge: "⚡ +24% Projected Demand",
      description: "Major B2B convergence bringing international technology executives to Central Delhi.",
    },
    {
      id: 2,
      name: "Ed Sheeran + Coldplay Stadium Live Tour",
      eventDate: new Date(today.getTime() + 14 * 86400000).toISOString().split("T")[0],
      venueName: "Jawaharlal Nehru Stadium",
      lat: 28.5828,
      lng: 77.2344,
      expectedAttendance: 58000,
      category: "Music Concert",
      surgePercentage: 38,
      surgeBadge: "⚡ +38% Projected Demand",
      description: "High leisure compression across South & Central Delhi. Immediate sold-out weekend.",
    },
    {
      id: 3,
      name: "Indo-Global Medical Devices Summit",
      eventDate: new Date(today.getTime() + 21 * 86400000).toISOString().split("T")[0],
      venueName: "Yashobhoomi Convention Centre (IICC Dwarka)",
      lat: 28.5524,
      lng: 77.0583,
      expectedAttendance: 28000,
      category: "Healthcare Expo",
      surgePercentage: 18,
      surgeBadge: "⚡ +18% Projected Demand",
      description: "Pharma and surgical supply chain summit driving multi-night corporate room blocks.",
    },
    {
      id: 4,
      name: "Auto Expo Bharat Mobility Summit",
      eventDate: new Date(today.getTime() + 28 * 86400000).toISOString().split("T")[0],
      venueName: "Bharat Mandapam (Pragati Maidan)",
      lat: 28.6184,
      lng: 77.2415,
      expectedAttendance: 68000,
      category: "Automotive Trade Fair",
      surgePercentage: 32,
      surgeBadge: "⚡ +32% Projected Demand",
      description: "Massive automotive showcase generating high-yield VIP delegations and corporate stays.",
    },
  ];

  const enrichedEvents = eventsData.map((event) => {
    const distKm = computeHaversineKm(hotelLat, hotelLng, event.lat, event.lng);
    const distMiles = Math.round(distKm * 0.621371 * 10) / 10;
    return {
      ...event,
      distanceKm: distKm,
      distanceMiles: distMiles,
      distanceFormatted: `${distMiles} miles (${distKm} km) away`,
    };
  });

  return NextResponse.json({
    hotel: "The Claridges New Delhi",
    events: enrichedEvents,
    count: enrichedEvents.length,
    timestamp: new Date().toISOString(),
  });
}
