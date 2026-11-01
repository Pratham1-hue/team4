"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Share2,
  Wallet,
  Users,
  Route,
  GripVertical,
  Plus,
  Trash2,
  Check,
  Clock,
  Download,
  Printer,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Search,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { CITIES, PLACES, placesByCity } from "@/lib/data";
import type { Place, Trip } from "@/lib/types";
import {
  cn,
  dateRangeLabel,
  downloadICS,
  formatDate,
  formatINR,
  googleMapsPlace,
  uid,
} from "@/lib/utils";
import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  EmptyState,
  Img,
  Modal,
  Segmented,
  Stars,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { WeatherStrip } from "@/components/weather-strip";
import { TripMap } from "@/components/trip-map";
import { BudgetPanel } from "@/components/budget-panel";
import { GroupBudget } from "@/components/group-budget";
import { ShareModal } from "@/components/share-modal";

type Tab = "itinerary" | "map" | "budget" | "collaborate";
const DAY_COLORS = ["#0f9d8f", "#6366f1", "#f59e0b", "#ec4899", "#0ea5e9", "#8b5cf6", "#10b981"];

const statusStyle: Record<string, string> = {
  planned: "bg-accent text-accent-fg",
  draft: "bg-amber-500 text-white",
  live: "bg-emerald-500 text-white",
  completed: "bg-slate-600 text-white",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { trips, toast, updateTrip, removeTripItem, moveTripItem, addPlaceToTrip } = useApp();
  const [tab, setTab] = useState<Tab>("itinerary");
  const [selectedDay, setSelectedDay] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addQ, setAddQ] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const [mapDay, setMapDay] = useState<number | "all">("all");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { id: "c1", name: "Aarav", text: "Can we keep Day 2 lighter? The fort + sunset back-to-back might be a lot.", time: "2h ago" },
    { id: "c2", name: "Mira", text: "Lassiwala before 11am or it sells out — adding it to the morning.", time: "1h ago" },
  ]);
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; mine?: "up" | "down" }>>({});

  const trip = trips.find((t) => t.id === params?.id);

  const cityPlaces = useMemo(() => {
    if (!trip) return [];
    const c = CITIES.find((x) => trip.destination.toLowerCase().includes(x.name.toLowerCase()));
    return c ? placesByCity(c.name) : PLACES.filter((p) => p.city === "Jaipur");
  }, [trip]);

  const day = trip?.itinerary.find((d) => d.day === selectedDay);
  const dayItems = day?.items ?? [];
  const dayPlaces = dayItems.map((i) => PLACES.find((p) => p.id === i.placeId)).filter(Boolean) as Place[];

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState
          icon={<MapPin size={22} />}
          title="Trip not found"
          description="This trip may have been created in another browser, or the link is incomplete."
          action={<Button onClick={() => router.push("/trips")}><ArrowLeft size={14} /> Back to trips</Button>}
        />
      </div>
    );
  }

  const allStops = trip.itinerary.flatMap((d) =>
    d.items
      .map((item) => {
        const p = PLACES.find((x) => x.id === item.placeId);
        return p ? { ...p, index: 0, dayColor: DAY_COLORS[(d.day - 1) % DAY_COLORS.length], dayNum: d.day } : null;
      })
      .filter(Boolean)
  ) as (Place & { dayColor: string; dayNum: number })[];

  const mapPlaces = (mapDay === "all" ? allStops : allStops.filter((p) => p.dayNum === mapDay)).map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    price: p.price,
    category: p.category,
    index: i + 1,
    color: p.dayColor,
  }));

  const budgetPlaces = allStops.length ? allStops : cityPlaces;

  const addStop = (placeId: string) => {
    const p = PLACES.find((x) => x.id === placeId);
    if (!p) return;
    const times = ["09:00", "12:30", "15:30", "18:30", "20:30"];
    const itinerary = trip.itinerary.map((d) =>
      d.day === selectedDay
        ? {
            ...d,
            items: [
              ...d.items,
              {
                id: uid("item"),
                placeId,
                time: times[Math.min(d.items.length, times.length - 1)],
                duration: p.duration,
                cost: p.price,
              },
            ],
          }
        : d
    );
    updateTrip(trip.id, { itinerary });
    toast("Stop added", `${p.name} added to day ${selectedDay}.`);
    setAddOpen(false);
    setAddQ("");
  };

  const removeStop = (itemId: string) => {
    removeTripItem(trip.id, selectedDay, itemId);
    toast("Stop removed", "The day has been updated.", "info");
  };

  const dayDate = (n: number) => {
    const d = trip.itinerary.find((x) => x.day === n);
    if (d?.date) return d.date;
    const start = new Date(trip.startDate + "T12:00:00");
    start.setDate(start.getDate() + n - 1);
    return start.toISOString().slice(0, 10);
  };

  const addCandidates = cityPlaces.filter(
    (p) => !dayItems.some((i) => i.placeId === p.id) && p.name.toLowerCase().includes(addQ.toLowerCase())
  );

  const voteCandidates = cityPlaces.filter((p) => !allStops.some((s) => s.id === p.id)).slice(0, 2);

  const vote = (placeId: string, dir: "up" | "down") => {
    setVotes((v) => {
      const cur = v[placeId] ?? { up: 0, down: 0 };
      if (cur.mine === dir) return { ...v, [placeId]: { up: cur.up - (dir === "up" ? 1 : 0), down: cur.down - (dir === "down" ? 1 : 0) } };
      const base = cur.mine ? { up: cur.up - (cur.mine === "up" ? 1 : 0), down: cur.down - (cur.mine === "down" ? 1 : 0) } : cur;
      return { ...v, [placeId]: { up: base.up + (dir === "up" ? 1 : 0), down: base.down + (dir === "down" ? 1 : 0), mine: dir } };
    });
  };

  const applyVote = (placeId: string) => {
    addPlaceToTrip(trip.id, placeId);
    const p = PLACES.find((x) => x.id === placeId);
    toast("Winner added", `${p?.name ?? "The place"} joined the trip.`);
  };

  const tabs: TabItem[] = [
    { id: "itinerary", label: "Itinerary", icon: <CalendarDays size={14} /> },
    { id: "map", label: "Map", icon: <MapPin size={14} /> },
    { id: "budget", label: "Budget", icon: <Wallet size={14} /> },
    { id: "collaborate", label: "Collaborate", icon: <Users size={14} /> },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[300px] w-full overflow-hidden sm:h-[340px]">
        <Img src={trip.cover} alt={trip.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
        <div className="absolute inset-x-0 top-0 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/trips" className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-bold text-white backdrop-blur transition hover:bg-black/50">
            <ArrowLeft size={13} /> My trips
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => downloadICS(trip)} className="grid h-9 w-9 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50" title="Export calendar" aria-label="Export calendar">
              <Download size={15} />
            </button>
            <button onClick={() => window.print()} className="hidden h-9 w-9 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 sm:grid" title="Print / PDF" aria-label="Print">
              <Printer size={15} />
            </button>
            <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-black transition hover:bg-white/90">
              <Share2 size={13} /> Share trip
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn("capitalize border-transparent", statusStyle[trip.status])}>{trip.status}</Badge>
            <Badge variant="glass">{trip.days} days</Badge>
            <Badge variant="glass">{trip.members.length} travellers</Badge>
            {trip.visibility === "public" && <Badge variant="glass">Public</Badge>}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{trip.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium text-white/85">
            <span className="inline-flex items-center gap-1"><MapPin size={12} /> {trip.destination}, {trip.country}</span>
            <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {dateRangeLabel(trip.startDate, trip.endDate)}</span>
            <span className="inline-flex items-center gap-1"><Wallet size={12} /> ₹{formatINR(trip.budget)}</span>
            <span className="inline-flex items-center gap-1"><Route size={12} /> {allStops.length} stops</span>
          </div>
        </div>
        <div className="absolute bottom-5 right-4 hidden sm:right-6 sm:block lg:right-8">
          <AvatarStack names={trip.members.map((m) => m.name)} size={30} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-1 sticky top-16 z-30 -mx-4 border-b border-line bg-bg/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Tabs variant="underline" items={tabs} active={tab} onChange={(t) => setTab(t as Tab)} />
        </div>

        <div className="py-6">
          {/* ---------------- ITINERARY ---------------- */}
          {tab === "itinerary" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-1.5">
                  {trip.itinerary.map((d) => (
                    <button
                      key={d.day}
                      onClick={() => setSelectedDay(d.day)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition",
                        selectedDay === d.day ? "border-accent bg-accent text-accent-fg" : "border-line bg-card text-muted hover:text-fg"
                      )}
                    >
                      Day {d.day}
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", selectedDay === d.day ? "bg-white/20" : "bg-card2")}>{d.items.length}</span>
                    </button>
                  ))}
                </div>

                <Card className="p-4 sm:p-5">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-extrabold text-fg">Day {selectedDay}</h2>
                      <p className="text-xs text-muted">{formatDate(dayDate(selectedDay), { weekday: "long", day: "numeric", month: "long" })} · {dayPlaces.length} stops</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">₹{formatINR(dayItems.reduce((s, i) => s + i.cost, 0))} day est.</Badge>
                      <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={13} /> Add stop</Button>
                    </div>
                  </div>

                  {dayPlaces.length > 4 && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      Packed day — {dayPlaces.length} stops. Consider moving one to a lighter day.
                    </div>
                  )}
                  {dayPlaces.some((p) => p.closedOn) && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl bg-danger/8 px-3 py-2 text-[11px] text-danger">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      One stop has a closure note: {dayPlaces.find((p) => p.closedOn)?.name} — {dayPlaces.find((p) => p.closedOn)?.closedOn}.
                    </div>
                  )}

                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {dayItems.map((item, i) => {
                        const p = PLACES.find((x) => x.id === item.placeId);
                        if (!p) return null;
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            draggable
                            onDragStart={() => setDrag(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (drag !== null && drag !== i) moveTripItem(trip.id, selectedDay, drag, i);
                              setDrag(null);
                            }}
                            className={cn(
                              "group flex cursor-grab items-center gap-2.5 rounded-xl border bg-card p-2 transition active:cursor-grabbing",
                              drag === i ? "border-accent opacity-60" : "border-line hover:border-accent/40"
                            )}
                          >
                            <GripVertical size={14} className="shrink-0 text-line group-hover:text-muted" />
                            <span className="w-11 shrink-0 text-center text-[11px] font-extrabold text-accent">{item.time}</span>
                            <Img src={p.image} alt={p.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Link href={`/places/${p.id}`} className="truncate text-[13px] font-bold text-fg hover:text-accent">{p.name}</Link>
                                <span className="hidden items-center gap-0.5 text-[10px] text-muted sm:inline-flex"><Star size={9} className="fill-gold text-gold" />{p.rating}</span>
                              </div>
                              <div className="text-[10px] text-muted">{p.category} · {item.duration} · {p.price ? `₹${formatINR(p.price)}` : "Free"}</div>
                            </div>
                            <a href={googleMapsPlace(p.name, p.city)} target="_blank" rel="noreferrer" className="hidden h-7 w-7 place-items-center rounded-lg text-muted hover:bg-card2 hover:text-accent sm:grid" aria-label="Open in maps">
                              <ExternalLink size={12} />
                            </a>
                            <button onClick={() => removeStop(item.id)} className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger" aria-label="Remove stop">
                              <Trash2 size={12} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    {dayItems.length === 0 && (
                      <div className="rounded-xl border border-dashed border-line px-4 py-10 text-center">
                        <CalendarDays size={22} className="mx-auto mb-2 text-muted" />
                        <div className="text-sm font-bold text-fg">Free day</div>
                        <p className="mt-1 text-xs text-muted">Add a stop, or keep it open for wandering.</p>
                        <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddOpen(true)}><Plus size={12} /> Add a stop</Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1"><Clock size={11} /> Drag rows to reorder the day</span>
                    <span>{dayItems.length} stops · ₹{formatINR(dayItems.reduce((s, i) => s + i.cost, 0))}</span>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <WeatherStrip lat={trip.lat} lng={trip.lng} city={trip.destination} start={trip.startDate} end={trip.endDate} />
                <Card className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-fg"><Sparkles size={14} className="text-accent" /> Agent notes</div>
                  <ul className="space-y-2 text-[11px] leading-relaxed text-muted">
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" /> Book Amber Fort for 8 AM — crowds build after 10.</li>
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" /> Keep Day 3 light; it has the longest transfer.</li>
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" /> Rain risk — Albert Hall is your indoor backup.</li>
                  </ul>
                  <Button size="sm" variant="soft" className="mt-3 w-full" onClick={() => setTab("collaborate")}>
                    <Users size={12} /> Ask the group
                  </Button>
                </Card>
                <Card className="p-4">
                  <div className="mb-2 text-sm font-extrabold text-fg">Trip facts</div>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      ["Theme", trip.theme],
                      ["Pace", trip.pace],
                      ["Budget", `₹${formatINR(trip.budget)}`],
                      ["Travellers", `${trip.members.length}`],
                      ["Visibility", trip.visibility],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between">
                        <span className="text-muted">{k}</span>
                        <span className="font-semibold capitalize text-fg">{v}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ---------------- MAP ---------------- */}
          {tab === "map" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-fg">Route map</h2>
                    <p className="text-xs text-muted">{mapPlaces.length} stops · drag-free route order by day</p>
                  </div>
                  <Segmented
                    options={[{ value: "all" as const, label: "All days" }, ...trip.itinerary.map((d) => ({ value: d.day, label: `Day ${d.day}` }))]}
                    value={mapDay}
                    onChange={(v) => setMapDay(v)}
                  />
                </div>
                <TripMap places={mapPlaces} height={480} />
                <div className="flex flex-wrap gap-2">
                  {trip.itinerary.map((d) => (
                    <span key={d.day} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[10px] font-semibold text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: DAY_COLORS[(d.day - 1) % DAY_COLORS.length] }} /> Day {d.day} · {d.items.length} stops
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <WeatherStrip lat={trip.lat} lng={trip.lng} city={trip.destination} start={trip.startDate} end={trip.endDate} />
                <Card className="p-4">
                  <div className="mb-2 text-sm font-extrabold text-fg">Stops by day</div>
                  <div className="space-y-2">
                    {trip.itinerary.map((d) => (
                      <div key={d.day}>
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: DAY_COLORS[(d.day - 1) % DAY_COLORS.length] }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: DAY_COLORS[(d.day - 1) % DAY_COLORS.length] }} /> Day {d.day}
                        </div>
                        {d.items.length === 0 && <div className="text-[10px] text-muted">Free day</div>}
                        {d.items.map((item) => {
                          const p = PLACES.find((x) => x.id === item.placeId);
                          return p ? (
                            <Link key={item.id} href={`/places/${p.id}`} className="flex items-center gap-1.5 py-0.5 text-[11px] text-muted hover:text-accent">
                              <span className="text-[9px]">{item.time}</span> {p.name}
                            </Link>
                          ) : null;
                        })}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ---------------- BUDGET ---------------- */}
          {tab === "budget" && (
            <div className="mx-auto max-w-4xl space-y-4">
              <GroupBudget
                storageKey={`voyage-group-${trip.id}`}
                defaultBudget={trip.budget}
                onApply={(amount) => {
                  updateTrip(trip.id, { budget: amount });
                  toast("Budget updated", `Planning around ₹${formatINR(amount)}.`);
                }}
                compact
              />
              <BudgetPanel
                places={budgetPlaces}
                days={trip.days}
                travellers={trip.members.length}
                budget={trip.budget}
                city={trip.destination}
                country={trip.country}
                pace={trip.pace}
                start={trip.startDate}
                end={trip.endDate}
                onBudgetChange={(v) => updateTrip(trip.id, { budget: v })}
              />
            </div>
          )}

          {/* ---------------- COLLABORATE ---------------- */}
          {tab === "collaborate" && (
            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-4">
                <Card className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-fg">Travellers</h2>
                      <p className="text-xs text-muted">Owner, editors and viewers — role-based access.</p>
                    </div>
                    <Button size="sm" onClick={() => setShareOpen(true)}><Share2 size={12} /> Invite</Button>
                  </div>
                  <div className="space-y-2">
                    {trip.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 rounded-xl border border-line bg-card2/50 p-2">
                        <Avatar name={m.name} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-fg">{m.name}</div>
                          <div className="text-[10px] capitalize text-muted">{m.role}</div>
                        </div>
                        <Badge variant={m.role === "owner" ? "solid" : "outline"} className="capitalize">{m.role}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <ThumbsUp size={15} className="text-accent" />
                    <div>
                      <h2 className="text-base font-extrabold text-fg">Group vote</h2>
                      <p className="text-[11px] text-muted">Majority wins — the agent merges the plan.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {voteCandidates.map((p) => {
                      const v = votes[p.id] ?? { up: 0, down: 0 };
                      return (
                        <div key={p.id} className="overflow-hidden rounded-xl border border-line bg-card">
                          <div className="relative h-24">
                            <Img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                            <Badge variant="glass" className="absolute left-2 top-2">{p.category}</Badge>
                          </div>
                          <div className="p-2.5">
                            <div className="text-xs font-extrabold text-fg">{p.name}</div>
                            <div className="text-[10px] text-muted">{p.price ? `₹${formatINR(p.price)}` : "Free"} · {p.duration}</div>
                            <div className="mt-2 flex items-center gap-1.5">
                              <button
                                onClick={() => vote(p.id, "up")}
                                className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-bold transition", v.mine === "up" ? "border-emerald-500 bg-emerald-500/10 text-emerald-600" : "border-line text-muted hover:text-fg")}
                              >
                                <ThumbsUp size={11} /> {v.up}
                              </button>
                              <button
                                onClick={() => vote(p.id, "down")}
                                className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[11px] font-bold transition", v.mine === "down" ? "border-danger bg-danger/10 text-danger" : "border-line text-muted hover:text-fg")}
                              >
                                <ThumbsDown size={11} /> {v.down}
                              </button>
                              <button onClick={() => applyVote(p.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg" title="Add winner to trip" aria-label="Add winner to trip">
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {voteCandidates.length === 0 && <div className="text-xs text-muted">Every nearby place is already in the trip. Nice.</div>}
                  </div>
                </Card>

                <Card className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageSquare size={15} className="text-accent" />
                    <h2 className="text-base font-extrabold text-fg">Comments</h2>
                  </div>
                  <div className="space-y-2.5">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <Avatar name={c.name} size={28} />
                        <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-line bg-card2/60 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-fg">{c.name}</span>
                            <span className="text-[9px] text-muted">{c.time}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && comment.trim()) {
                          setComments((c) => [...c, { id: uid("c"), name: "You", text: comment.trim(), time: "now" }]);
                          setComment("");
                        }
                      }}
                      placeholder="Add a comment or @mention…"
                      className="flex-1 rounded-xl border border-line bg-card px-3 py-2 text-xs text-fg outline-none focus:border-accent"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (!comment.trim()) return;
                        setComments((c) => [...c, { id: uid("c"), name: "You", text: comment.trim(), time: "now" }]);
                        setComment("");
                      }}
                    >
                      <Send size={12} />
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <GroupBudget
                  storageKey={`voyage-group-${trip.id}`}
                  defaultBudget={trip.budget}
                  onApply={(amount) => {
                    updateTrip(trip.id, { budget: amount });
                    toast("Group budget applied", `Planning around ₹${formatINR(amount)}.`);
                  }}
                />
                <Card className="p-4">
                  <div className="mb-2 text-sm font-extrabold text-fg">Invite & export</div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShareOpen(true)}><Share2 size={13} /> Invite by link / WhatsApp</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => downloadICS(trip)}><Download size={13} /> Add to calendar (.ics)</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.print()}><Printer size={13} /> Print / save PDF</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push(`/share/${trip.id}`)}><ExternalLink size={13} /> Open public page</Button>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShareModal trip={trip} open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Add stop modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add a stop to day ${selectedDay}`} description="Curated places near your trip. Drag to reorder after adding.">
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={addQ}
            onChange={(e) => setAddQ(e.target.value)}
            placeholder="Search places…"
            className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-fg outline-none focus:border-accent"
          />
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {addCandidates.map((p) => (
            <button key={p.id} onClick={() => addStop(p.id)} className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-card p-2 text-left transition hover:border-accent/50 hover:bg-accent-soft/30">
              <Img src={p.image} alt={p.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-fg">{p.name}</div>
                <div className="text-[10px] text-muted">{p.category} · {p.price ? `₹${formatINR(p.price)}` : "Free"} · {p.duration}</div>
              </div>
              <Plus size={14} className="text-accent" />
            </button>
          ))}
          {addCandidates.length === 0 && <div className="py-6 text-center text-xs text-muted">No matches. Try another search.</div>}
        </div>
      </Modal>
    </div>
  );
}
