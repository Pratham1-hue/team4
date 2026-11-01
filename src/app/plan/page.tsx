"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Compass,
  Info,
  MapPin,
  Pin,
  RefreshCw,
  RotateCcw,
  Send,
  Sparkles,
  Sunrise,
  Wallet,
  CalendarDays,
  Users,
  CloudSun,
  Trash2,
  Star,
} from "lucide-react";
import { CITIES, IMG, PLACES, THEMES, placesByCity } from "@/lib/data";
import { useApp } from "@/lib/store";
import type { Place, ThemeId, Trip, ItineraryDay } from "@/lib/types";
import {
  buildItinerary as makeItinerary,
  cn,
  computeCost,
  formatDate,
  formatINR,
  uid,
} from "@/lib/utils";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Img,
  Range,
  Segmented,
  Spinner,
  Stars,
  Tabs,
  type TabItem,
} from "@/components/ui";
import { WeatherStrip } from "@/components/weather-strip";
import { TripMap } from "@/components/trip-map";
import { BudgetPanel } from "@/components/budget-panel";
import { GroupBudget, type GroupBudgetAggregate } from "@/components/group-budget";
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { getDestinationHeroImages } from "@/lib/destination-hero";

type Stage = "greet" | "destination" | "days" | "budget" | "theme" | "travellers" | "searching" | "done";
type PanelTab = "places" | "itinerary" | "map" | "budget";
interface Chip {
  label: string;
  value: string;
}
interface ToolStep {
  label: string;
  done: boolean;
}
interface Message {
  id: string;
  role: "agent" | "user";
  text: string;
  chips?: Chip[];
  tools?: ToolStep[];
  streaming?: boolean;
}

const DAY_CHIPS: Chip[] = ["2", "3", "4", "5", "7"].map((d) => ({ label: `${d} days`, value: d }));
const BUDGET_CHIPS: Chip[] = [
  { label: "₹25k", value: "25000" },
  { label: "₹50k", value: "50000" },
  { label: "₹1L", value: "100000" },
  { label: "₹2L", value: "200000" },
];
const TRAVEL_CHIPS: Chip[] = [
  { label: "Solo", value: "1" },
  { label: "Couple", value: "2" },
  { label: "2 friends", value: "2" },
  { label: "Family of 4", value: "4" },
];
const FOLLOW_CHIPS: Chip[] = [
  { label: "Make it cheaper", value: "Make it cheaper" },
  { label: "Weather-proof it", value: "Weather-proof the plan" },
  { label: "Slow the pace", value: "Make it more relaxed" },
];

const toolLabel = (name: string) =>
  ({
    search_places: "Searching places & reviews",
    get_place_details: "Reading place details",
    estimate_cost: "Estimating your budget",
    get_weather: "Checking the weather",
    get_travel_links: "Comparing flights & stays",
  }[name] ?? "Running a tool");

const parseMoney = (s: string) => {
  const t = s.toLowerCase().replace(/[₹,\s]/g, "");
  const m = t.match(/(\d+(?:\.\d+)?)(k|l|lakh|m)?/);
  if (!m) return null;
  let n = Number(m[1]);
  const unit = m[2];
  if (unit === "k") n *= 1000;
  if (unit === "l" || unit === "lakh") n *= 100000;
  if (unit === "m") n *= 1000000;
  return Math.round(n);
};

export default function PlanPage() {
  const router = useRouter();
  const { addTrip, toast, preferences } = useApp();

  /* ---------------- trip draft ---------------- */
  const [dest, setDest] = useState("");
  const [country, setCountry] = useState("India");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(50000);
  const [travellers, setTravellers] = useState(2);
  const [theme, setTheme] = useState<ThemeId>("relaxation");
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">("balanced");
  const [startDate, setStartDate] = useState("");

  /* ---------------- board state ---------------- */
  const [selected, setSelected] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [showSkipped, setShowSkipped] = useState(false);
  const [filter, setFilter] = useState("All");
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [tab, setTab] = useState<PanelTab>("places");
  const [mobileView, setMobileView] = useState<"chat" | "board">("chat");
  const [groupAgg, setGroupAgg] = useState<GroupBudgetAggregate | null>(null);

  /* ---------------- chat state ---------------- */
  const [stage, setStage] = useState<Stage>("greet");
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const started = useRef(false);
  const chatBusy = useRef(false);

  const later = useCallback((fn: () => void, ms = 750) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  useEffect(() => {
    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setStartDate(d.toISOString().slice(0, 10));
    }
  }, [startDate]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  /* ---------------- derived ---------------- */
  const cityObj = useMemo(
    () => CITIES.find((c) => dest.toLowerCase().includes(c.name.toLowerCase())),
    [dest]
  );
  const heroImages = useMemo(() => getDestinationHeroImages(dest), [dest]);
  const cityName = cityObj?.name ?? "Jaipur";
  const isSample = !cityObj && !!dest;
  const cityPlaces = useMemo(() => {
    if (cityObj) return placesByCity(cityObj.name);
    return placesByCity("Jaipur");
  }, [cityObj]);

  const destLabel = dest || cityName;
  const start = startDate || new Date().toISOString().slice(0, 10);
  const end = useMemo(() => {
    const s = new Date(start + "T12:00:00");
    s.setDate(s.getDate() + Math.max(1, days) - 1);
    return s.toISOString().slice(0, 10);
  }, [start, days]);

  const lat = coords?.lat ?? cityObj?.lat ?? 26.9124;
  const lng = coords?.lng ?? cityObj?.lng ?? 75.7873;

  const selectedPlaces = useMemo(() => cityPlaces.filter((p) => selected.includes(p.id)), [cityPlaces, selected]);
  const cost = useMemo(
    () => computeCost(selectedPlaces, days, travellers, { city: cityName, pace, budget }),
    [selectedPlaces, days, travellers, cityName, pace, budget]
  );

  const visiblePlaces = useMemo(() => {
    let list = cityPlaces;
    if (!showSkipped) list = list.filter((p) => !skipped.includes(p.id));
    if (filter !== "All") list = list.filter((p) => p.category === filter);
    return list;
  }, [cityPlaces, filter, skipped, showSkipped]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(cityPlaces.map((p) => p.category)))], [cityPlaces]);

  /* ---------------- chat helpers ---------------- */
  const push = (msg: Omit<Message, "id">) =>
    setMessages((m) => [...m, { ...msg, id: uid("m") }]);

  const agentSay = useCallback(
    (text: string, opts?: { chips?: Chip[]; delay?: number }, after?: () => void) => {
      setTyping(true);
      later(() => {
        setTyping(false);
        push({ role: "agent", text, chips: opts?.chips });
        after?.();
      }, opts?.delay ?? 700);
    },
    [later]
  );

  const askDays = useCallback(
    (d: string) => {
      agentSay(`Great — ${d}! How many days are you thinking?`, { chips: DAY_CHIPS }, () => setStage("days"));
    },
    [agentSay]
  );

  const chooseDestination = useCallback(
    (value: string, label: string) => {
      if (value === "SURPRISE") {
        const c = CITIES[Math.floor(Math.random() * CITIES.length)];
        setDest(`${c.name}, ${c.country}`);
        setCountry(c.country);
        setCoords({ lat: c.lat, lng: c.lng });
        setTheme(c.themes[0]);
        setSelected([]);
        setSkipped([]);
        setItinerary([]);
        push({ role: "user", text: "Surprise me ✨" });
        askDays(`${c.name}, ${c.country}`);
        return;
      }
      const cityHit = CITIES.find(
        (c) => value.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase() === label.toLowerCase()
      );
      setDest(value);
      setCountry(cityHit?.country ?? country);
      if (cityHit) setCoords({ lat: cityHit.lat, lng: cityHit.lng });
      else {
        fetch(`/api/geocode?q=${encodeURIComponent(value)}`)
          .then((r) => r.json())
          .then((d: { results?: { lat: number; lng: number; country?: string }[] }) => {
            const first = d.results?.[0];
            if (first) {
              setCoords({ lat: first.lat, lng: first.lng });
              if (first.country) setCountry(first.country);
            }
          })
          .catch(() => {});
      }
      setSelected([]);
      setSkipped([]);
      setItinerary([]);
      push({ role: "user", text: label });
      askDays(label);
    },
    [askDays, country]
  );

  const startSearch = useCallback(
    (pax: number) => {
      setTravellers(pax);
      push({ role: "user", text: `${pax} traveller${pax > 1 ? "s" : ""}` });
      setStage("searching");
      setTyping(true);
      const toolId = uid("m");
      later(() => {
        setTyping(false);
        push({
          role: "agent",
          text: "",
          tools: [
            { label: `Searching sights & stays in ${destLabel}…`, done: false },
            { label: "Reading reviews & rating sentiment…", done: false },
            { label: "Checking opening hours & travel time…", done: false },
            { label: "Ranking by your taste profile…", done: false },
          ],
        });
        [500, 950, 1400, 1850].forEach((ms, idx) =>
          later(() => {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === toolId
                  ? { ...msg, tools: msg.tools?.map((t, i) => (i <= idx ? { ...t, done: true } : t)) }
                  : msg
              )
            );
          }, ms)
        );
        later(() => {
          setStage("done");
          setTab("places");
          setMobileView("board");
          push({
            role: "agent",
            text: `Found ${cityPlaces.length} places in ${destLabel} that fit a ${THEMES.find((t) => t.id === theme)?.label.toLowerCase()} trip around ₹${formatINR(budget)}. Tap what you love — or let me pick.`,
            chips: [{ label: "✨ Pick the best for me", value: "AUTO_PICK" }, ...FOLLOW_CHIPS.slice(0, 2)],
          });
        }, 2300);
      }, 500);
    },
    [cityPlaces.length, destLabel, later, theme, budget]
  );

  const autoPick = useCallback(() => {
    const top = [...cityPlaces].sort((a, b) => b.rating - a.rating).slice(0, Math.min(7, cityPlaces.length));
    setSelected(top.map((p) => p.id));
    push({ role: "user", text: "Pick the best for me" });
    const plan = makeItinerary(top, days, start);
    setItinerary(plan);
    setTab("itinerary");
    agentSay(
      `Done — I picked ${top.length} top-rated stops and arranged them into ${days} days. The map, weather and budget are on the right. Want a cheaper or slower version?`,
      { chips: FOLLOW_CHIPS }
    );
  }, [agentSay, cityPlaces, days, start]);

  const handleChoice = useCallback(
    (value: string, label?: string) => {
      if (stage === "done" || value.startsWith("Make it") || value.startsWith("Weather-proof") || value.startsWith("Slow")) {
        askAgent(value);
        return;
      }
      switch (stage) {
        case "destination":
          chooseDestination(value, label ?? value);
          break;
        case "days": {
          const n = parseInt(value.replace(/\D/g, ""), 10);
          if (!n || n > 21) {
            agentSay("I can plan 1–21 days. How many nights are you thinking?", { chips: DAY_CHIPS });
            return;
          }
          setDays(n);
          push({ role: "user", text: label ?? `${n} days` });
          agentSay(
            `${n} days it is. What's your total budget for the whole trip? Everything is in INR.`,
            { chips: BUDGET_CHIPS },
            () => setStage("budget")
          );
          break;
        }
        case "budget": {
          const n = parseMoney(value);
          if (!n || n < 3000) {
            agentSay("Give me a rough total — even ₹15k works. What should I aim for?", { chips: BUDGET_CHIPS });
            return;
          }
          setBudget(n);
          push({ role: "user", text: label ?? `₹${formatINR(n)}` });
          agentSay(
            `₹${formatINR(n)} — got it. What's the mood of this trip?`,
            { chips: THEMES.map((t) => ({ label: `${t.emoji} ${t.label}`, value: t.id })) },
            () => setStage("theme")
          );
          break;
        }
        case "theme": {
          const t = THEMES.find((x) => x.id === value || ` ${x.label.toLowerCase()}`.includes(value.toLowerCase()));
          if (!t) {
            agentSay("Pick a theme — or type your own vibe.", { chips: THEMES.slice(0, 5).map((x) => ({ label: `${x.emoji} ${x.label}`, value: x.id })) });
            return;
          }
          setTheme(t.id);
          push({ role: "user", text: `${t.emoji} ${t.label}` });
          agentSay(
            `${t.emoji} ${t.label} — perfect. Who's coming along?`,
            { chips: TRAVEL_CHIPS },
            () => setStage("travellers")
          );
          break;
        }
        case "travellers": {
          const n = parseInt(value.replace(/\D/g, ""), 10) || 2;
          startSearch(Math.min(8, Math.max(1, n)));
          break;
        }
        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stage, chooseDestination, agentSay, startSearch]
  );

  const askAgent = useCallback(
    async (text: string) => {
      if (chatBusy.current) return;
      chatBusy.current = true;
      push({ role: "user", text });
      setInput("");
      setTyping(true);
      const history = [
        ...messages.filter((m) => m.text && !m.streaming).map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: text },
      ].slice(-12);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            context: {
              destination: destLabel,
              country,
              days,
              budget,
              travellers,
              theme,
              pace,
              currency: "INR",
              selectedPlaces: selected,
              origin: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
              groupBudget: groupAgg
                ? {
                    min: groupAgg.min,
                    max: groupAgg.max,
                    avg: groupAgg.avg,
                    recommended: groupAgg.recommended,
                    responded: groupAgg.responded,
                    total: groupAgg.total,
                  }
                : undefined,
            },
          }),
        });
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("text/event-stream")) {
          const data = (await res.json()) as { reply?: string; fallback?: boolean };
          setTyping(false);
          push({
            role: "agent",
            text: data.reply ?? "I couldn't reach the agent right now.",
            chips: FOLLOW_CHIPS,
          });
          chatBusy.current = false;
          return;
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("no stream");
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";
        const msgId = uid("m");
        setTyping(false);
        setMessages((m) => [...m, { id: msgId, role: "agent", text: "", streaming: true }]);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) {
            const line = part.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            try {
              const evt = JSON.parse(line.slice(5).trim()) as {
                type: string;
                text?: string;
                name?: string;
                status?: string;
                message?: string;
              };
              if (evt.type === "token" && evt.text) {
                acc += evt.text;
                setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, text: acc } : x)));
              } else if (evt.type === "tool" && evt.name) {
                setMessages((m) =>
                  m.map((x) => {
                    if (x.id !== msgId) return x;
                    const label = toolLabel(evt.name!);
                    const existing = x.tools ?? [];
                    const idx = existing.findIndex((t) => t.label === label);
                    const tools =
                      idx >= 0
                        ? existing.map((t, i) => (i === idx ? { ...t, done: evt.status === "done" } : t))
                        : [...existing, { label, done: evt.status === "done" }];
                    return { ...x, tools };
                  })
                );
              } else if (evt.type === "error") {
                acc += acc ? "" : "I hit a snag talking to the model. ";
                setMessages((m) =>
                  m.map((x) =>
                    x.id === msgId
                      ? { ...x, text: acc + (evt.message ? `\n\n_${evt.message}_` : "") }
                      : x
                  )
                );
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
        setMessages((m) =>
          m.map((x) => (x.id === msgId ? { ...x, streaming: false, chips: FOLLOW_CHIPS } : x))
        );
      } catch {
        setTyping(false);
        push({
          role: "agent",
          text: "I'm offline right now, but the guided planner and your board are fully functional. Add an Anthropic key in .env to enable live reasoning.",
          chips: FOLLOW_CHIPS,
        });
      } finally {
        chatBusy.current = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, destLabel, country, days, budget, travellers, theme, pace, selected, groupAgg]
  );

  const submit = () => {
    const text = input.trim();
    if (!text || typing || stage === "searching") return;
    setInput("");
    if (stage === "done") {
      askAgent(text);
      return;
    }
    handleChoice(text, text);
  };

  /* ---------------- init from URL ---------------- */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("dest");
    const th = params.get("theme");
    const latP = Number(params.get("lat"));
    const lngP = Number(params.get("lng"));
    const c = params.get("country");
    if (th && THEMES.some((t) => t.id === th)) setTheme(th as ThemeId);
    if (d) {
      const hit = CITIES.find((x) => d.toLowerCase().includes(x.name.toLowerCase()));
      const resolvedCountry = c ?? hit?.country ?? "India";
      setDest(d);
      setCountry(resolvedCountry);
      if (hit) setCoords({ lat: hit.lat, lng: hit.lng });
      else if (Number.isFinite(latP) && Number.isFinite(lngP) && latP !== 0) setCoords({ lat: latP, lng: lngP });
      setStage("days");
      setMessages([
        {
          id: uid("m"),
          role: "agent",
          text: `Great choice — ${d}! I already know the good stuff nearby. How many days are you planning?`,
          chips: DAY_CHIPS,
        },
      ]);
    } else {
      setStage("destination");
      setMessages([
        {
          id: uid("m"),
          role: "agent",
          text: "Hi! I'm Voyage, your travel agent. Where do you want to go next?",
          chips: [
            { label: "🇮🇳 Jaipur", value: "Jaipur, India" },
            { label: "🌴 Bali", value: "Bali, Indonesia" },
            { label: "🏖️ Goa", value: "Goa, India" },
            { label: "🏯 Kyoto", value: "Kyoto, Japan" },
            { label: "✨ Surprise me", value: "SURPRISE" },
          ],
        },
      ]);
    }
  }, []);

  /* ---------------- board actions ---------------- */
  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const togglePin = (id: string) => {
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    setSelected((s) => (s.includes(id) ? s : [...s, id]));
  };
  const skip = (id: string) => {
    setSkipped((s) => [...s, id]);
    setSelected((s) => s.filter((x) => x !== id));
    toast("Skipped", "I'll find an alternative in that category.", "info");
  };

  const generate = () => {
    if (!selectedPlaces.length) {
      toast("Pick a place first", "Tap Add on at least one card — or ask me to pick.", "info");
      setTab("places");
      return;
    }
    const plan = makeItinerary(selectedPlaces, days, start);
    setItinerary(plan);
    setTab("itinerary");
    setMobileView("board");
    toast("Itinerary built", `${selectedPlaces.length} stops across ${days} days.`);
  };

  const save = () => {
    const plan = itinerary.length ? itinerary : makeItinerary(selectedPlaces, days, start);
    if (!plan.some((d) => d.items.length)) {
      toast("Add some stops first", "Select places, then build your itinerary.", "info");
      return;
    }
    const id = uid("trip");
    const trip: Trip = {
      id,
      title: `${days}-day ${THEMES.find((t) => t.id === theme)?.label} in ${destLabel.split(",")[0]}`,
      destination: destLabel.split(",")[0],
      country,
      lat,
      lng,
      startDate: start,
      endDate: end,
      days,
      budget,
      currency: "INR",
      theme,
      pace,
      cover: cityObj?.image ?? selectedPlaces[0]?.image ?? IMG.jaipur,
      status: "planned",
      visibility: "private",
      members: [{ id: uid("m"), name: preferences.name, role: "owner", color: "#0f9d8f" }],
      itinerary: plan,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    addTrip(trip);
    toast("Trip saved 🎉", "Opening your itinerary board.");
    router.push(`/trips/${id}`);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setMessages([
      {
        id: uid("m"),
        role: "agent",
        text: "Let's start fresh. Where do you want to go next?",
        chips: [
          { label: "🇮🇳 Jaipur", value: "Jaipur, India" },
          { label: "🌴 Bali", value: "Bali, Indonesia" },
          { label: "🏖️ Goa", value: "Goa, India" },
          { label: "🏯 Kyoto", value: "Kyoto, Japan" },
          { label: "✨ Surprise me", value: "SURPRISE" },
        ],
      },
    ]);
    setStage("destination");
    setTyping(false);
  };

  const tabs: TabItem[] = [
    { id: "places", label: "Places", count: selected.length || undefined },
    { id: "itinerary", label: "Itinerary", count: itinerary.reduce((s, d) => s + d.items.length, 0) || undefined },
    { id: "map", label: "Map" },
    { id: "budget", label: "Budget" },
  ];

  const boardPlaces: (Place & { index?: number; dayColor?: string })[] = itinerary.length
    ? itinerary.flatMap((d) =>
        d.items
          .map((item, i) => {
            const p = PLACES.find((x) => x.id === item.placeId);
            return p
              ? { ...p, index: i + 1, dayColor: ["#0f9d8f", "#6366f1", "#f59e0b", "#ec4899"][(d.day - 1) % 4] }
              : null;
          })
          .filter((p): p is Place & { index: number; dayColor: string } => p !== null)
      )
    : selectedPlaces;

  const mapPoints = (boardPlaces.length ? boardPlaces : cityPlaces.slice(0, 8)).map((p, i) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    price: p.price,
    category: p.category,
    index: i + 1,
    color: "dayColor" in p ? (p.dayColor as string) : "#0f9d8f",
  }));

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 lg:px-6">
      {/* Top bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg"><Compass size={16} /></span>
          <div>
            <h1 className="text-sm font-extrabold text-fg">Trip studio</h1>
            <p className="text-[11px] text-muted">Chat with the agent, then shape the board.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-1.5 text-[11px] font-semibold text-muted sm:flex">
            <MapPin size={12} className="text-accent" /> {destLabel}
            <span className="text-line">|</span>
            <CalendarDays size={12} /> {days}d
            <span className="text-line">|</span>
            <Wallet size={12} /> ₹{formatINR(budget)}
            <span className="text-line">|</span>
            <Users size={12} /> {travellers}
          </div>
          <Segmented
            className="lg:hidden"
            options={[
              { value: "chat", label: "Chat" },
              { value: "board", label: "Board" },
            ]}
            value={mobileView}
            onChange={(v) => setMobileView(v)}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:h-[calc(100vh-7.5rem)] lg:grid-cols-[400px_minmax(0,1fr)]">
        {/* ---------------- CHAT ---------------- */}
        <Card className={cn("flex min-h-[560px] flex-col overflow-hidden lg:h-full", mobileView === "board" && "hidden lg:flex")}>
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg">
              <Sparkles size={17} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-extrabold text-fg">Voyage Agent</div>
              <div className="text-[10px] font-medium text-muted">Grounded in places, weather & budget</div>
            </div>
            <button onClick={reset} className="rounded-lg p-1.5 text-muted transition hover:bg-card2 hover:text-fg" title="Restart chat" aria-label="Restart chat">
              <RotateCcw size={15} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => {
                const isLast = idx === messages.length - 1;
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn("flex gap-2", m.role === "user" ? "flex-row-reverse" : "")}
                  >
                    {m.role === "agent" && (
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                        <Sparkles size={12} />
                      </span>
                    )}
                    <div className={cn("max-w-[86%] space-y-2", m.role === "user" && "items-end")}>
                      {(m.text || m.streaming) && (
                        <div
                          className={cn(
                            "whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                            m.role === "user"
                              ? "rounded-tr-sm bg-accent text-accent-fg"
                              : "rounded-tl-sm border border-line bg-card2 text-fg"
                          )}
                        >
                          {m.text}
                          {m.streaming && !m.text && <span className="inline-flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" /></span>}
                        </div>
                      )}
                      {m.tools && m.tools.length > 0 && (
                        <div className="space-y-1.5 rounded-xl border border-line bg-card px-3 py-2">
                          {m.tools.map((t) => (
                            <div key={t.label} className="flex items-center gap-2 text-[11px]">
                              {t.done ? (
                                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/15 text-emerald-500"><Check size={10} strokeWidth={3} /></span>
                              ) : (
                                <Spinner className="h-3.5 w-3.5 text-accent" />
                              )}
                              <span className={t.done ? "text-muted" : "font-semibold text-fg"}>{t.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {isLast && !typing && m.chips && m.chips.length > 0 && m.role === "agent" && (
                        <div className="flex flex-wrap gap-1.5">
                          {m.chips.map((c) => (
                            <button
                              key={c.label}
                              onClick={() => (c.value === "AUTO_PICK" ? autoPick() : handleChoice(c.value, c.label.replace(/^[^\w₹]+/, "")))}
                              className="rounded-full border border-accent/30 bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent transition hover:bg-accent hover:text-accent-fg"
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {typing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Sparkles size={12} /></span>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-line bg-card2 px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 130}ms` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-line p-2.5">
            <div className="flex items-end gap-2 rounded-xl border border-line bg-card p-1.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={stage === "done" ? "Ask to refine, e.g. “make day 2 cheaper”…" : "Type a destination, number or vibe…"}
                className="max-h-24 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-fg outline-none placeholder:text-muted"
              />
              <button
                onClick={submit}
                disabled={!input.trim() || typing || stage === "searching"}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-fg transition disabled:opacity-40"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1"><Info size={10} /> Demo data · prices are indicative</span>
              <span>Enter to send</span>
            </div>
          </div>
        </Card>

        {/* ---------------- BOARD ---------------- */}
        <Card className={cn("flex min-h-[560px] flex-col overflow-hidden lg:h-full", mobileView === "chat" && "hidden lg:flex")}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2.5 sm:px-4">
            <Tabs items={tabs} active={tab} onChange={(id) => setTab(id as PanelTab)} />
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-muted sm:flex">
                <span className="h-2 w-2 rounded-full bg-accent" />
                ₹{formatINR(cost.total)} est.
              </div>
              <Button size="sm" onClick={generate} disabled={!selected.length}>
                <Sparkles size={13} /> Build itinerary
              </Button>
            </div>
          </div>

          {isSample && (
            <div className="flex items-center gap-2 border-b border-line bg-amber-500/8 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400">
              <Info size={13} />
              Curated sample places shown for {dest.split(",")[0]}. Connect Google Places for live results — the workflow is identical.
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {/* PLACES */}
            {tab === "places" && (
              <div>
                {!dest ? (
                  <EmptyState
                    icon={<MapPin size={22} />}
                    title="Where are we going?"
                    description="Tell the agent a destination, or pick one of the quick replies. I'll load review-backed places here."
                  />
                ) : (
                  <>
                    {/* Destination 3D Cylinder Header */}
                    <div className="mb-4 overflow-hidden rounded-2xl border border-line bg-card/60 shadow-sm">
                      <TiltedGridHero
                        images={heroImages}
                        speed={4.5}
                        tileHeight={48}
                        aspectRatio={16 / 9}
                        gap={6}
                        curve={74}
                        fade={12}
                        className="h-[170px] w-full"
                      >
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-end justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                              <Sparkles size={11} /> 3D Destination Stream
                            </div>
                            <h3 className="text-lg font-extrabold text-white">{destLabel}</h3>
                            <p className="text-[11px] text-white/80">{cityObj?.tagline ?? "Curated sights · real reviews · live routing"}</p>
                          </div>
                          <Badge variant="glass" className="text-[11px] font-semibold text-white">
                            {cityPlaces.length} curated spots
                          </Badge>
                        </div>
                      </TiltedGridHero>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-1.5">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setFilter(c)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
                            filter === c ? "border-accent bg-accent text-accent-fg" : "border-line bg-card text-muted hover:text-fg"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowSkipped((s) => !s)}
                        className={cn("ml-auto rounded-full px-2.5 py-1.5 text-[10px] font-bold", showSkipped ? "bg-card2 text-fg" : "text-muted hover:text-fg")}
                      >
                        {showSkipped ? "Hide skipped" : `Skipped (${skipped.length})`}
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visiblePlaces.map((p) => {
                        const isSel = selected.includes(p.id);
                        const isPin = pinned.includes(p.id);
                        return (
                          <motion.div key={p.id} layout className={cn("group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-card", isSel ? "border-accent/70 ring-1 ring-accent/30" : "border-line")}>
                            <div className="relative h-36 overflow-hidden">
                              <Img src={p.image} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
                                <div className="flex gap-1">
                                  <Badge variant="glass"><Star size={10} className="fill-gold text-gold" /> {p.rating}</Badge>
                                  <Badge variant="glass">{p.price ? `₹${formatINR(p.price)}` : "Free"}</Badge>
                                </div>
                                <button
                                  onClick={() => togglePin(p.id)}
                                  aria-label="Pin place"
                                  className={cn("grid h-7 w-7 place-items-center rounded-full backdrop-blur transition", isPin ? "bg-accent text-accent-fg" : "bg-black/30 text-white hover:bg-black/50")}
                                >
                                  <Pin size={12} className={isPin ? "fill-current" : ""} />
                                </button>
                              </div>
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-white/80">
                                  <span>{p.category}</span><span>·</span><span>{p.duration}</span>
                                </div>
                                <div className="text-sm font-extrabold leading-tight text-white">{p.name}</div>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="mb-1.5 flex items-center gap-1 text-[10px] text-muted">
                                <Stars rating={p.rating} size={10} />
                                <span>{p.reviewCount.toLocaleString("en-IN")} reviews</span>
                              </div>
                              <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-muted">{p.description}</p>
                              <div className="mb-2 flex items-start gap-1 rounded-lg bg-accent-soft/60 px-2 py-1.5 text-[10px] font-medium leading-snug text-accent">
                                <Sparkles size={10} className="mt-0.5 shrink-0" />
                                <span className="line-clamp-2">{p.why}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => toggle(p.id)}
                                  className={cn(
                                    "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition",
                                    isSel ? "bg-accent text-accent-fg" : "border border-line text-fg hover:border-accent hover:bg-accent-soft"
                                  )}
                                >
                                  {isSel ? "✓ Added" : "+ Add"}
                                </button>
                                <Link
                                  href={`/places/${p.id}`}
                                  className="grid w-8 place-items-center rounded-lg border border-line text-muted transition hover:text-fg"
                                  aria-label={`View ${p.name}`}
                                >
                                  <ChevronRight size={14} />
                                </Link>
                                <button
                                  onClick={() => skip(p.id)}
                                  className="grid w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-danger/40 hover:text-danger"
                                  aria-label={`Skip ${p.name}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {visiblePlaces.length === 0 && (
                      <EmptyState icon={<Info size={20} />} title="Nothing here" description="Try another category or unhide skipped places." />
                    )}
                  </>
                )}
              </div>
            )}

            {/* ITINERARY */}
            {tab === "itinerary" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-fg">Day-by-day plan</h2>
                    <p className="text-[11px] text-muted">{formatDate(start)} – {formatDate(end)} · {days} days · {travellers} travellers</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={generate}><RefreshCw size={12} /> Regenerate</Button>
                    <Button size="sm" onClick={save}><Check size={12} /> Save trip</Button>
                  </div>
                </div>

                {itinerary.length === 0 ? (
                  <EmptyState
                    icon={<CalendarDays size={22} />}
                    title="Your board is empty"
                    description="Select places from the Places tab (or ask the agent to pick), then build a weather-aware itinerary."
                    action={<Button onClick={generate} disabled={!selected.length}><Sparkles size={14} /> Build from {selected.length} picks</Button>}
                  />
                ) : (
                  <>
                    <WeatherStrip lat={lat} lng={lng} city={cityName} start={start} end={end} compact />
                    <div className="grid gap-3 sm:grid-cols-2">
                      {itinerary.map((day) => {
                        const dayPlaces = day.items.map((i) => PLACES.find((p) => p.id === i.placeId)).filter(Boolean) as Place[];
                        const dayCost = day.items.reduce((s, i) => s + i.cost, 0);
                        return (
                          <div key={day.day} className="rounded-2xl border border-line bg-card p-3">
                            <div className="mb-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[11px] font-extrabold text-accent-fg">{day.day}</span>
                                <div>
                                  <div className="text-xs font-extrabold text-fg">Day {day.day}</div>
                                  <div className="text-[10px] text-muted">{formatDate(day.date || start, { weekday: "short", day: "numeric", month: "short" })}</div>
                                </div>
                              </div>
                              <Badge variant="outline">₹{formatINR(dayCost)}</Badge>
                            </div>
                            <div className="space-y-1.5">
                              {day.items.length === 0 && <div className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-[10px] text-muted">Free day — add a stop from Places</div>}
                              {day.items.map((item) => {
                                const p = PLACES.find((x) => x.id === item.placeId);
                                if (!p) return null;
                                return (
                                  <div key={item.id} className="flex items-center gap-2 rounded-xl border border-line bg-card2/50 p-1.5">
                                    <span className="w-10 shrink-0 text-center text-[10px] font-extrabold text-accent">{item.time}</span>
                                    <Img src={p.image} alt={p.name} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-[11px] font-bold text-fg">{p.name}</div>
                                      <div className="text-[9px] text-muted">{p.category} · {item.duration}</div>
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted">{p.price ? `₹${formatINR(p.price)}` : "Free"}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* MAP */}
            {tab === "map" && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-fg">Map & weather</h2>
                    <p className="text-[11px] text-muted">
                      {itinerary.length ? "Numbered stops follow your day order." : `${mapPoints.length} curated places in ${cityName}.`}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cityName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-fg"
                  >
                    <MapPin size={12} /> Open in Google Maps
                  </a>
                </div>
                <WeatherStrip lat={lat} lng={lng} city={cityName} start={start} end={end} />
                <TripMap places={mapPoints} height={420} />
                {selectedPlaces.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlaces.map((p, i) => (
                      <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[10px] font-semibold text-muted">
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-[8px] font-bold text-accent-fg">{i + 1}</span>
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BUDGET */}
            {tab === "budget" && (
              <div className="space-y-4">
                <GroupBudget
                  storageKey={`voyage-group-${cityName.toLowerCase()}`}
                  defaultBudget={budget}
                  onApply={setBudget}
                  onAggregate={setGroupAgg}
                  compact
                />
                <BudgetPanel
                  places={selectedPlaces.length ? selectedPlaces : cityPlaces}
                  days={days}
                  travellers={travellers}
                  budget={budget}
                  city={cityName}
                  country={country}
                  pace={pace}
                  start={start}
                  end={end}
                  onBudgetChange={setBudget}
                />
              </div>
            )}
          </div>

          {/* footer bar */}
          <div className="flex flex-wrap items-center gap-2 border-t border-line bg-card px-3 py-2.5 sm:px-4">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-bold text-fg">{selected.length}</span>
              <span className="text-muted">picked</span>
              <span className="text-line">|</span>
              <span className="font-bold text-fg">₹{formatINR(cost.total)}</span>
              <span className="text-muted">est. total</span>
              {budget > 0 && (
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", cost.total > budget ? "bg-danger/10 text-danger" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400")}>
                  {cost.total > budget ? `₹${formatINR(cost.total - budget)} over` : `₹${formatINR(budget - cost.total)} left`}
                </span>
              )}
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <Segmented
                className="hidden sm:flex"
                options={[
                  { value: "relaxed", label: "Relaxed" },
                  { value: "balanced", label: "Balanced" },
                  { value: "packed", label: "Packed" },
                ]}
                value={pace}
                onChange={(v) => setPace(v)}
              />
              <Button size="sm" variant="outline" onClick={generate} disabled={!selected.length}>Build</Button>
              <Button size="sm" onClick={save} disabled={!selected.length}><Check size={13} /> Save trip</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
