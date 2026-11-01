"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Sparkles,
  Copy,
  ArrowRight,
  Route,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { PLACES } from "@/lib/data";
import { computeCost, dateRangeLabel, formatDate, formatINR } from "@/lib/utils";
import { AvatarStack, Badge, Button, Card, EmptyState, Img } from "@/components/ui";
import { WeatherStrip } from "@/components/weather-strip";

export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, duplicateTrip, toast } = useApp();
  const trip = trips.find((t) => t.id === params?.id);

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={<MapPin size={22} />}
          title="This trip isn't available"
          description="The link may have expired, or the trip was created in a different browser."
          action={<Button onClick={() => router.push("/plan")}><Sparkles size={14} /> Plan your own trip</Button>}
        />
      </div>
    );
  }

  const stops = trip.itinerary.flatMap((d) => d.items.map((i) => ({ ...i, day: d.day, place: PLACES.find((p) => p.id === i.placeId) })).filter((x) => x.place));
  const cost = computeCost(
    stops.map((s) => s.place!).filter(Boolean),
    trip.days,
    trip.members.length,
    { city: trip.destination, pace: trip.pace, budget: trip.budget }
  );

  const remix = () => {
    const id = duplicateTrip(trip.id);
    if (id) {
      toast("Trip remixed", "A copy is now in your library.");
      router.push(`/trips/${id}`);
    } else {
      router.push("/plan");
    }
  };

  return (
    <div className="pb-16">
      <section className="relative h-[340px] w-full overflow-hidden sm:h-[400px]">
        <Img src={trip.cover} alt={trip.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-accent"><Sparkles size={11} /></span> Voyage AI
          </Link>
          <Badge variant="glass"><ShieldCheck size={10} /> Read-only itinerary</Badge>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-7 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="glass">{trip.days} days</Badge>
            <Badge variant="glass">{stops.length} stops</Badge>
            <Badge variant="glass">{trip.members.length} travellers</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">{trip.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/85">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {trip.destination}, {trip.country}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {dateRangeLabel(trip.startDate, trip.endDate)}</span>
            <span className="inline-flex items-center gap-1"><Wallet size={12} /> ₹{formatINR(trip.budget)}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <AvatarStack names={trip.members.map((m) => m.name)} size={28} />
            <div className="flex gap-2">
              <Button size="sm" onClick={remix}><Copy size={13} /> Remix this trip</Button>
              <Button size="sm" variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={() => router.push("/plan")}>
                Plan your own <ArrowRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 py-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">The plan</div>
              <div className="h-px flex-1 bg-line" />
            </div>

            {trip.itinerary.map((d) => (
              <Card key={d.day} className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-line bg-card2/60 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-extrabold text-accent-fg">{d.day}</span>
                    <div>
                      <div className="text-sm font-extrabold text-fg">Day {d.day}</div>
                      <div className="text-[10px] text-muted">{formatDate(d.date || trip.startDate, { weekday: "long", day: "numeric", month: "long" })}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{d.items.length} stops</Badge>
                </div>
                <div className="divide-y divide-line">
                  {d.items.length === 0 && <div className="px-4 py-6 text-center text-xs text-muted">A free day — wander, rest, repeat.</div>}
                  {d.items.map((item) => {
                    const p = PLACES.find((x) => x.id === item.placeId);
                    if (!p) return null;
                    return (
                      <Link key={item.id} href={`/places/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-card2/60">
                        <span className="w-11 shrink-0 text-center text-[11px] font-extrabold text-accent">{item.time}</span>
                        <Img src={p.image} alt={p.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-fg">{p.name}</div>
                          <div className="text-[10px] text-muted">{p.category} · {item.duration} · {p.rating} ★</div>
                        </div>
                        <span className="text-[11px] font-semibold text-muted">{p.price ? `₹${formatINR(p.price)}` : "Free"}</span>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <WeatherStrip lat={trip.lat} lng={trip.lng} city={trip.destination} start={trip.startDate} end={trip.endDate} />
            <Card className="p-4">
              <div className="mb-2 text-sm font-extrabold text-fg">Trip summary</div>
              <div className="space-y-1.5 text-[11px]">
                {[
                  ["Theme", trip.theme],
                  ["Pace", trip.pace],
                  ["Budget", `₹${formatINR(trip.budget)}`],
                  ["Estimated", `₹${formatINR(cost.total)}`],
                  ["Per person", `₹${formatINR(cost.perPerson)}`],
                  ["Travellers", `${trip.members.length}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-muted">{k}</span>
                    <span className="font-semibold capitalize text-fg">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Route size={11} /> {stops.length} stops · {trip.days} days · weather-checked
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-2 text-sm font-extrabold text-fg">Travellers</div>
              <div className="space-y-2">
                {trip.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <AvatarStack names={[m.name]} size={24} />
                    <span className="text-[11px] font-semibold text-fg">{m.name}</span>
                    <Badge variant="outline" className="ml-auto capitalize">{m.role}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-indigo-500/10 p-4">
              <div className="text-sm font-extrabold text-fg">Want a copy like this?</div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted">Remix the itinerary and adjust budget, dates and pace with the AI agent.</p>
              <Button size="sm" className="mt-3 w-full" onClick={remix}><Copy size={13} /> Remix this trip</Button>
            </Card>
          </div>
        </div>

        <footer className="flex flex-col items-center gap-2 border-t border-line py-8 text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-accent text-accent-fg"><Sparkles size={11} /></span>
            Planned with Voyage AI
          </div>
          <p className="max-w-md text-[11px] text-muted">Weather by Open-Meteo · Maps by OpenStreetMap · Prices are indicative; confirm with providers.</p>
          <Link href="/plan" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
            Plan your own trip <ArrowRight size={11} />
          </Link>
        </footer>
      </div>
    </div>
  );
}
