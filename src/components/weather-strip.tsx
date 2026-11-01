"use client";

import { useEffect, useState } from "react";
import { CloudRain, Wind, Info, RefreshCw, ThermometerSun } from "lucide-react";
import type { WeatherResponse } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Skeleton } from "@/components/ui";

export function WeatherStrip({
  lat,
  lng,
  city,
  start,
  end,
  compact = false,
}: {
  lat: number;
  lng: number;
  city: string;
  start: string;
  end: string;
  compact?: boolean;
}) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const ctrl = new AbortController();
    setState("loading");
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      name: city,
      start,
      end,
    });
    fetch(`/api/weather?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error("weather failed");
        return r.json();
      })
      .then((d: WeatherResponse) => {
        if (d.daily?.length) {
          setData(d);
          setState("ok");
        } else setState("error");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setState("error");
      });
    return () => ctrl.abort();
  }, [lat, lng, city, start, end]);

  if (state === "loading") {
    return (
      <div className={cn("flex gap-2 overflow-hidden", compact ? "" : "rounded-2xl border border-line bg-card p-4")}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className={cn("shrink-0", compact ? "h-10 w-24" : "h-24 w-20")} />
        ))}
      </div>
    );
  }

  if (state === "error" || !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-2 text-xs text-muted">
        <Info size={14} className="text-accent" />
        Weather unavailable right now — check again closer to your dates.
        <button onClick={() => setState("loading")} className="ml-auto text-accent" aria-label="Retry weather">
          <RefreshCw size={13} />
        </button>
      </div>
    );
  }

  const rainyDays = data.daily.filter((d) => d.rain >= 2.5 || d.code >= 61);

  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {data.daily.slice(0, 4).map((d) => (
          <div key={d.date} className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-2.5 py-1.5">
            <span className="text-base leading-none">{d.icon}</span>
            <span className="text-[11px] font-bold text-fg">{d.tMax}°</span>
            <span className="text-[10px] text-muted">{formatDate(d.date, { weekday: "short" })}</span>
          </div>
        ))}
        <Badge variant="outline" className="shrink-0">{data.source === "forecast" ? "Forecast" : "Typical"}</Badge>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent"><ThermometerSun size={16} /></span>
          <div>
            <div className="text-sm font-bold text-fg">Weather in {data.city}</div>
            <div className="text-[11px] text-muted">
              {data.source === "forecast" ? "Live 16-day forecast" : "Typical weather from last year"} · Open-Meteo
            </div>
          </div>
        </div>
        <Badge variant={data.source === "forecast" ? "green" : "outline"}>
          {data.source === "forecast" ? "Forecast" : "Historical average"}
        </Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {data.daily.map((d) => (
          <div key={d.date} className="flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border border-line bg-card2 px-2 py-3">
            <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
              {formatDate(d.date, { weekday: "short" })}
            </span>
            <span className="text-[11px] text-muted">{formatDate(d.date, { day: "numeric", month: "short" })}</span>
            <span className="text-2xl leading-none">{d.icon}</span>
            <span className="text-sm font-bold text-fg">{d.tMax}°</span>
            <span className="text-[10px] text-muted">{d.tMin}°</span>
            <span className="flex items-center gap-0.5 text-[10px] text-sky-500"><CloudRain size={10} />{d.rain}mm</span>
            <span className="flex items-center gap-0.5 text-[10px] text-muted"><Wind size={10} />{d.wind}</span>
          </div>
        ))}
      </div>

      {rainyDays.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <CloudRain size={14} className="mt-0.5 shrink-0" />
          <span>
            Rain likely on {rainyDays.slice(0, 2).map((d) => formatDate(d.date, { weekday: "long" })).join(" and ")}. I&apos;ll keep an indoor backup ready for those days.
          </span>
        </div>
      )}

      <div className="mt-2 text-[10px] text-muted">{data.attribution} · updated {new Date(data.fetchedAt).toLocaleString()}</div>
    </div>
  );
}
