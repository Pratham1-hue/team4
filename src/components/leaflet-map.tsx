"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

export interface MapPlace {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price?: number;
  color?: string;
  index?: number;
  category?: string;
}

function pinIcon(index: number, color: string) {
  return L.divIcon({
    className: "voyage-pin",
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 6px;
      transform:rotate(-45deg);
      background:${color};
      border:2.5px solid #fff;
      box-shadow:0 4px 12px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);color:#fff;font-weight:800;font-size:12px;font-family:system-ui;">${index}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -26],
  });
}

function FitBounds({ places }: { places: MapPlace[] }) {
  const map = useMap();
  useEffect(() => {
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [46, 46], maxZoom: 14 });
  }, [map, places]);
  return null;
}

export default function LeafletMap({
  places,
  dark,
  height = 380,
  showRoute = true,
}: {
  places: MapPlace[];
  dark: boolean;
  height?: number;
  showRoute?: boolean;
}) {
  const center: [number, number] = places.length
    ? [places[0].lat, places[0].lng]
    : [26.9124, 75.7873];

  return (
    <div className="overflow-hidden rounded-2xl border border-line" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        attributionControl={true}
      >
        <TileLayer
          key={dark ? "dark" : "light"}
          url={
            dark
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitBounds places={places} />
        {showRoute && places.length > 1 && (
          <Polyline
            positions={places.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: dark ? "#2dd4bf" : "#0f9d8f", weight: 3, opacity: 0.75, dashArray: "6 8" }}
          />
        )}
        {places.map((p, i) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.index ?? i + 1, p.color ?? "#0f9d8f")}>
            <Popup>
              <div style={{ fontFamily: "system-ui", minWidth: 150 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                  {p.category ?? "Stop"} {typeof p.price === "number" ? `· ₹${p.price}` : ""}
                </div>
                <Link href={`/places/${p.id}`} style={{ fontSize: 11, fontWeight: 700, color: "#0f9d8f" }}>
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
