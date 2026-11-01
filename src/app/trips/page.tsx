"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Plus, MapPin, CalendarDays, Wallet, ArrowRight, Copy, Sparkles, Briefcase, Globe2, Route } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, dateRangeLabel, formatINR } from "@/lib/utils";
import { AvatarStack, Badge, Button, Card, EmptyState, Img, Segmented, SectionHeading } from "@/components/ui";

const statusStyle: Record<string, string> = {
  planned: "bg-accent-soft text-accent",
  draft: "bg-amber-500/12 text-amber-600 dark:text-amber-400",
  live: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  completed: "bg-slate-500/12 text-slate-500 dark:text-slate-400",
};

export default function TripsPage() {
  const router = useRouter();
  const { trips, duplicateTrip, toast } = useApp();
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [q, setQ] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      const past = (t.endDate || t.startDate) < today || t.status === "completed";
      if (filter === "upcoming" && past) return false;
      if (filter === "past" && !past) return false;
      if (q && !`${t.title} ${t.destination} ${t.country}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [trips, filter, q, today]);

  const stats = useMemo(() => {
    const countries = new Set(trips.map((t) => t.country)).size;
    const days = trips.reduce((s, t) => s + t.days, 0);
    const stops = trips.reduce((s, t) => s + t.itinerary.reduce((x, d) => x + d.items.length, 0), 0);
    return { trips: trips.length, countries, days, stops };
  }, [trips]);

  const remix = (id: string) => {
    const newId = duplicateTrip(id);
    if (newId) {
      toast("Remixed ✨", "A fresh copy is ready to edit.");
      router.push(`/trips/${newId}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-accent">Your library</div>
          <h1 className="text-3xl font-extrabold text-fg">My trips</h1>
          <p className="mt-1 text-sm text-muted">Past adventures, upcoming plans and everything in between.</p>
        </div>
        <Button onClick={() => router.push("/plan")}><Plus size={15} /> New trip</Button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Briefcase size={16} />, value: stats.trips, label: "trips" },
          { icon: <Globe2 size={16} />, value: stats.countries, label: "countries" },
          { icon: <CalendarDays size={16} />, value: stats.days, label: "days planned" },
          { icon: <Route size={16} />, value: stats.stops, label: "stops saved" },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-3 p-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">{s.icon}</span>
            <div>
              <div className="text-lg font-extrabold leading-tight text-fg">{s.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          className="w-full sm:w-auto"
          options={[
            { value: "all", label: "All" },
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
          value={filter}
          onChange={(v) => setFilter(v)}
        />
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search destinations…"
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-fg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<MapPin size={22} />}
          title={q ? "No trips match that search" : "No trips yet"}
          description={q ? "Try a different destination or clear the filter." : "Your next adventure starts with one prompt. The agent will handle the rest."}
          action={<Button onClick={() => router.push("/plan")}><Sparkles size={14} /> Plan a trip</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t, idx) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
              <Card className="group overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lift">
                <Link href={`/trips/${t.id}`} className="relative block h-44 overflow-hidden">
                  <Img src={t.cover} alt={t.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge className={cn("capitalize border-transparent", statusStyle[t.status])}>{t.status === "planned" ? "Planned" : t.status}</Badge>
                    <Badge variant="glass">{t.days} days</Badge>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 text-white">
                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <div className="text-lg font-extrabold leading-tight">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/75">
                          <MapPin size={11} /> {t.destination}, {t.country}
                        </div>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition group-hover:translate-x-0.5">
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-3.5">
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1"><CalendarDays size={11} /> {dateRangeLabel(t.startDate, t.endDate)}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-fg"><Wallet size={11} /> ₹{formatINR(t.budget)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <AvatarStack names={t.members.map((m) => m.name)} size={24} />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => remix(t.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[10px] font-bold text-muted transition hover:border-accent/50 hover:text-accent"
                      >
                        <Copy size={11} /> Remix
                      </button>
                      <Link
                        href={`/trips/${t.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[10px] font-bold text-accent-fg transition hover:brightness-110"
                      >
                        Open <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <SectionHeading
          eyebrow="Keep the streak"
          title="Reuse what worked"
          subtitle="Every trip is remixable. Duplicate a past itinerary and let the agent adjust it to a new season, budget or group."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Remix a past trip", desc: "One click duplicates the days, stops and budget.", icon: <Copy size={16} /> },
            { title: "Invite the crew", desc: "Share a link and vote on the swaps together.", icon: <Sparkles size={16} /> },
            { title: "Export anywhere", desc: "Calendar (.ics), print-ready PDF or public page.", icon: <ArrowRight size={16} /> },
          ].map((c) => (
            <Card key={c.title} className="flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{c.icon}</span>
              <div>
                <div className="text-sm font-bold text-fg">{c.title}</div>
                <div className="mt-0.5 text-xs text-muted">{c.desc}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
