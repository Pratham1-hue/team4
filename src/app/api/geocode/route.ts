import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=6&language=en&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
    const data = await res.json();
    const results = (data.results ?? []).map((r: Record<string, unknown>) => ({
      id: `${r.id}`,
      name: r.name,
      country: r.country,
      countryCode: r.country_code,
      admin: r.admin1,
      lat: r.latitude,
      lng: r.longitude,
      population: r.population ?? 0,
      timezone: r.timezone,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Geocoding service unavailable" }, { status: 502 });
  }
}
