"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GeoResult {
  id: string;
  name: string;
  country: string;
  countryCode?: string;
  admin?: string;
  lat: number;
  lng: number;
  population?: number;
}

const flag = (cc?: string) =>
  cc ? cc.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "🌍";

export function DestinationInput({
  value,
  onChange,
  onSelect,
  placeholder = "Where to next?",
  className,
  inputClassName,
  autoFocus,
  icon = "pin",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (r: GeoResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  autoFocus?: boolean;
  icon?: "pin" | "search";
}) {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const skipRef = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skipRef.current) {
      skipRef.current = false;
      return;
    }
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(value.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { results: GeoResult[] }) => {
          setResults(d.results ?? []);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 320);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (r: GeoResult) => {
    skipRef.current = true;
    onChange(`${r.name}, ${r.country}`);
    onSelect?.(r);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-accent">
        {icon === "search" ? <Search size={17} /> : <MapPin size={17} />}
      </div>
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border border-line bg-card py-3 pl-10 pr-10 text-sm font-medium text-fg outline-none transition placeholder:font-normal placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-accent/15",
          inputClassName
        )}
      />
      {loading && <Loader2 size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-72 overflow-y-auto rounded-xl border border-line bg-card p-1.5 shadow-lift">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => pick(r)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-card2"
            >
              <span className="text-lg">{flag(r.countryCode)}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">{r.name}</span>
                <span className="block truncate text-[11px] text-muted">
                  {[r.admin, r.country].filter(Boolean).join(", ")}
                </span>
              </span>
              {typeof r.population === "number" && r.population > 0 && (
                <span className="ml-auto shrink-0 text-[10px] text-muted">{Math.round(r.population / 1000)}k</span>
              )}
            </button>
          ))}
          <div className="px-2.5 py-1.5 text-[10px] text-muted">Powered by Open-Meteo geocoding</div>
        </div>
      )}
    </div>
  );
}
