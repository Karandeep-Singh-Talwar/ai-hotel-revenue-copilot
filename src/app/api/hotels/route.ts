import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, radius = 5000 } = body;

    if (!lat || !lon) {
      return NextResponse.json({ error: "lat and lon are required" }, { status: 400 });
    }

    const overpassQuery = `[out:json][timeout:25];(node["tourism"="hotel"](around:${radius},${lat},${lon});way["tourism"="hotel"](around:${radius},${lat},${lon});relation["tourism"="hotel"](around:${radius},${lat},${lon}););out center;`;
    const overpassUrl = "https://overpass-api.de/api/interpreter";

    const res = await fetch(overpassUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AI-Hotel-Revenue-Copilot/1.0",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    // Return sample nearby hotels if overpass is rate-limited
    return NextResponse.json({
      elements: [
        { id: 101, lat: 28.6239, lon: 77.2188, tags: { name: "The Imperial New Delhi" } },
        { id: 102, lat: 28.5934, lon: 77.2384, tags: { name: "The Lodhi New Delhi" } },
        { id: 103, lat: 28.5989, lon: 77.2392, tags: { name: "The Oberoi New Delhi" } },
        { id: 104, lat: 28.6047, lon: 77.2248, tags: { name: "Taj Mahal Hotel New Delhi" } },
      ],
      warning: error?.message,
    });
  }
}
