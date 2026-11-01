import { NextRequest, NextResponse } from "next/server";
import { weatherIcon, weatherLabel } from "@/lib/utils";

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);

interface DailyApi {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_sum?: number[];
  wind_speed_10m_max?: number[];
}

function mapDays(
  data: DailyApi,
  targetDates: string[],
  source: "forecast" | "typical"
) {
  const times = data.time ?? [];
  return targetDates.map((date, i) => {
    const idx = Math.min(i, times.length - 1);
    const code = data.weather_code?.[idx] ?? 1;
    return {
      date,
      code,
      label: weatherLabel(code),
      icon: weatherIcon(code),
      tMax: Math.round(data.temperature_2m_max?.[idx] ?? 24),
      tMin: Math.round(data.temperature_2m_min?.[idx] ?? 14),
      rain: Math.round((data.precipitation_sum?.[idx] ?? 0) * 10) / 10,
      wind: Math.round(data.wind_speed_10m_max?.[idx] ?? 10),
      source,
    };
  });
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  const name = p.get("name") ?? "Destination";

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startParam = p.get("start");
  const endParam = p.get("end");

  const start = startParam ? new Date(startParam + "T12:00:00") : new Date(today);
  const end = endParam ? new Date(endParam + "T12:00:00") : new Date(today.getTime() + 4 * DAY);
  const dayCount = Math.max(1, Math.min(16, Math.round((end.getTime() - start.getTime()) / DAY) + 1));
  const targetDates = Array.from({ length: dayCount }, (_, i) => iso(new Date(start.getTime() + i * DAY)));

  const diffFromToday = Math.round((start.getTime() - today.getTime()) / DAY);
  const useForecast = diffFromToday >= -1 && diffFromToday <= 14;

  try {
    if (useForecast) {
      const endForecast = iso(new Date(Math.min(start.getTime() + (dayCount - 1) * DAY, today.getTime() + 15 * DAY)));
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
        `&timezone=auto&start_date=${iso(start)}&end_date=${endForecast}`;
      const res = await fetch(url, { next: { revalidate: 1800 } });
      if (!res.ok) throw new Error(`forecast ${res.status}`);
      const data = (await res.json()) as { daily?: DailyApi };
      const daily = mapDays(data.daily ?? {}, targetDates, "forecast");
      return NextResponse.json({
        city: name,
        latitude: lat,
        longitude: lng,
        daily,
        source: "forecast",
        fetchedAt: new Date().toISOString(),
        attribution: "Weather data by Open-Meteo (CC BY 4.0)",
      });
    }

    // Historical same-period data = "typical weather" for future trips
    const histStart = new Date(start);
    const histEnd = new Date(end);
    histStart.setFullYear(histStart.getFullYear() - 1);
    histEnd.setFullYear(histEnd.getFullYear() - 1);

    const url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=auto&start_date=${iso(histStart)}&end_date=${iso(histEnd)}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`archive ${res.status}`);
    const data = (await res.json()) as { daily?: DailyApi };
    const daily = mapDays(data.daily ?? {}, targetDates, "typical");
    return NextResponse.json({
      city: name,
      latitude: lat,
      longitude: lng,
      daily,
      source: "typical",
      fetchedAt: new Date().toISOString(),
      attribution: "Typical weather from historical data by Open-Meteo (CC BY 4.0)",
    });
  } catch {
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }
}
