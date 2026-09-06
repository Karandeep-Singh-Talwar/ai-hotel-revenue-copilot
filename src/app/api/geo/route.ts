import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing 'q' query parameter" }, { status: 400 });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "AI-Hotel-Revenue-Copilot/1.0",
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error?.message || "Geocoding failed" }, { status: 500 });
  }
}
