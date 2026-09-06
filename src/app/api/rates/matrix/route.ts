/**
 * Rates Matrix API Endpoint (/api/rates/matrix)
 * Provides multi-channel pricing grid data (Agoda, Booking.com, MakeMyTrip)
 * and 14-day historical competitor pricing telemetry for the slide-out drawer.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || "1";

  // Base dates (today + 7 days rolling)
  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Client hotel rate baseline
  const myHotel = {
    id: 1,
    name: "The Claridges New Delhi",
    standardRate: 7200,
    ratesByDate: {
      [dates[0]]: 7200,
      [dates[1]]: 7200,
      [dates[2]]: 7400,
      [dates[3]]: 7400,
      [dates[4]]: 8100, // Weekend
      [dates[5]]: 8100, // Weekend
      [dates[6]]: 7500,
    },
  };

  // Competitor rates across channels
  const competitors = [
    {
      id: 101,
      name: "The Imperial New Delhi",
      starRating: 5,
      reviewScore: 9.2,
      channels: {
        Agoda: { rate: 9800, rawRoom: "Heritage Classic Double" },
        "Booking.com": { rate: 10200, rawRoom: "Deluxe King Room" },
        MakeMyTrip: { rate: 9950, rawRoom: "Executive Heritage Room" },
      },
      // 14-day historical trend
      history14Days: [
        { day: "Day -13", competitorRate: 9200, myRate: 7000 },
        { day: "Day -11", competitorRate: 9350, myRate: 7000 },
        { day: "Day -9", competitorRate: 9100, myRate: 7100 },
        { day: "Day -7", competitorRate: 9600, myRate: 7100 },
        { day: "Day -5", competitorRate: 9900, myRate: 7200 },
        { day: "Day -3", competitorRate: 10100, myRate: 7200 },
        { day: "Day -1", competitorRate: 9800, myRate: 7200 },
        { day: "Today", competitorRate: 9950, myRate: 7200 },
      ],
    },
    {
      id: 102,
      name: "The Lodhi New Delhi",
      starRating: 5,
      reviewScore: 9.4,
      channels: {
        Agoda: { rate: 12500, rawRoom: "Lodhi Room Plunge Pool" },
        "Booking.com": { rate: 12900, rawRoom: "Lodhi Deluxe King" },
        MakeMyTrip: { rate: 12400, rawRoom: "Lodhi Premier Room" },
      },
      history14Days: [
        { day: "Day -13", competitorRate: 11800, myRate: 7000 },
        { day: "Day -11", competitorRate: 12000, myRate: 7000 },
        { day: "Day -9", competitorRate: 12100, myRate: 7100 },
        { day: "Day -7", competitorRate: 12400, myRate: 7100 },
        { day: "Day -5", competitorRate: 12700, myRate: 7200 },
        { day: "Day -3", competitorRate: 12850, myRate: 7200 },
        { day: "Day -1", competitorRate: 12900, myRate: 7200 },
        { day: "Today", competitorRate: 12600, myRate: 7200 },
      ],
    },
    {
      id: 103,
      name: "The Oberoi New Delhi",
      starRating: 5,
      reviewScore: 9.6,
      channels: {
        Agoda: { rate: 13900, rawRoom: "Deluxe Golf View" },
        "Booking.com": { rate: 14200, rawRoom: "Premier Room City View" },
        MakeMyTrip: { rate: 13800, rawRoom: "Luxury King" },
      },
      history14Days: [
        { day: "Day -13", competitorRate: 13200, myRate: 7000 },
        { day: "Day -11", competitorRate: 13500, myRate: 7000 },
        { day: "Day -9", competitorRate: 13400, myRate: 7100 },
        { day: "Day -7", competitorRate: 13800, myRate: 7100 },
        { day: "Day -5", competitorRate: 14100, myRate: 7200 },
        { day: "Day -3", competitorRate: 14200, myRate: 7200 },
        { day: "Day -1", competitorRate: 14000, myRate: 7200 },
        { day: "Today", competitorRate: 13950, myRate: 7200 },
      ],
    },
    {
      id: 104,
      name: "Taj Mahal Hotel (Mansingh)",
      starRating: 5,
      reviewScore: 9.1,
      channels: {
        Agoda: { rate: 10800, rawRoom: "Superior City View" },
        "Booking.com": { rate: 11200, rawRoom: "Deluxe King Room" },
        MakeMyTrip: { rate: 10900, rawRoom: "Taj Club Executive" },
      },
      history14Days: [
        { day: "Day -13", competitorRate: 10200, myRate: 7000 },
        { day: "Day -11", competitorRate: 10400, myRate: 7000 },
        { day: "Day -9", competitorRate: 10500, myRate: 7100 },
        { day: "Day -7", competitorRate: 10900, myRate: 7100 },
        { day: "Day -5", competitorRate: 11100, myRate: 7200 },
        { day: "Day -3", competitorRate: 11300, myRate: 7200 },
        { day: "Day -1", competitorRate: 11000, myRate: 7200 },
        { day: "Today", competitorRate: 10950, myRate: 7200 },
      ],
    },
    {
      id: 105,
      name: "Bloomrooms @ Janpath",
      starRating: 3,
      reviewScore: 8.3,
      channels: {
        Agoda: { rate: 4200, rawRoom: "Queen Standard Non-Smoking" },
        "Booking.com": { rate: 4500, rawRoom: "Standard Room" },
        MakeMyTrip: { rate: 4100, rawRoom: "Value Queen" },
      },
      history14Days: [
        { day: "Day -13", competitorRate: 4000, myRate: 7000 },
        { day: "Day -11", competitorRate: 4100, myRate: 7000 },
        { day: "Day -9", competitorRate: 4200, myRate: 7100 },
        { day: "Day -7", competitorRate: 4300, myRate: 7100 },
        { day: "Day -5", competitorRate: 4400, myRate: 7200 },
        { day: "Day -3", competitorRate: 4500, myRate: 7200 },
        { day: "Day -1", competitorRate: 4300, myRate: 7200 },
        { day: "Today", competitorRate: 4200, myRate: 7200 },
      ],
    },
  ];

  return NextResponse.json({
    hotelId: parseInt(hotelId, 10),
    dates,
    myHotel,
    competitors,
    channels: ["Agoda", "Booking.com", "MakeMyTrip"],
    timestamp: new Date().toISOString(),
  });
}
