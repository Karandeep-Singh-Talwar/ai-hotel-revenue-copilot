/**
 * Active AI Recommendation API (/api/recommendations/latest)
 * Supplies hero banner data, current rate vs optimal rate comparison,
 * room categories, pace curves, and projected revenue gain for Lemon Tree Premier Aerocity.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || "1";

  const targetStayDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Pace curve comparison: current booking trajectory vs optimized booking trajectory
  const paceCurve = [
    { daysOut: "30 Days Out", currentVelocity: 14, optimizedCurve: 12, currentOcc: 18, optimizedOcc: 16 },
    { daysOut: "25 Days Out", currentVelocity: 22, optimizedCurve: 20, currentOcc: 32, optimizedOcc: 30 },
    { daysOut: "20 Days Out", currentVelocity: 30, optimizedCurve: 26, currentOcc: 48, optimizedOcc: 44 },
    { daysOut: "15 Days Out", currentVelocity: 42, optimizedCurve: 38, currentOcc: 62, optimizedOcc: 58 },
    { daysOut: "10 Days Out", currentVelocity: 55, optimizedCurve: 52, currentOcc: 74, optimizedOcc: 70 },
    { daysOut: "5 Days Out",  currentVelocity: 68, optimizedCurve: 78, currentOcc: 80, optimizedOcc: 86 },
    { daysOut: "1 Day Out",   currentVelocity: 76, optimizedCurve: 94, currentOcc: 84, optimizedOcc: 96 },
    { daysOut: "Check-in Day", currentVelocity: 78, optimizedCurve: 98, currentOcc: 86, optimizedOcc: 99 },
  ];

  const roomTypes = [
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
    },
    {
      id: "deluxe",
      name: "Deluxe Room",
      specs: "320 sq ft • Pool & Runway View • Work Desk",
      currentRate: 6900,
      suggestedRate: 8450,
      gain: 1550,
      increasePct: 22.5,
      totalRooms: 85,
      bookedRooms: 61,
      occupancy: 72,
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
    },
    {
      id: "suite",
      name: "Executive Suite",
      specs: "550 sq ft • Separate Living Room • VIP Airport Transfer",
      currentRate: 12500,
      suggestedRate: 15400,
      gain: 2900,
      increasePct: 23.2,
      totalRooms: 20,
      bookedRooms: 10,
      occupancy: 50,
    },
  ];

  const activeRecommendation = {
    id: 1,
    hotelId: parseInt(hotelId, 10),
    hotelName: "Lemon Tree Premier, Delhi Airport (Aerocity)",
    headline: "Aviation India Expo & Yashobhoomi Trade Summit Demand Surge",
    stayDate: targetStayDate,
    currentRate: 5800,
    recommendedRate: 7200,
    rateDelta: 1400,
    rateDeltaPct: 24.1,
    modelConfidence: 0.95,
    projectedRevparLiftPct: 22.4,
    status: "Pending",
    explanationText:
      "Aviation India Expo & Global Trade Summit at Yashobhoomi IICC Dwarka (8.2 km away) has driven Aerocity competitor prices up by 18%. With Lemon Tree Aerocity occupancy at 75% across our 287 rooms, raising the Superior Room rate from ₹5,800 to ₹7,200 captures ₹3.42L additional revenue without losing bookings.",
    eventContext: {
      name: "Aviation India Expo & Global Trade Summit 2026",
      venue: "Yashobhoomi IICC Dwarka (12 mins from Aerocity)",
      distance: "8.2 km",
      attendance: 48000,
    },
    roomTypes,
    paceCurve,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(activeRecommendation);
}
