"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Wallet,
  ExternalLink,
  Sparkles,
  Check,
  X,
  Plus,
  ThumbsUp,
  BadgeCheck,
  CalendarDays,
} from "lucide-react";
import { PLACES } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn, formatINR, googleMapsPlace } from "@/lib/utils";
import { Badge, Button, Card, EmptyState, Img, Stars } from "@/components/ui";

export default function PlacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, addPlaceToTrip, toast } = useApp();
  const place = PLACES.find((p) => p.id === params?.id);
  const [tripId, setTripId] = useState(trips[0]?.id ?? "");

  const similar = useMemo(() => {
    if (!place) return [];
    return PLACES.filter((p) => p.city === place.city && p.id !== place.id).slice(0, 3);
  }, [place]);

  if (!place) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={<MapPin size={22} />}
          title="Place not found"
          description="This place may not be in the curated dataset yet."
          action={<Button onClick={() => router.push("/plan")}><ArrowLeft size={14} /> Back to planner</Button>}
        />
      </div>
    );
  }

  const add = () => {
    if (!tripId) {
      toast("No trip yet", "Plan a trip first, then add this place.", "info");
      return;
    }
    addPlaceToTrip(tripId, place.id);
    const t = trips.find((x) => x.id === tripId);
    toast("Added to trip", `${place.name} → ${t?.title ?? "your trip"}.`);
  };

  const nearby = similar;

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative h-[340px] w-full overflow-hidden sm:h-[420px]">
        <Img src={place.image} alt={place.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/plan" className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-black/50">
            <ArrowLeft size={13} /> Back to plan
          </Link>
          <a href={googleMapsPlace(place.name, place.city)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-white/90">
            <MapPin size={13} /> Open in Maps
          </a>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="glass">{place.category}</Badge>
            <Badge variant="glass"><Star size={10} className="fill-gold text-gold" /> {place.rating} · {place.reviewCount.toLocaleString("en-IN")} reviews</Badge>
            <Badge variant="glass">{place.price ? `₹${formatINR(place.price)}` : "Free"}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-5xl">{place.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-white/85">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {place.city}, {place.country}</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} /> {place.hours}</span>
            <span className="inline-flex items-center gap-1"><Wallet size={12} /> {place.price ? `₹${formatINR(place.price)} entry` : "Free entry"}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 py-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="p-5">
              <h2 className="text-lg font-extrabold text-fg">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{place.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {place.tags.map((t) => (
                  <Badge key={t} variant="outline">{t}</Badge>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Hours", value: place.hours },
                  { label: "Time needed", value: place.duration },
                  { label: "Closed", value: place.closedOn ?? "Daily" },
                  { label: "Price", value: place.price ? `₹${formatINR(place.price)}` : "Free" },
                ].map((f) => (
                  <div key={f.label} className="rounded-xl bg-card2 px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-muted">{f.label}</div>
                    <div className="text-[11px] font-semibold text-fg">{f.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-line bg-accent-soft/50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg"><Sparkles size={14} /></span>
                  <div>
                    <div className="text-sm font-extrabold text-fg">AI review summary</div>
                    <div className="text-[10px] text-muted">Generated from {place.reviewCount.toLocaleString("en-IN")} reviews · last updated Oct 2026</div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-fg">{place.aiSummary.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">What travellers love</div>
                    <ul className="space-y-1">
                      {place.aiSummary.pros.map((p) => (
                        <li key={p} className="flex gap-1.5 text-[11px] text-muted"><Check size={11} className="mt-0.5 shrink-0 text-emerald-500" />{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                    <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-danger">Worth knowing</div>
                    <ul className="space-y-1">
                      {place.aiSummary.cons.map((p) => (
                        <li key={p} className="flex gap-1.5 text-[11px] text-muted"><X size={11} className="mt-0.5 shrink-0 text-danger" />{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {place.aiSummary.bestFor.map((b) => (
                    <Badge key={b} variant="soft"><ThumbsUp size={10} /> {b}</Badge>
                  ))}
                </div>
                <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted">
                  <BadgeCheck size={11} className="mt-0.5 shrink-0 text-accent" />
                  Summaries are AI-generated from aggregated reviews and may lag recent changes.
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-fg">Recent reviews</h2>
                <Stars rating={place.rating} showValue />
              </div>
              <div className="space-y-4">
                {place.reviews.map((r) => (
                  <div key={r.id} className="border-b border-line pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[11px] font-bold text-accent">
                        {r.author.split(" ").map((w) => w[0]).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-fg">{r.author}</span>
                          {r.verified && <Badge variant="green" className="px-1.5 py-0.5 text-[9px]">Verified traveller</Badge>}
                        </div>
                        <div className="text-[10px] text-muted">{r.date} · {r.source}</div>
                      </div>
                      <Stars rating={r.rating} size={11} />
                    </div>
                    <p className="mt-2 pl-10 text-[12px] leading-relaxed text-muted">{r.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-muted">From</div>
                  <div className="text-2xl font-extrabold text-fg">{place.price ? `₹${formatINR(place.price)}` : "Free"}</div>
                  <div className="text-[10px] text-muted">per person · entry</div>
                </div>
                <div className="text-right">
                  <Stars rating={place.rating} showValue />
                  <div className="mt-1 text-[10px] text-muted">{place.reviewCount.toLocaleString("en-IN")} reviews</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wide text-muted">Add to a trip</label>
                <select
                  value={tripId}
                  onChange={(e) => setTripId(e.target.value)}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-semibold text-fg outline-none focus:border-accent"
                >
                  {trips.length === 0 && <option value="">No trips yet</option>}
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <Button className="w-full" onClick={add} disabled={!tripId}>
                  <Plus size={14} /> Add to itinerary
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push("/plan")}>
                  <Sparkles size={14} /> Plan a new trip
                </Button>
              </div>

              <div className="mt-3 flex items-start gap-1.5 text-[10px] text-muted">
                <CalendarDays size={11} className="mt-0.5 shrink-0" />
                Hours and prices are demo data; confirm with the venue before you go.
              </div>
            </Card>

            <Card className="p-4">
              <div className="mb-2 text-sm font-extrabold text-fg">Why this pick</div>
              <p className="text-[11px] leading-relaxed text-muted">{place.why}</p>
              <a href={googleMapsPlace(place.name, place.city)} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
                <ExternalLink size={11} /> Get directions
              </a>
            </Card>
          </div>
        </div>

        {nearby.length > 0 && (
          <section className="pb-8">
            <h2 className="mb-3 text-xl font-extrabold text-fg">More in {place.city}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {nearby.map((p) => (
                <Link key={p.id} href={`/places/${p.id}`} className="group overflow-hidden rounded-2xl border border-line bg-card transition hover:shadow-card">
                  <div className="h-32 overflow-hidden">
                    <Img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-fg">{p.name}</div>
                      <Stars rating={p.rating} size={10} />
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted">{p.category} · {p.price ? `₹${formatINR(p.price)}` : "Free"}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
