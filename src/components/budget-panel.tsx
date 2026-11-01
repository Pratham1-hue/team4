"use client";

import { useState, useMemo } from "react";
import {
  Plane,
  Hotel,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Info,
  IndianRupee,
  SlidersHorizontal,
  UtensilsCrossed,
  Compass,
  Footprints,
} from "lucide-react";
import type { Place, CategoryBudgets } from "@/lib/types";
import { cn, computeCost, flightEstimate, formatINR, haversineKm, stayEstimate } from "@/lib/utils";
import { Badge, Range } from "@/components/ui";

function Donut({ lines, total }: { lines: { label: string; value: number; color: string }[]; total: number }) {
  const size = 176;
  const stroke = 17;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card-2)" strokeWidth={stroke} />
        {lines.map((l) => {
          const len = total > 0 ? (l.value / total) * c : 0;
          const el = (
            <circle
              key={l.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={l.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Total</div>
        <div className="text-2xl font-extrabold tracking-tight text-fg">₹{formatINR(total)}</div>
        <div className="text-[10px] text-muted">all-in estimate</div>
      </div>
    </div>
  );
}

export function BudgetPanel({
  places,
  days,
  travellers,
  budget,
  city,
  country,
  pace,
  start,
  end,
  origin = { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  onBudgetChange,
  categoryBudgets,
  onCategoryBudgetsChange,
}: {
  places: Place[];
  days: number;
  travellers: number;
  budget: number;
  city: string;
  country: string;
  pace: string;
  start: string;
  end: string;
  origin?: { name: string; lat: number; lng: number };
  onBudgetChange?: (v: number) => void;
  categoryBudgets?: CategoryBudgets;
  onCategoryBudgetsChange?: (b: CategoryBudgets) => void;
}) {
  const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(false);
  const dest = useMemo(() => places[0] ?? null, [places]);
  const cost = useMemo(
    () => computeCost(places, days, travellers, { city, pace, budget }),
    [places, days, travellers, city, pace, budget]
  );

  const lat = dest?.lat ?? 26.9124;
  const lng = dest?.lng ?? 75.7873;
  const distance = Math.round(haversineKm(origin, { lat, lng }));
  const international = country.toLowerCase() !== "india";
  const flight = flightEstimate(distance, international) * travellers;
  const stayPerNight = stayEstimate(city, "mid");
  const delta = budget - cost.total;
  const over = delta < 0;

  const gf = `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Flights from ${origin.name} to ${city} on ${start} through ${end}`
  )}`;
  const mmt = `https://www.makemytrip.com/flights/`;
  const gh = `https://www.google.com/travel/search?q=${encodeURIComponent(`hotels in ${city}`)}`;
  const booking = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(city)}&checkin=${start}&checkout=${end}&group_adults=${travellers}&no_rooms=${Math.max(1, Math.ceil(travellers / 2))}`;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-card2/60 p-4">
          <Donut lines={cost.lines} total={cost.total} />
          <div className={cn("mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", over ? "bg-danger/10 text-danger" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
            {over ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {over ? `₹${formatINR(Math.abs(delta))} over budget` : `₹${formatINR(delta)} under budget`}
          </div>
          <div className="mt-1 text-[11px] text-muted">₹{formatINR(cost.perPerson)} per person</div>
        </div>

        <div className="space-y-2.5">
          {cost.lines.map((l) => (
            <div key={l.label} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: l.color }} />
              <span className="w-28 shrink-0 text-sm font-semibold text-fg">{l.label}</span>
              <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-card2 sm:block">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (l.value / Math.max(1, cost.total)) * 100)}%`, background: l.color }} />
              </div>
              <span className="ml-auto text-sm font-bold text-fg">₹{formatINR(l.value)}</span>
              <span className="w-[70px] text-right text-[10px] font-semibold uppercase tracking-wide text-muted">{l.confidence}</span>
            </div>
          ))}
          <div className="flex items-center gap-3 border-t border-line pt-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-fg" />
            <span className="w-28 shrink-0 text-sm font-bold text-fg">Total</span>
            <span className="ml-auto text-base font-extrabold text-fg">₹{formatINR(cost.total)}</span>
            <span className="w-[70px] text-right text-[10px] font-semibold uppercase tracking-wide text-muted">estimated</span>
          </div>
          {onBudgetChange && (
            <div className="pt-2">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-muted">Try a different budget</span>
                <span className="font-bold text-fg">₹{formatINR(budget)}</span>
              </div>
              <Range value={budget} min={5000} max={500000} step={2500} onChange={onBudgetChange} />
            </div>
          )}
        </div>
      </div>

      {/* Travel price hints */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-fg"><Plane size={15} className="text-accent" /> Flights</div>
            <Badge variant="outline">Indicative</Badge>
          </div>
          <div className="text-lg font-extrabold text-fg">≈ ₹{formatINR(flight)} <span className="text-xs font-medium text-muted">return · {travellers} pax</span></div>
          <div className="text-[11px] text-muted">{origin.name} → {city} · {distance.toLocaleString("en-IN")} km · economy</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={gf} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent hover:brightness-95">
              Google Flights <ExternalLink size={11} />
            </a>
            <a href={mmt} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-fg">
              MakeMyTrip <ExternalLink size={11} />
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-fg"><Hotel size={15} className="text-accent" /> Stays</div>
            <Badge variant="outline">Indicative</Badge>
          </div>
          <div className="text-lg font-extrabold text-fg">≈ ₹{formatINR(stayPerNight)} <span className="text-xs font-medium text-muted">/ night</span></div>
          <div className="text-[11px] text-muted">3★ mid-range · {Math.max(1, days - 1)} nights · {Math.ceil(travellers / 2)} room(s)</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={gh} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent hover:brightness-95">
              Google Hotels <ExternalLink size={11} />
            </a>
            <a href={booking} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-fg">
              Booking.com <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl bg-card2 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
        <Info size={13} className="mt-0.5 shrink-0 text-accent" />
        <span>
          Prices are indicative estimates from distance, city cost indices and live FX — not live quotes. Always confirm on the provider before booking.
          <span className="ml-1 inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400"><ShieldCheck size={11} /> Budget warning included</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Per day", value: `₹${formatINR(Math.round(cost.total / Math.max(1, days)))}` },
          { label: "Per person/day", value: `₹${formatINR(Math.round(cost.total / Math.max(1, days) / travellers))}` },
          { label: "Nights", value: `${Math.max(1, days - 1)}` },
          { label: "Travellers", value: `${travellers}` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-card2/50 px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted">{s.label}</div>
            <div className="text-sm font-extrabold text-fg">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted">
        <IndianRupee size={12} /> All amounts in INR · estimates refresh when you change dates, places or pace.
      </div>
    </div>
  );
}
