"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Compass,
  Home,
  Map,
  Plus,
  User,
  Moon,
  Sun,
  Search,
  Command,
  ArrowRight,
  Briefcase,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/plan", label: "Plan", icon: Sparkles },
  { href: "/trips", label: "My Trips", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, hydrate, trips, preferences, toasts, dismissToast } = useApp();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const links = [
    ...NAV.map((n) => ({ label: n.label, href: n.href, sub: "Navigate", icon: <n.icon size={15} /> })),
    { label: "New trip", href: "/plan", sub: "Start planning with AI", icon: <Plus size={15} /> },
    ...trips.slice(0, 5).map((t) => ({
      label: t.title,
      href: `/trips/${t.id}`,
      sub: `${t.destination} · ${t.days} days`,
      icon: <Map size={15} />,
    })),
  ].filter((l) => l.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="glass sticky top-0 z-50 border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)] transition-transform group-hover:-rotate-6">
              <Compass size={20} strokeWidth={2.4} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Voyage<span className="text-accent">AI</span>
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                    active ? "bg-accent-soft text-accent" : "text-muted hover:bg-card2 hover:text-fg"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent/50 sm:flex"
            >
              <Search size={14} />
              <span className="hidden lg:inline">Quick search</span>
              <kbd className="ml-1 flex items-center gap-0.5 rounded-md border border-line bg-card2 px-1.5 py-0.5 text-[10px] text-muted">
                <Command size={9} /> K
              </kbd>
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-card text-muted transition hover:text-fg"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link
              href="/plan"
              className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg shadow-[0_8px_20px_-8px_var(--accent)] transition hover:brightness-110 sm:inline-flex"
            >
              <Plus size={15} /> New trip
            </Link>
            <Link href="/profile" aria-label="Profile">
              <Avatar name={preferences.name} size={36} />
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-[calc(100vh-4rem)]">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-50 border-t border-line/70 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            const isPlan = n.href === "/plan";
            if (isPlan) {
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="-mt-5 flex flex-col items-center gap-1"
                  aria-label="Plan a trip"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-fg shadow-[0_10px_24px_-8px_var(--accent)]">
                    <Plus size={22} />
                  </span>
                  <span className="text-[10px] font-bold text-accent">Plan</span>
                </Link>
              );
            }
            return (
              <Link key={n.href} href={n.href} className={cn("flex flex-col items-center gap-1 px-3 py-1", active ? "text-accent" : "text-muted")}>
                <n.icon size={20} />
                <span className="text-[10px] font-bold">{n.label.replace("My ", "")}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Command palette */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div className="fixed inset-0 z-[95] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={() => setPaletteOpen(false)} />
            <motion.div
              initial={{ y: -12, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -8, scale: 0.98, opacity: 0 }}
              className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
            >
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <Search size={16} className="text-muted" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search trips and actions…"
                  className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
                />
                <button onClick={() => setPaletteOpen(false)} className="text-muted hover:text-fg"><X size={15} /></button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {links.length === 0 && <div className="px-3 py-8 text-center text-sm text-muted">No results for “{q}”</div>}
                {links.map((l, i) => (
                  <button
                    key={l.label + i}
                    onClick={() => {
                      setPaletteOpen(false);
                      setQ("");
                      router.push(l.href);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-card2"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent">{l.icon}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-fg">{l.label}</span>
                      <span className="block truncate text-[11px] text-muted">{l.sub}</span>
                    </span>
                    <ArrowRight size={14} className="ml-auto text-muted" />
                  </button>
                ))}
              </div>
              <div className="border-t border-line px-4 py-2 text-[10px] text-muted">Voyage AI · ⌘K to open · Esc to close</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-card p-3.5 shadow-lift"
            >
              <span className={cn("mt-0.5", t.variant === "error" ? "text-danger" : t.variant === "info" ? "text-sky-500" : "text-accent")}>
                {t.variant === "error" ? <AlertCircle size={17} /> : t.variant === "info" ? <Info size={17} /> : <CheckCircle2 size={17} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-fg">{t.title}</div>
                {t.description && <div className="mt-0.5 text-xs text-muted">{t.description}</div>}
              </div>
              <button onClick={() => dismissToast(t.id)} className="text-muted hover:text-fg" aria-label="Dismiss">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
