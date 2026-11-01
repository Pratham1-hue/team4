"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/store";
import { Skeleton } from "@/components/ui";
import type { MapPlace } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[380px] overflow-hidden rounded-2xl border border-line bg-card2">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-xs font-semibold text-muted">Loading map…</span>
        </div>
      </div>
      <Skeleton className="absolute bottom-4 left-4 h-8 w-28" />
    </div>
  ),
});

export function TripMap({
  places,
  height = 380,
  showRoute = true,
}: {
  places: MapPlace[];
  height?: number;
  showRoute?: boolean;
}) {
  const theme = useApp((s) => s.theme);
  return <LeafletMap places={places} dark={theme === "dark"} height={height} showRoute={showRoute} />;
}
