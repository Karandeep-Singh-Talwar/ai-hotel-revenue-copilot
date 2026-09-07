/**
 * Rates Matrix API Endpoint (/api/rates/matrix)
 * Provides multi-channel pricing grid data (MakeMyTrip, Booking.com, Agoda)
 * for Lemon Tree Premier, Aerocity New Delhi and its Aerocity comp-set.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || "1";
  const roomType = searchParams.get("roomType") || "superior";

  // Base dates (today + 7 days rolling)
  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Base rate multiplier by room type
  const roomMultipliers: Record<string, number> = {
    superior: 1.0,
    deluxe: 1.19,
    executive: 1.47,
    suite: 2.15,
  };
  const multiplier = roomMultipliers[roomType] || 1.0;
  const baseRate = Math.round(5800 * multiplier);

  // Client hotel rate baseline
  const myHotel = {
    id: 1,
    name: "Lemon Tree Premier, Aerocity",
    standardRate: baseRate,
    ratesByDate: {
      [dates[0]]: baseRate,
      [dates[1]]: baseRate,
      [dates[2]]: Math.round(baseRate * 1.05),
      [dates[3]]: Math.round(baseRate * 1.05),
      [dates[4]]: Math.round(baseRate * 1.15), // Weekend
      [dates[5]]: Math.round(baseRate * 1.15), // Weekend
      [dates[6]]: Math.round(baseRate * 1.08),
    },
  };

  // Competitor rates across Aerocity hospitality cluster
  const competitors = [
    {
      id: 101,
      name: "Aloft New Delhi Aerocity",
      starRating: 5,
      reviewScore: 8.9,
      channels: {
        MakeMyTrip: { rate: Math.round(8400 * multiplier), rawRoom: "Aloft Room" },
        "Booking.com": { rate: Math.round(8650 * multiplier), rawRoom: "Breezy Room" },
        Agoda: { rate: Math.round(8350 * multiplier), rawRoom: "Aloft King" },
      },
    },
    {
      id: 102,
      name: "Holiday Inn Express Aerocity",
      starRating: 4,
      reviewScore: 8.7,
      channels: {
        MakeMyTrip: { rate: Math.round(6900 * multiplier), rawRoom: "Standard Room" },
        "Booking.com": { rate: Math.round(7100 * multiplier), rawRoom: "Queen Bed Standard" },
        Agoda: { rate: Math.round(6850 * multiplier), rawRoom: "Standard Twin" },
      },
    },
    {
      id: 103,
      name: "Novotel New Delhi Aerocity",
      starRating: 5,
      reviewScore: 8.8,
      channels: {
        MakeMyTrip: { rate: Math.round(9200 * multiplier), rawRoom: "Superior Room" },
        "Booking.com": { rate: Math.round(9450 * multiplier), rawRoom: "Superior King" },
        Agoda: { rate: Math.round(9150 * multiplier), rawRoom: "Superior Room City View" },
      },
    },
    {
      id: 104,
      name: "Pullman New Delhi Aerocity",
      starRating: 5,
      reviewScore: 9.1,
      channels: {
        MakeMyTrip: { rate: Math.round(12800 * multiplier), rawRoom: "Deluxe King Room" },
        "Booking.com": { rate: Math.round(13200 * multiplier), rawRoom: "Deluxe Room" },
        Agoda: { rate: Math.round(12650 * multiplier), rawRoom: "Deluxe King" },
      },
    },
    {
      id: 105,
      name: "Ibis New Delhi Aerocity",
      starRating: 3,
      reviewScore: 8.2,
      channels: {
        MakeMyTrip: { rate: Math.round(4600 * multiplier), rawRoom: "Standard Room" },
        "Booking.com": { rate: Math.round(4750 * multiplier), rawRoom: "Queen Room" },
        Agoda: { rate: Math.round(4550 * multiplier), rawRoom: "Standard Room" },
      },
    },
  ];

  return NextResponse.json({
    dates,
    myHotel,
    competitors,
    hotelId,
    roomType,
  });
}
