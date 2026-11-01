"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  MapPin,
  Mail,
  Globe2,
  Utensils,
  Gauge,
  Wallet,
  Languages,
  Bell,
  Accessibility,
  Sparkles,
  Briefcase,
  Route,
  Heart,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { Pace } from "@/lib/types";
import { PLACES } from "@/lib/data";
import { cn, formatINR } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Img, Segmented, Stars } from "@/components/ui";

const INTERESTS = ["Heritage", "Food", "Nature", "Photography", "Beaches", "Temples", "Museums", "Nightlife", "Shopping", "Hiking", "Wellness", "Art"];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-accent" : "bg-line")}
      aria-pressed={on}
      aria-label="Toggle notifications"
    >
      <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { preferences, savePreferences, trips, toast } = useApp();
  const [form, setForm] = useState(preferences);
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    setForm(preferences);
  }, [preferences]);

  useEffect(() => {
    fetch("/api/rates?base=INR")
      .then((r) => r.json())
      .then((d: { rates?: Record<string, number> }) => setRates(d.rates ?? null))
      .catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const countries = new Set(trips.map((t) => t.country)).size;
    const days = trips.reduce((s, t) => s + t.days, 0);
    return { trips: trips.length, countries, days };
  }, [trips]);

  const saved = PLACES.slice(0, 3);

  const save = () => {
    savePreferences(form);
    toast("Preferences saved", "Your agent will use these on the next plan.");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Your profile</div>
        <h1 className="mt-1 text-3xl font-extrabold text-fg">Preferences</h1>
        <p className="mt-1 text-sm text-muted">Teach the agent how you like to travel. It gets better with every trip.</p>
      </div>

      {/* Profile card */}
      <Card className="mb-5 overflow-hidden">
        <div className="relative h-28 bg-gradient-to-r from-accent/80 via-indigo-500/60 to-pink-500/50">
          <div className="hero-grid absolute inset-0 opacity-30" />
        </div>
        <div className="px-5 pb-5">
          <div className="-mt-9 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <Avatar name={form.name} size={72} className="ring-4 ring-card" />
              <div className="pb-1">
                <h2 className="text-xl font-extrabold text-fg">{form.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1"><Mail size={11} /> {form.email}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={11} /> {form.homeCity}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="soft"><Sparkles size={10} /> Voyage member</Badge>
              <Badge variant="outline">{form.locale}</Badge>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-md">
            {[
              { icon: <Briefcase size={14} />, value: stats.trips, label: "trips" },
              { icon: <Globe2 size={14} />, value: stats.countries, label: "countries" },
              { icon: <Route size={14} />, value: stats.days, label: "days" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 rounded-xl bg-card2 px-3 py-2">
                <span className="text-accent">{s.icon}</span>
                <div>
                  <div className="text-sm font-extrabold leading-tight text-fg">{s.value}</div>
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {/* Basics */}
          <Card className="p-5">
            <h2 className="mb-4 text-base font-extrabold text-fg">Basics</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Name", key: "name" as const, icon: <Sparkles size={12} />, type: "text" },
                { label: "Email", key: "email" as const, icon: <Mail size={12} />, type: "email" },
                { label: "Home city", key: "homeCity" as const, icon: <MapPin size={12} />, type: "text" },
              ].map((f) => (
                <div key={f.key} className="sm:col-span-1">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-muted">{f.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{f.icon}</span>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-xl border border-line bg-card py-2.5 pl-9 pr-3 text-xs font-medium text-fg outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10"
                    />
                  </div>
                </div>
              ))}
              <div>
                <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Utensils size={11} /> Diet</label>
                <select
                  value={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-medium text-fg outline-none focus:border-accent"
                >
                  {["No preference", "Vegetarian friendly", "Vegetarian", "Vegan", "Jain", "Halal", "Gluten-free"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Travel style */}
          <Card className="p-5">
            <h2 className="mb-1 text-base font-extrabold text-fg">Travel style</h2>
            <p className="mb-4 text-[11px] text-muted">These shape pacing, stays and the places the agent ranks first.</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Gauge size={11} /> Pace</label>
                <Segmented
                  options={[
                    { value: "relaxed" as Pace, label: "Relaxed" },
                    { value: "balanced" as Pace, label: "Balanced" },
                    { value: "packed" as Pace, label: "Packed" },
                  ]}
                  value={form.pace}
                  onChange={(v) => setForm({ ...form, pace: v })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Wallet size={11} /> Budget style</label>
                  <select value={form.budgetStyle} onChange={(e) => setForm({ ...form, budgetStyle: e.target.value })} className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-medium text-fg outline-none focus:border-accent">
                    {["Budget", "Mid-range", "Comfort", "Luxury"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Globe2 size={11} /> Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-medium text-fg outline-none focus:border-accent">
                    {["INR", "USD", "EUR", "GBP", "JPY", "AED"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Languages size={11} /> Language</label>
                  <select value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })} className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-medium text-fg outline-none focus:border-accent">
                    {["en-IN", "en-US", "en-GB", "hi-IN"].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted"><Accessibility size={11} /> Mobility needs</label>
                <select value={form.mobility} onChange={(e) => setForm({ ...form, mobility: e.target.value })} className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-xs font-medium text-fg outline-none focus:border-accent">
                  {["No constraints", "Avoid long walks", "Wheelchair accessible", "Avoid stairs", "Travel with kids"].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
          </Card>

          {/* Interests */}
          <Card className="p-5">
            <h2 className="mb-1 text-base font-extrabold text-fg">Interests</h2>
            <p className="mb-3 text-[11px] text-muted">Tap what you love. The agent re-ranks every place by these tags.</p>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => {
                const active = form.interests.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() =>
                      setForm({
                        ...form,
                        interests: active ? form.interests.filter((x) => x !== i) : [...form.interests, i],
                      })
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
                      active ? "border-accent bg-accent text-accent-fg" : "border-line bg-card text-muted hover:border-accent/50 hover:text-fg"
                    )}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
          </Card>

          <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <Bell size={14} className="text-accent" />
              <span className="font-semibold text-fg">Trip reminders & price alerts</span>
            </div>
            <Toggle on={form.notifications} onChange={(v) => setForm({ ...form, notifications: v })} />
          </div>

          <Button onClick={save} className="w-full sm:w-auto"><Save size={15} /> Save preferences</Button>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-extrabold text-fg">Live FX</div>
              <Badge variant="green">INR base</Badge>
            </div>
            <div className="space-y-1.5">
              {rates &&
                Object.entries(rates)
                  .filter(([k]) => k !== "INR")
                  .slice(0, 5)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-muted">₹1 →</span>
                      <span className="font-bold text-fg">{v.toFixed(v < 0.1 ? 4 : 2)} {k}</span>
                    </div>
                  ))}
              {!rates && <div className="text-[11px] text-muted">Loading rates…</div>}
            </div>
            <div className="mt-2 text-[9px] text-muted">Indicative rates via open.er-api.com</div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-extrabold text-fg"><Heart size={13} className="text-accent" /> Saved places</div>
            <div className="space-y-2">
              {saved.map((p) => (
                <Link key={p.id} href={`/places/${p.id}`} className="flex items-center gap-2 rounded-xl border border-line bg-card2/50 p-1.5 transition hover:border-accent/40">
                  <Img src={p.image} alt={p.name} className="h-9 w-9 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold text-fg">{p.name}</div>
                    <div className="text-[9px] text-muted">{p.city} · {p.price ? `₹${formatINR(p.price)}` : "Free"}</div>
                  </div>
                  <Stars rating={p.rating} size={9} />
                </Link>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-indigo-500/10 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-extrabold text-fg"><TrendingUp size={14} className="text-accent" /> Personalisation</div>
            <p className="text-[11px] leading-relaxed text-muted">
              Every add, skip and pin is logged as a signal. Over time the “Why this pick” line gets sharper — fully editable here.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => router.push("/trips")}>
              Review past trips <ArrowRight size={12} />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
