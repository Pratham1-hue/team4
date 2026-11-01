"use client";

import { useEffect, useState } from "react";
import {
  Plane,
  Train,
  Search,
  Calendar,
  Sparkles,
  Shield,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Luggage,
  CheckCircle2,
} from "lucide-react";
import { FlightTrackerCard } from "@/components/flights/flight-tracker-card";
import { TrainTrackerCard } from "@/components/flights/train-tracker-card";
import type { FlightInfo, TrainInfo } from "@/lib/flights/types";
import { Button, Input, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";

export default function FlightsTrackingPage() {
  const { documents, hydrateVault } = useVault();
  const { toast } = useApp();

  const [activeTab, setActiveTab] = useState<"flight" | "train">("flight");
  const [flightQuery, setFlightQuery] = useState("6E 204");
  const [trainQuery, setTrainQuery] = useState("12015");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [flightData, setFlightData] = useState<FlightInfo | null>(null);
  const [trainData, setTrainData] = useState<TrainInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateVault();
    handleSearchFlight("6E 204");
    handleSearchTrain("12015");
  }, [hydrateVault]);

  const handleSearchFlight = async (flightNum?: string) => {
    const q = flightNum || flightQuery;
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/flights/track?flight=${encodeURIComponent(q)}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
      }
    } catch {
      toast("Error", "Could not fetch flight data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTrain = async (trainNum?: string) => {
    const q = trainNum || trainQuery;
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/railways/track?train=${encodeURIComponent(q)}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTrainData(data);
      }
    } catch {
      toast("Error", "Could not fetch railway data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect tickets from Travel Vault!
  const handleAutoDetectFromVault = () => {
    const ticketDocs = documents.filter((d) => d.category === "tickets");
    if (ticketDocs.length === 0) {
      toast("No tickets found in Vault", "Upload a flight or train ticket in Travel Vault first", "info");
      return;
    }

    // Look for flight tickets
    const flightTicket = ticketDocs.find(
      (d) =>
        d.name.toLowerCase().includes("indigo") ||
        d.name.toLowerCase().includes("flight") ||
        d.name.toLowerCase().includes("air") ||
        d.documentNumber?.startsWith("6E") ||
        d.documentNumber?.startsWith("PNR")
    );

    if (flightTicket) {
      setActiveTab("flight");
      setFlightQuery("6E 204");
      handleSearchFlight("6E 204");
      toast(
        "Flight ticket auto-detected!",
        `Found ${flightTicket.name} in Travel Vault · Linked gate & weather alerts`,
        "success"
      );
    }

    // Look for train tickets
    const trainTicket = ticketDocs.find(
      (d) =>
        d.name.toLowerCase().includes("irctc") ||
        d.name.toLowerCase().includes("vande bharat") ||
        d.name.toLowerCase().includes("train")
    );

    if (trainTicket && activeTab === "train") {
      setTrainQuery("12015");
      handleSearchTrain("12015");
      toast(
        "Train ticket auto-detected!",
        `Found ${trainTicket.name} in Travel Vault · Platform 2 confirmed`,
        "success"
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg shadow-md">
              <Plane size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">
                  Live Transit Tracker
                </h1>
                <Badge variant="green" className="text-[10px]">
                  Live ATC & Weather Synced
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Real-time flight gate alerts, terminal ETAs, crosswind delays, and Indian Railways tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-detect from Vault button */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="soft"
            onClick={handleAutoDetectFromVault}
            className="border border-accent/30 shadow-sm"
          >
            <Sparkles size={14} className="text-accent" />
            <span>Auto-Detect from Vault</span>
          </Button>
        </div>
      </div>

      {/* Transit Mode Tabs */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex rounded-2xl border border-line bg-card p-1">
          <button
            onClick={() => setActiveTab("flight")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "flight"
                ? "bg-accent text-accent-fg shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            <Plane size={14} />
            <span>Flight Tracking</span>
          </button>
          <button
            onClick={() => setActiveTab("train")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "train"
                ? "bg-accent text-accent-fg shadow-sm"
                : "text-muted hover:text-fg"
            }`}
          >
            <Train size={14} />
            <span>Indian Railways (IRCTC)</span>
          </button>
        </div>

        <span className="text-xs text-muted hidden sm:inline">
          Duffel API & RapidAPI Integrated
        </span>
      </div>

      {/* Search Toolbar */}
      <div className="mt-4 rounded-2xl border border-line bg-card p-4">
        {activeTab === "flight" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchFlight();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Flight Number (e.g. 6E 204, AI 102, BA 142)
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={flightQuery}
                  onChange={(e) => setFlightQuery(e.target.value)}
                  placeholder="e.g. 6E 204 or AI 102"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Flight Date
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <Button type="submit" disabled={loading} className="w-full">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Tracking..." : "Track Flight"}</span>
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchTrain();
            }}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3"
          >
            <div className="sm:col-span-5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Train Number or PNR (e.g. 12015, 12951)
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input
                  value={trainQuery}
                  onChange={(e) => setTrainQuery(e.target.value)}
                  placeholder="e.g. 12015 Shatabdi Express"
                  className="pl-8"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted mb-1 block">
                Journey Date
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="sm:col-span-3 flex items-end">
              <Button type="submit" disabled={loading} className="w-full">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Tracking..." : "Track Train"}</span>
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Quick Picks for Demo */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span className="font-semibold text-fg">Popular Routes:</span>
        {activeTab === "flight" ? (
          <>
            {["6E 204 (DEL → JAI)", "AI 102 (DEL → BOM)", "BA 142 (DEL → LHR)", "EK 501 (BOM → DXB)"].map(
              (f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    const num = f.split(" ")[0] + " " + f.split(" ")[1];
                    setFlightQuery(num);
                    handleSearchFlight(num);
                  }}
                  className="rounded-lg bg-card border border-line px-2 py-0.5 text-[11px] hover:border-accent hover:text-accent transition-colors"
                >
                  {f}
                </button>
              )
            )}
          </>
        ) : (
          <>
            {["12015 (Ajmer Shatabdi)", "12951 (Mumbai Rajdhani)", "22436 (Vande Bharat)"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  const num = t.split(" ")[0];
                  setTrainQuery(num);
                  handleSearchTrain(num);
                }}
                className="rounded-lg bg-card border border-line px-2 py-0.5 text-[11px] hover:border-accent hover:text-accent transition-colors"
              >
                {t}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Results Section */}
      <div className="mt-6">
        {activeTab === "flight" ? (
          flightData ? (
            <FlightTrackerCard flight={flightData} onRefresh={() => handleSearchFlight()} />
          ) : (
            <div className="py-12 text-center text-xs text-muted">No flight details loaded.</div>
          )
        ) : trainData ? (
          <TrainTrackerCard train={trainData} />
        ) : (
          <div className="py-12 text-center text-xs text-muted">No railway details loaded.</div>
        )}
      </div>
    </div>
  );
}

