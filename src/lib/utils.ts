import type { Place, Trip, ItineraryDay } from "./types";

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const uid = (prefix = "id") =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n));

export const formatMoney = (n: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${formatINR(n)}`;
  }
};

export const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  return d.toLocaleDateString("en-IN", opts);
};

export const dateRangeLabel = (start: string, end: string) =>
  `${formatDate(start)} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AVATAR_COLORS = ["#0f9d8f", "#6366f1", "#ec4899", "#f59e0b", "#0ea5e9", "#8b5cf6", "#f97316", "#10b981"];
export const avatarColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

export const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export interface CostBreakdown {
  stays: number;
  food: number;
  activities: number;
  transport: number;
  buffer: number;
  total: number;
  perPerson: number;
  confidence: "confirmed" | "estimated" | "rough";
  lines: { label: string; value: number; note: string; confidence: "confirmed" | "estimated" | "rough"; color: string }[];
}

const CITY_TIER: Record<string, number> = {
  jaipur: 1,
  goa: 1.25,
  bali: 1.15,
  kyoto: 2.1,
  paris: 2.4,
  lisbon: 1.7,
};

export function computeCost(
  places: Place[],
  days: number,
  travellers: number,
  options: { city?: string; pace?: string; budget?: number } = {}
): CostBreakdown {
  const city = (options.city || places[0]?.city || "jaipur").toLowerCase();
  const tier = CITY_TIER[city] ?? 1.2;
  const nights = Math.max(1, days - 1);
  const rooms = Math.max(1, Math.ceil(travellers / 2));

  const stays = Math.round(2600 * tier * nights * rooms);
  const mealsPerDay = options.pace === "packed" ? 4 : options.pace === "relaxed" ? 2 : 3;
  const food = Math.round(550 * tier * mealsPerDay * days * travellers);
  const activities = Math.round(
    places.filter((p) => p.category !== "Stay").reduce((s, p) => s + p.price, 0) * travellers
  );
  const transport = Math.round(450 * tier * days * travellers);
  const buffer = Math.round((stays + food + activities + transport) * 0.1);
  const total = stays + food + activities + transport + buffer;

  const lines = [
    { label: "Stays", value: stays, note: `${nights} nights · ${rooms} room${rooms > 1 ? "s" : ""}`, confidence: "estimated" as const, color: "#0f9d8f" },
    { label: "Food", value: food, note: `${mealsPerDay} meals/day · ${travellers} pax`, confidence: "estimated" as const, color: "#f59e0b" },
    { label: "Activities", value: activities, note: `${places.length} experiences`, confidence: "confirmed" as const, color: "#6366f1" },
    { label: "Local transport", value: transport, note: "Cabs, metro & transfers", confidence: "rough" as const, color: "#0ea5e9" },
    { label: "Buffer", value: buffer, note: "10% safety margin", confidence: "rough" as const, color: "#94a3b8" },
  ];

  return { stays, food, activities, transport, buffer, total, perPerson: Math.round(total / Math.max(1, travellers)), confidence: "estimated", lines };
}

export function buildItinerary(places: Place[], days: number, startDate?: string): ItineraryDay[] {
  const shuffled = [...places];
  const perDay = Math.max(1, Math.min(4, Math.ceil(shuffled.length / Math.max(1, days))));
  const times = ["09:00", "12:30", "15:30", "18:30", "20:30"];
  const daysArr: ItineraryDay[] = [];
  let idx = 0;
  for (let d = 1; d <= days; d++) {
    const take = Math.min(perDay, shuffled.length - idx);
    const items = shuffled.slice(idx, idx + Math.max(0, take)).map((p, i) => ({
      id: `${p.id}-d${d}-${i}`,
      placeId: p.id,
      time: times[i] ?? "20:00",
      duration: p.duration,
      cost: p.price,
    }));
    idx += Math.max(0, take);
    const date = startDate
      ? new Date(new Date(startDate + "T12:00:00").getTime() + (d - 1) * 86400000).toISOString().slice(0, 10)
      : "";
    daysArr.push({ day: d, date, items });
  }
  return daysArr;
}

export const tripTotal = (trip: Trip) =>
  trip.itinerary.reduce((s, d) => s + d.items.reduce((x, i) => x + i.cost, 0), 0);

export function downloadICS(trip: Trip) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Yatri//Trip Planner//EN",
    "CALSCALE:GREGORIAN",
  ];
  trip.itinerary.forEach((day) => {
    day.items.forEach((item) => {
      const date = day.date || trip.startDate;
      const start = `${date.replace(/-/g, "")}T${item.time.replace(":", "")}00`;
      const [h, m] = item.time.split(":").map(Number);
      const endH = String(Math.min(23, h + 2)).padStart(2, "0");
      const end = `${date.replace(/-/g, "")}T${endH}${String(m).padStart(2, "0")}00`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${trip.id}-${day.day}-${item.id}@yatri.app`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${trip.title} — stop ${day.day}`,
        `DESCRIPTION:${trip.destination} · stop ${item.placeId}`,
        "END:VEVENT"
      );
    });
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${trip.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export const googleMapsDirections = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

export const googleMapsPlace = (name: string, city: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${city}`)}`;

export const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const weatherIcon = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "❄️";
  return "⛈️";
};

export const weatherLabel = (code: number): string => {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 86) return "Snow showers";
  return "Thunderstorm";
};

export const flightEstimate = (distanceKm: number, international: boolean) => {
  const base = international ? 9500 : 2400;
  const rate = international ? 3.6 : 2.8;
  return Math.round((base + distanceKm * rate) / 100) * 100;
};

export const stayEstimate = (city: string, tier: "budget" | "mid" | "luxury" = "mid") => {
  const idx = CITY_TIER[city.toLowerCase()] ?? 1.2;
  const base = tier === "budget" ? 1400 : tier === "luxury" ? 8200 : 3200;
  return Math.round((base * idx) / 100) * 100;
};
