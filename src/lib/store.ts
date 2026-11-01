"use client";

import { create } from "zustand";
import type { Preferences, Trip } from "./types";
import { SEED_TRIPS } from "./data";
import { uid } from "./utils";

const KEY = "voyage-ai-state-v1";

export interface ToastMsg {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "error" | "info";
}

interface Persisted {
  theme: "light" | "dark";
  trips: Trip[];
  preferences: Preferences;
  taste?: Record<string, number>;
}

const DEFAULT_PREFS: Preferences = {
  name: "Pratham Prajapati",
  email: "pratham@voyage.ai",
  homeCity: "Ahmedabad, India",
  currency: "INR",
  locale: "en-IN",
  diet: "Vegetarian friendly",
  pace: "balanced",
  budgetStyle: "Mid-range",
  interests: ["Heritage", "Food", "Nature", "Photography"],
  mobility: "No constraints",
  notifications: true,
};

interface AppState {
  theme: "light" | "dark";
  hydrated: boolean;
  trips: Trip[];
  preferences: Preferences;
  taste: Record<string, number>;
  toasts: ToastMsg[];
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  hydrate: () => void;
  logTaste: (tags: string[], weight?: number) => void;
  toast: (title: string, description?: string, variant?: ToastMsg["variant"]) => void;
  dismissToast: (id: string) => void;
  addTrip: (trip: Trip) => void;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  duplicateTrip: (id: string) => string | null;
  savePreferences: (p: Preferences) => void;
  addPlaceToTrip: (tripId: string, placeId: string) => void;
  removeTripItem: (tripId: string, day: number, itemId: string) => void;
  moveTripItem: (tripId: string, day: number, from: number, to: number) => void;
}

const write = (state: Partial<Persisted>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ theme: state.theme ?? "light", trips: state.trips ?? SEED_TRIPS, preferences: state.preferences ?? DEFAULT_PREFS })
    );
  } catch {
    // storage unavailable — ignore
  }
};

export const useApp = create<AppState>((set, get) => ({
  theme: "light",
  hydrated: false,
  trips: SEED_TRIPS,
  preferences: DEFAULT_PREFS,
  taste: {},
  toasts: [],

  setTheme: (theme) => {
    set({ theme });
    write({ ...get(), theme });
  },

  toggleTheme: () => {
    const theme = get().theme === "dark" ? "light" : "dark";
    set({ theme });
    write({ ...get(), theme });
  },

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        set({
          theme: parsed.theme === "dark" ? "dark" : "light",
          trips: Array.isArray(parsed.trips) && parsed.trips.length ? parsed.trips : SEED_TRIPS,
          preferences: { ...DEFAULT_PREFS, ...(parsed.preferences || {}) },
          hydrated: true,
        });
        return;
      }
    } catch {
      // ignore corrupt storage
    }
    set({ hydrated: true });
  },

  toast: (title, description, variant = "success") => {
    const id = uid("toast");
    set({ toasts: [...get().toasts, { id, title, description, variant }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 4200);
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  logTaste: (tags, weight = 1) => {
    const taste = { ...get().taste };
    tags.forEach((tag) => {
      taste[tag] = (taste[tag] || 0) + weight;
    });
    set({ taste });
  },

  addTrip: (trip) => {
    const trips = [trip, ...get().trips];
    set({ trips });
    write({ ...get(), trips });
  },

  updateTrip: (id, patch) => {
    const trips = get().trips.map((t) => (t.id === id ? { ...t, ...patch } : t));
    set({ trips });
    write({ ...get(), trips });
  },

  duplicateTrip: (id) => {
    const trip = get().trips.find((t) => t.id === id);
    if (!trip) return null;
    const newId = uid("trip");
    const copy: Trip = {
      ...trip,
      id: newId,
      title: `${trip.title} (Remix)`,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
      itinerary: trip.itinerary.map((d) => ({
        ...d,
        items: d.items.map((i) => ({ ...i, id: uid("item") })),
      })),
    };
    const trips = [copy, ...get().trips];
    set({ trips });
    write({ ...get(), trips });
    return newId;
  },

  savePreferences: (preferences) => {
    set({ preferences });
    write({ ...get(), preferences });
  },

  addPlaceToTrip: (tripId, placeId) => {
    const trips = get().trips.map((t) => {
      if (t.id !== tripId) return t;
      const itinerary = [...t.itinerary];
      if (!itinerary.length) {
        itinerary.push({ day: 1, date: t.startDate, items: [] });
      }
      const target = itinerary.findIndex((d) => d.items.length < 5);
      const dayIdx = target === -1 ? 0 : target;
      const times = ["09:00", "12:30", "15:30", "18:30", "20:30"];
      const day = itinerary[dayIdx];
      itinerary[dayIdx] = {
        ...day,
        items: [
          ...day.items,
          {
            id: uid("item"),
            placeId,
            time: times[Math.min(day.items.length, times.length - 1)],
            duration: "1.5 hrs",
            cost: 0,
          },
        ],
      };
      return { ...t, itinerary };
    });
    set({ trips });
    write({ ...get(), trips });
  },

  removeTripItem: (tripId, day, itemId) => {
    const trips = get().trips.map((t) =>
      t.id === tripId
        ? {
            ...t,
            itinerary: t.itinerary.map((d) =>
              d.day === day ? { ...d, items: d.items.filter((i) => i.id !== itemId) } : d
            ),
          }
        : t
    );
    set({ trips });
    write({ ...get(), trips });
  },

  moveTripItem: (tripId, day, from, to) => {
    const trips = get().trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        itinerary: t.itinerary.map((d) => {
          if (d.day !== day) return d;
          const items = [...d.items];
          const [moved] = items.splice(from, 1);
          if (!moved) return d;
          items.splice(to, 0, moved);
          return { ...d, items };
        }),
      };
    });
    set({ trips });
    write({ ...get(), trips });
  },
}));
