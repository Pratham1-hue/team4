"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  CloudSun,
  Wallet,
  Users,
  MessageSquare,
  Route,
  Download,
  ShieldCheck,
  CalendarDays,
  Star,
  MapPin,
  Plane,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { DestinationInput, type GeoResult } from "@/components/destination-input";
import { CITIES, THEMES } from "@/lib/data";
import { cn, formatINR } from "@/lib/utils";
import { Badge, Button, Card, Img, SectionHeading, Stars, AvatarStack } from "@/components/ui";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LandingPage() {
  const router = useRouter();
  const [dest, setDest] = useState("");
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [theme, setTheme] = useState("relaxation");

  const go = (destination?: string, lat?: number, lng?: number, country?: string, themeId?: string) => {
    const params = new URLSearchParams();
    const d = destination ?? dest;
    if (d.trim()) params.set("dest", d.trim());
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    if (country) params.set("country", country);
    if (themeId ?? theme) params.set("theme", themeId ?? theme);
    router.push(`/plan?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden">
      {/* ---------------- HERO ---------------- */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="hero-grid absolute inset-0" />
          <div className="absolute -left-32 top-[-10%] h-[420px] w-[420px] rounded-full bg-accent/20 blur-[110px]" />
          <div className="absolute right-[-10%] top-[8%] h-[380px] w-[380px] rounded-full bg-indigo-500/15 blur-[110px]" />
          <div className="absolute bottom-0 left-[35%] h-[300px] w-[300px] rounded-full bg-pink-500/10 blur-[100px]" />
        </div>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:pb-24 lg:pt-20 lg:px-8">
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Badge variant="soft" className="mb-5 gap-1.5 px-3 py-1.5 text-xs">
                <Sparkles size={12} /> AI agent · live weather · real maps
              </Badge>
              <h1 className="max-w-2xl text-[40px] font-extrabold leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Dream it.
                <br />
                We&apos;ll <span className="gradient-text">plan it.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
                Tell our AI where you&apos;re going, how long and what you love. Get a photo-rich itinerary with real
                weather, an interactive map and a budget that actually adds up — in minutes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative z-20 mt-7 max-w-2xl"
            >
              <div className="card p-2.5 shadow-lift">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <DestinationInput
                    value={dest}
                    onChange={(v) => {
                      setDest(v);
                      setGeo(null);
                    }}
                    onSelect={(r) => setGeo(r)}
                    placeholder="Where to next? e.g. Jaipur, Bali, Kyoto…"
                    className="flex-1"
                    inputClassName="border-0 bg-transparent py-3.5 focus:ring-0"
                  />
                  <Button size="lg" className="h-auto px-6 py-3.5" onClick={() => go(dest, geo?.lat, geo?.lng, geo?.country)}>
                    Plan my trip <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted">I&apos;m feeling…</span>
                {THEMES.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      theme === t.id
                        ? "border-accent bg-accent text-accent-fg shadow-sm"
                        : "border-line bg-card text-muted hover:border-accent/50 hover:text-fg"
                    )}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"
            >
              {[
                { icon: <CheckCircle2 size={13} className="text-accent" />, label: "No sign-up needed" },
                { icon: <CloudSun size={13} className="text-accent" />, label: "Real Open-Meteo weather" },
                { icon: <MapPin size={13} className="text-accent" />, label: "OpenStreetMap routes" },
              ].map((f) => (
                <span key={f.label} className="inline-flex items-center gap-1.5 font-medium">{f.icon}{f.label}</span>
              ))}
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative mx-auto hidden w-full max-w-[520px] lg:block"
          >
            <div className="relative h-[440px]">
              <div className="absolute right-2 top-4 h-[300px] w-[280px] rotate-3 overflow-hidden rounded-[28px] border border-line bg-card shadow-lift">
                <Img src={CITIES[1].image} alt="Bali" className="h-[300px] w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Your trip</div>
                  <div className="text-xl font-extrabold">7 days in Bali</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] opacity-90">
                    <span>🌴 Relaxation</span>·<span>2 travellers</span>·<span>₹1.2L</span>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 top-10 w-[190px] rounded-2xl border border-line bg-card/90 p-3 shadow-lift backdrop-blur"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Ubud weather</span>
                  <CloudSun size={14} className="text-gold" />
                </div>
                <div className="mt-1 flex items-end gap-2">
                  <span className="text-2xl font-extrabold text-fg">28°</span>
                  <span className="pb-1 text-[10px] text-muted">☀️ Clear</span>
                </div>
                <div className="mt-1 flex gap-1">
                  {["☀️ 29°", "⛅ 28°", "🌦️ 27°"].map((d) => (
                    <span key={d} className="rounded-md bg-card2 px-1.5 py-1 text-[9px] font-semibold text-muted">{d}</span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-2 left-6 w-[200px] rounded-2xl border border-line bg-card/90 p-3 shadow-lift backdrop-blur"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent"><Wallet size={15} /></span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-muted">Budget guard</div>
                    <div className="text-sm font-extrabold text-fg">₹1,08,400</div>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card2">
                  <div className="h-full w-[78%] rounded-full bg-accent" />
                </div>
                <div className="mt-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">₹11,600 under budget ✓</div>
              </motion.div>

              <div className="absolute bottom-16 right-0 flex items-center gap-2 rounded-2xl border border-line bg-card/90 px-3 py-2 shadow-lift backdrop-blur">
                <AvatarStack names={["You", "Kai", "Mira"]} size={24} />
                <div className="text-[10px] font-semibold text-muted">3 friends in</div>
              </div>

              <div className="absolute right-6 top-[-8px] flex items-center gap-1.5 rounded-full bg-fg px-3 py-1.5 text-[10px] font-bold text-bg shadow-lift">
                <Sparkles size={11} /> AI planned in 94s
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ---------------- STATS ---------------- */}
      <section className="border-y border-line bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-line px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {[
            { icon: <MapPin size={16} />, value: "20+", label: "curated places" },
            { icon: <CloudSun size={16} />, value: "Live", label: "Open-Meteo weather" },
            { icon: <Route size={16} />, value: "OSM", label: "real map routes" },
            { icon: <Wallet size={16} />, value: "INR · USD · EUR", label: "budget in your currency" },
          ].map((s, i) => (
            <div key={s.label} className={cn("flex items-center gap-3 px-4 py-5 sm:px-6", i >= 2 && "border-t border-line md:border-t-0")}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">{s.icon}</span>
              <div>
                <div className="text-base font-extrabold text-fg">{s.value}</div>
                <div className="text-[11px] text-muted">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- DESTINATIONS ---------------- */}
      <section id="destinations" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Start somewhere"
          title="Trips people are planning now"
          subtitle="Hand-picked cities with the places, weather and costs already wired in. Pick one or search any destination."
          action={<Button variant="outline" size="sm" onClick={() => router.push("/plan")}>Explore all <ArrowRight size={14} /></Button>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c, i) => (
            <motion.button
              key={c.id}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              onClick={() => go(`${c.name}, ${c.country}`, c.lat, c.lng, c.country, c.themes[0])}
              className="group relative h-[230px] overflow-hidden rounded-3xl border border-line text-left shadow-card transition-shadow hover:shadow-lift"
            >
              <Img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute left-4 top-4 flex gap-1.5">
                {c.themes.slice(0, 2).map((t) => {
                  const th = THEMES.find((x) => x.id === t);
                  return <Badge key={t} variant="glass">{th?.emoji} {th?.label}</Badge>;
                })}
              </div>
              <div className="absolute inset-x-4 bottom-4 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-lg font-extrabold leading-tight">{c.name}</div>
                    <div className="text-[11px] font-medium text-white/70">{c.tagline}</div>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/80">
                      <span>🗓 {c.bestSeason}</span>
                      <span>·</span>
                      <span>from ₹{formatINR(c.from)}</span>
                    </div>
                  </div>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/15 backdrop-blur transition-transform group-hover:translate-x-0.5">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ---------------- FEATURES ---------------- */}
      <section className="border-y border-line bg-card/40 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            center
            eyebrow="Not another spreadsheet"
            title="Everything a real trip needs"
            subtitle="Built on the blueprint: an agent with tools, grounded data, hard budget constraints and collaboration from day one."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <MessageSquare size={20} />, title: "Agent that asks, then acts", desc: "One question per turn, quick replies, then it searches, ranks and plans — never inventing prices.", tint: "from-teal-500/15 to-emerald-500/5" },
              { icon: <CloudSun size={20} />, title: "Weather-aware days", desc: "Live forecasts and historical typical weather per day, with indoor backup suggestions on rainy days.", tint: "from-sky-500/15 to-blue-500/5" },
              { icon: <Route size={20} />, title: "Real maps & route order", desc: "Every stop pinned on OpenStreetMap, clustered by day, with one-tap Google Maps navigation.", tint: "from-indigo-500/15 to-violet-500/5" },
              { icon: <Wallet size={20} />, title: "Budget that adds up", desc: "Stays, food, activities, transport and a 10% buffer — with confidence labels and over-budget warnings.", tint: "from-amber-500/15 to-orange-500/5" },
              { icon: <Users size={20} />, title: "Plan together", desc: "Invite by link, WhatsApp or email. Roles, votes and comments keep the group aligned.", tint: "from-pink-500/15 to-rose-500/5" },
              { icon: <Download size={20} />, title: "Take it offline", desc: "Export .ics to your calendar, print a PDF or open the public read-only page on the move.", tint: "from-purple-500/15 to-fuchsia-500/5" },
            ].map((f, i) => (
              <motion.div key={f.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}>
                <Card className="group h-full p-5 transition-all hover:-translate-y-1 hover:shadow-lift">
                  <div className={cn("mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-accent", f.tint)}>{f.icon}</div>
                  <h3 className="text-[15px] font-bold text-fg">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <SectionHeading center eyebrow="Under 3 minutes" title="From “where to?” to a shareable plan" />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: "Tell the agent", desc: "Destination, days, budget, travellers and a theme. Use quick replies or your own words.", icon: <MessageSquare size={18} /> },
            { n: "02", title: "Pick your places", desc: "Swipe or click through review-backed cards. Add, pin or skip — the agent fills the gaps.", icon: <Sparkles size={18} /> },
            { n: "03", title: "Refine & share", desc: "Weather-checked days, live budget, drag to reorder, then invite the crew and export.", icon: <Users size={18} /> },
          ].map((s, i) => (
            <motion.div key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
              <Card className="relative h-full overflow-hidden p-6">
                <span className="absolute right-4 top-3 text-5xl font-black text-line/70">{s.n}</span>
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg">{s.icon}</div>
                <h3 className="text-base font-bold text-fg">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- SOCIAL PROOF ---------------- */}
      <section className="border-y border-line bg-card/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { quote: "Planned a 4-day Jaipur trip during a lunch break. The weather badge saved our Nahargarh sunset plan.", name: "Aarav Mehta", trip: "Jaipur · 4 days", rating: 5 },
              { quote: "Finally a planner that shows the math. We trimmed ₹18k by swapping two dinners — no arguing.", name: "Mira Shah", trip: "Bali · 7 days", rating: 5 },
              { quote: "The group vote settled our Uluwatu vs. beach day in one evening. Itinerary updated itself.", name: "Kai Nakamura", trip: "Kyoto · 6 days", rating: 4 },
            ].map((t) => (
              <Card key={t.name} className="p-5">
                <Stars rating={t.rating} showValue />
                <p className="mt-3 text-sm leading-relaxed text-fg">“{t.quote}”</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{t.name.split(" ").map((w) => w[0]).join("")}</span>
                  <div>
                    <div className="text-xs font-bold text-fg">{t.name}</div>
                    <div className="text-[10px] text-muted">{t.trip}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] bg-fg px-6 py-12 text-center text-bg sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-[80px]" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-indigo-500/30 blur-[90px]" />
          <div className="relative">
            <Badge className="mb-4 border-white/20 bg-white/10 text-white"><Plane size={11} /> Your next trip is one prompt away</Badge>
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Where do you want to wake up next?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
              Free to start. No spreadsheets, no tabs, no guesswork. Just a plan you can actually follow.
            </p>
            <div className="mx-auto mt-7 flex max-w-md flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="w-full bg-accent text-accent-fg sm:w-auto" onClick={() => router.push("/plan")}>
                <Sparkles size={16} /> Plan with AI
              </Button>
              <Button size="lg" variant="outline" className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 sm:w-auto" onClick={() => router.push("/trips")}>
                See my trips <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-line bg-card/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-extrabold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg"><Plane size={16} /></span>
                Yatri<span className="text-accent">.</span>
              </div>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-muted">
                AI travel planner MVP built from the blueprint: agent core, structured UI payloads, live weather, maps and
                budget guardrails.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted">
              <Link href="/plan" className="hover:text-accent">Plan a trip</Link>
              <Link href="/trips" className="hover:text-accent">My trips</Link>
              <Link href="/profile" className="hover:text-accent">Preferences</Link>
              <span className="text-muted/60">Weather by Open-Meteo</span>
              <span className="text-muted/60">Maps by OpenStreetMap</span>
            </div>
          </div>
          <div className="mt-6 border-t border-line pt-5 text-[11px] text-muted">
            © 2026 Yatri · Prices and ratings are indicative demo data · Always confirm with the provider before booking.
          </div>
        </div>
      </footer>
    </div>
  );
}
