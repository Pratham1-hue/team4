"use client";

import { motion } from "framer-motion";
import {
  Plane,
  Clock,
  MapPin,
  AlertTriangle,
  Wind,
  CloudRain,
  Sun,
  ShieldCheck,
  Luggage,
  Sparkles,
} from "lucide-react";
import type { FlightInfo, FlightStatus } from "@/lib/flights/types";
import { Badge, Button } from "@/components/ui";

interface Props {
  flight: FlightInfo;
  onRefresh?: () => void;
}

export function FlightTrackerCard({ flight, onRefresh }: Props) {
  const statusStyles: Record<FlightStatus, { label: string; variant: "green" | "gold" | "red" | "soft" }> = {
    on_time: { label: "On Time", variant: "green" },
    scheduled: { label: "Scheduled", variant: "soft" },
    boarding: { label: "Boarding Now", variant: "green" },
    departed: { label: "Departed", variant: "soft" },
    in_air: { label: "In Air", variant: "green" },
    delayed: { label: `Delayed (${flight.delayMinutes}m)`, variant: "gold" },
    landed: { label: "Landed", variant: "green" },
    cancelled: { label: "Cancelled", variant: "red" },
  };

  const statusConfig = statusStyles[flight.status] || statusStyles.on_time;
  const depWeather = flight.origin.weather;
  const arrWeather = flight.destination.weather;

  return (
    <div className="rounded-3xl border border-line bg-card p-6 shadow-xl transition-all duration-200 hover:border-accent/40">
      {/* Top Header: Airline & Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent font-black text-sm">
            {flight.airlineCode}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-fg">{flight.airline}</h3>
              <span className="font-mono text-sm font-bold text-accent">
                {flight.flightNumber}
              </span>
            </div>
            <p className="text-xs text-muted">
              {flight.aircraftType || "Commercial Airliner"} · {flight.date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className="text-xs px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
            {statusConfig.label}
          </Badge>
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh} className="h-8 px-2.5 text-xs">
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Flight Route Visual with Animated Airplane */}
      <div className="my-6">
        <div className="grid grid-cols-2 gap-4 text-center sm:text-left">
          {/* Origin Airport */}
          <div>
            <span className="text-3xl font-black text-fg tracking-tight">
              {flight.origin.code}
            </span>
            <p className="text-xs font-semibold text-fg mt-0.5 truncate">{flight.origin.city}</p>
            <p className="text-[11px] text-muted truncate">{flight.origin.name}</p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-lg bg-card2 border border-line px-2 py-0.5 text-[11px] font-bold text-fg">
                {flight.origin.terminal}
              </span>
              <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
                Gate {flight.origin.gate}
              </span>
            </div>
            <p className="mt-2 text-xs font-mono text-muted">
              Dep: <strong className="text-fg">{flight.origin.scheduledTime}</strong>
            </p>
          </div>

          {/* Destination Airport */}
          <div className="text-right">
            <span className="text-3xl font-black text-fg tracking-tight">
              {flight.destination.code}
            </span>
            <p className="text-xs font-semibold text-fg mt-0.5 truncate">{flight.destination.city}</p>
            <p className="text-[11px] text-muted truncate">{flight.destination.name}</p>

            <div className="mt-2 flex flex-wrap justify-end gap-1.5">
              <span className="rounded-lg bg-card2 border border-line px-2 py-0.5 text-[11px] font-bold text-fg">
                {flight.destination.terminal}
              </span>
              <span className="rounded-lg bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent">
                {flight.destination.gate}
              </span>
              {flight.destination.baggageClaim && (
                <span className="rounded-lg bg-card2 border border-line px-2 py-0.5 text-[11px] font-bold text-muted flex items-center gap-1">
                  <Luggage size={11} /> {flight.destination.baggageClaim}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs font-mono text-muted">
              ETA: <strong className="text-fg">{flight.destination.estimatedTime || flight.destination.scheduledTime}</strong>
            </p>
          </div>
        </div>

        {/* Progress Bar & Moving Airplane */}
        <div className="relative mt-5 mb-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${flight.progressPercent}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-accent"
            />
          </div>

          <motion.div
            initial={{ left: "0%" }}
            animate={{ left: `${Math.max(5, Math.min(95, flight.progressPercent))}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute -top-3.5 -translate-x-1/2 grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-fg shadow-lg border-2 border-card"
          >
            <Plane size={14} className="rotate-90" />
          </motion.div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted">
          <span>Flight Duration: {flight.duration}</span>
          <span>{flight.progressPercent}% Completed</span>
        </div>
      </div>

      {/* Weather-Aware Alerts Section */}
      <div className="mt-4 rounded-2xl border border-line bg-card2/50 p-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-fg mb-3">
          <Sparkles size={14} className="text-accent" />
          <span>Weather-Aware Flight Radar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Departure Weather */}
          <div className="rounded-xl border border-line/70 bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-fg text-[11px] uppercase tracking-wide">
                {flight.origin.code} ({flight.origin.city})
              </span>
              <span className="text-xs font-bold text-accent">
                {depWeather?.temp ?? 26}°C
              </span>
            </div>
            <p className="text-[11px] text-muted mt-1">{depWeather?.condition ?? "Fair"}</p>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Wind size={11} /> {depWeather?.windSpeed ?? 12} km/h wind
              </span>
              <span className="flex items-center gap-1">
                <CloudRain size={11} /> {depWeather?.rainProb ?? 10}% precip
              </span>
            </div>
          </div>

          {/* Arrival Weather */}
          <div className="rounded-xl border border-line/70 bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-fg text-[11px] uppercase tracking-wide">
                {flight.destination.code} ({flight.destination.city})
              </span>
              <span className="text-xs font-bold text-accent">
                {arrWeather?.temp ?? 24}°C
              </span>
            </div>
            <p className="text-[11px] text-muted mt-1">{arrWeather?.condition ?? "Clear"}</p>
            <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <Wind size={11} /> {arrWeather?.windSpeed ?? 10} km/h wind
              </span>
              <span className="flex items-center gap-1">
                <CloudRain size={11} /> {arrWeather?.rainProb ?? 5}% precip
              </span>
            </div>
          </div>
        </div>

        {/* Advisory Warning if weather risk exists */}
        {(depWeather?.alertMessage || arrWeather?.alertMessage) && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Weather Advisory Alert</p>
              <p className="mt-0.5 text-muted">
                {arrWeather?.alertMessage || depWeather?.alertMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

