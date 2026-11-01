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

// WeatherAPI.com integration helper
async function fetchWeatherApiKey(lat: number, lng: number, days = 7) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=${days}&aqi=no&alerts=no`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const data = await res.json();
    const forecastdays = data?.forecast?.forecastday || [];

    return forecastdays.map((fd: any) => ({
      date: fd.date,
      code: fd.day.condition.code > 1000 ? 2 : 0,
      label: fd.day.condition.text,
      icon: fd.day.condition.icon ? `https:${fd.day.condition.icon}` : "☀️",
      tMax: Math.round(fd.day.maxtemp_c),
      tMin: Math.round(fd.day.mintemp_c),
      rain: fd.day.totalprecip_mm || 0,
      wind: Math.round(fd.day.maxwind_kph),
      source: "forecast" as const,
    }));
  } catch {
    return null;
  }
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
    // If WeatherAPI.com key is configured and active, prefer it for live forecasts
    if (useForecast && process.env.WEATHER_API_KEY) {
      const weatherApiDays = await fetchWeatherApiKey(lat, lng, Math.min(dayCount, 7));
      if (weatherApiDays && weatherApiDays.length > 0) {
        return NextResponse.json({
          city: name,
          latitude: lat,
          longitude: lng,
          daily: weatherApiDays,
          source: "forecast",
          fetchedAt: new Date().toISOString(),
          attribution: "Powered by WeatherAPI.com",
        });
      }
    }

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
        attribution: "Weather data by Open-Meteo & WeatherAPI",
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
      attribution: "Historical typical weather (archive data)",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch weather" },
      { status: 502 }
    );
  }
}
