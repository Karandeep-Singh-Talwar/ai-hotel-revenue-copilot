/**
 * Active AI Recommendation API (/api/recommendations/latest)
 * Supplies hero banner data, current rate vs optimal rate comparison,
 * pace curves, and projected RevPAR lift for the AI Action Center.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || "1";

  const targetStayDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  // Pace curve comparison: current booking trajectory vs optimized booking trajectory
  const paceCurve = [
    { daysOut: "30d Out", currentVelocity: 12, optimizedCurve: 10, currentOcc: 15, optimizedOcc: 14 },
    { daysOut: "25d Out", currentVelocity: 18, optimizedCurve: 16, currentOcc: 28, optimizedOcc: 26 },
    { daysOut: "20d Out", currentVelocity: 25, optimizedCurve: 22, currentOcc: 42, optimizedOcc: 38 },
    { daysOut: "15d Out", currentVelocity: 35, optimizedCurve: 32, currentOcc: 55, optimizedOcc: 50 },
    { daysOut: "10d Out", currentVelocity: 48, optimizedCurve: 45, currentOcc: 68, optimizedOcc: 65 },
    { daysOut: "5d Out",  currentVelocity: 62, optimizedCurve: 74, currentOcc: 75, optimizedOcc: 82 },
    { daysOut: "1d Out",  currentVelocity: 71, optimizedCurve: 92, currentOcc: 80, optimizedOcc: 94 },
    { daysOut: "Check-in", currentVelocity: 74, optimizedCurve: 96, currentOcc: 82, optimizedOcc: 98 },
  ];

  const activeRecommendation = {
    id: 1,
    hotelId: parseInt(hotelId, 10),
    hotelName: "The Claridges New Delhi",
    headline: "Ed Sheeran Concert & Tech Expo Pricing Surge",
    stayDate: targetStayDate,
    currentRate: 7200,
    recommendedRate: 8950,
    rateDelta: 1750,
    rateDeltaPct: 24.3,
    modelConfidence: 0.94,
    projectedRevparLiftPct: 18.4,
    status: "Pending",
    explanationText:
      "Global AI & Cloud Tech Expo (42k delegates) at Bharat Mandapam (2.1 km away) has driven competitor median to ₹10,850. With internal occupancy at 68% and booking velocity up 3.2x, increasing rate to ₹8,950 captures ₹2.45L additional RevPAR without stalling conversion.",
    eventContext: {
      name: "Global AI & Cloud Tech Expo 2026",
      venue: "Bharat Mandapam (Pragati Maidan)",
      distance: "1.3 miles (2.1 km)",
      attendance: 42000,
    },
    paceCurve,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(activeRecommendation);
}
