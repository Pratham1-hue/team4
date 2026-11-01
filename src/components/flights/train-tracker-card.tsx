"use client";

import { motion } from "framer-motion";
import {
  Train,
  Clock,
  MapPin,
  CheckCircle2,
  Gauge,
  Navigation,
  Sparkles,
} from "lucide-react";
import type { TrainInfo } from "@/lib/flights/types";
import { Badge, Button } from "@/components/ui";

interface Props {
  train: TrainInfo;
}

export function TrainTrackerCard({ train }: Props) {
  return (
    <div className="rounded-3xl border border-line bg-card p-6 shadow-xl transition-all duration-200 hover:border-accent/40">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Train size={22} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-fg">{train.trainName}</h3>
              <Badge variant="soft" className="font-mono text-xs font-bold">
                #{train.trainNumber}
              </Badge>
            </div>
            <p className="text-xs text-muted">
              PNR: <strong className="text-fg font-mono">{train.pnr}</strong> · Indian Railways
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="green" className="text-xs px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse mr-1" />
            Live Running · On Time
          </Badge>
        </div>
      </div>

      {/* Current Running Metric */}
      {train.currentLocation && (
        <div className="my-5 rounded-2xl border border-accent/20 bg-accent-soft/30 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-fg">
                <Navigation size={16} />
              </span>
              <div>
                <p className="text-xs font-bold text-fg">
                  Current Status: {train.currentLocation.stationName}
                </p>
                <p className="text-[11px] text-muted">
                  Delay: {train.currentLocation.delayMinutes} min · Platform info confirmed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-accent">
              <Gauge size={16} />
              <span>{train.currentLocation.speedKmH} km/h</span>
            </div>
          </div>
        </div>
      )}

      {/* Station Timeline */}
      <div className="mt-6 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
          Station Route & Platform Tracker
        </p>
        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
          {train.stations.map((st, idx) => (
            <div key={st.code} className="relative flex items-center justify-between text-xs">
              <span
                className={`absolute -left-6 top-1/2 -translate-y-1/2 grid h-4 w-4 place-items-center rounded-full border-2 bg-card ${
                  st.passed
                    ? "border-emerald-500 text-emerald-500"
                    : "border-accent text-accent"
                }`}
              >
                {st.passed && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
              </span>

              <div>
                <p className={`font-bold ${st.passed ? "text-fg/80" : "text-accent"}`}>
                  {st.name} ({st.code})
                </p>
                <p className="text-[11px] text-muted">
                  {st.scheduledArrival || st.scheduledDeparture} ·{" "}
                  <strong className="text-fg">{st.platform}</strong>
                </p>
              </div>

              <Badge
                variant={st.passed ? "soft" : "green"}
                className="text-[10px]"
              >
                {st.passed ? "Passed" : "Upcoming"}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Coaches */}
      <div className="mt-5 border-t border-line pt-3">
        <p className="text-[11px] font-bold text-muted mb-2">Train Coach Layout</p>
        <div className="flex overflow-x-auto gap-1.5 pb-1">
          {train.coaches.map((c) => (
            <span
              key={c}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono font-bold ${
                c === "C3"
                  ? "border-accent bg-accent text-accent-fg"
                  : "border-line bg-card2 text-muted"
              }`}
            >
              {c} {c === "C3" && "★ Your Seat"}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

