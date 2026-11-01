"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Link2,
  IndianRupee,
  TrendingDown,
  Sparkles,
  Send,
  Info,
} from "lucide-react";
import { cn, formatINR, uid } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Avatar, Badge, Button, Modal, Range } from "@/components/ui";

export interface GroupBudgetResponse {
  id: string;
  name: string;
  role: string;
  amount: number | null;
  status: "pending" | "responded";
  note?: string;
}

export interface GroupBudgetAggregate {
  responses: GroupBudgetResponse[];
  responded: number;
  total: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  recommended: number | null;
}

const DEFAULT_MEMBERS: { name: string; role: string }[] = [
  { name: "You", role: "owner" },
  { name: "Aarav", role: "editor" },
  { name: "Mira", role: "viewer" },
  { name: "Kai", role: "editor" },
];

function aggregate(responses: GroupBudgetResponse[]): GroupBudgetAggregate {
  const amounts = responses.filter((r) => r.status === "responded" && r.amount).map((r) => r.amount as number);
  const min = amounts.length ? Math.min(...amounts) : null;
  const max = amounts.length ? Math.max(...amounts) : null;
  const avg = amounts.length ? Math.round(amounts.reduce((s, n) => s + n, 0) / amounts.length) : null;
  // Plan to the lower comfort zone so nobody feels stretched
  const recommended = min;
  return { responses, responded: amounts.length, total: responses.length, min, max, avg, recommended };
}

export function GroupBudget({
  storageKey,
  defaultBudget,
  onApply,
  onAggregate,
  compact = false,
}: {
  storageKey: string;
  defaultBudget: number;
  onApply?: (amount: number) => void;
  onAggregate?: (agg: GroupBudgetAggregate) => void;
  compact?: boolean;
}) {
  const { toast, preferences } = useApp();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [responses, setResponses] = useState<GroupBudgetResponse[]>(() =>
    DEFAULT_MEMBERS.map((m, i) => ({
      id: `m${i}`,
      name: i === 0 ? preferences.name : m.name,
      role: m.role,
      amount: i === 0 ? defaultBudget : null,
      status: i === 0 ? "responded" : "pending",
    }))
  );
  const [myBudget, setMyBudget] = useState(defaultBudget);

  const agg = useMemo(() => aggregate(responses), [responses]);

  useEffect(() => {
    onAggregate?.(agg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agg]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.responses) && parsed.responses.length) {
          setResponses(parsed.responses);
        }
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = (next: GroupBudgetResponse[]) => {
    setResponses(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify({ responses: next }));
    } catch {
      // ignore
    }
  };

  const updateAmount = (id: string, amount: number) => {
    persist(
      responses.map((r) =>
        r.id === id ? { ...r, amount, status: amount > 0 ? "responded" : "pending" } : r
      )
    );
  };

  const simulate = () => {
    const next = responses.map((r) => {
      if (r.status === "responded") return r;
      const jitter = 0.7 + Math.random() * 0.5;
      return { ...r, amount: Math.round((defaultBudget * jitter) / 5000) * 5000, status: "responded" as const };
    });
    persist(next);
    toast("Responses previewed", "Aggregated budget updated for the agent.", "info");
  };

  const apply = () => {
    if (agg.recommended && onApply) {
      onApply(agg.recommended);
      toast("Group budget applied", `Planning around ₹${formatINR(agg.recommended)} — the group's comfort floor.`);
      setOpen(false);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://voyage.ai";
  const link = `${origin}/plan?group=${encodeURIComponent(storageKey)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Quick one for our trip 👋 What's a comfortable total budget per person for you? Add it here: ${link}`
  )}`;
  const mailto = `mailto:?subject=${encodeURIComponent("What's your comfortable trip budget?")}&body=${encodeURIComponent(
    `Hey! Help us plan a trip that works for everyone.\n\nAdd your comfortable budget here: ${link}\n\nIt takes 10 seconds — then the AI plans around our group range.`
  )}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Budget link copied", "Send it to your crew on WhatsApp or email.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy", "Copy the link manually.", "error");
    }
  };

  return (
    <>
      <div className={cn("rounded-2xl border border-line bg-card", compact ? "p-3" : "p-4")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent"><Users size={15} /></span>
            <div>
              <div className="text-sm font-extrabold text-fg">Group budget check</div>
              <div className="text-[11px] text-muted">
                {agg.responded}/{agg.total} replied · agent uses the comfort zone
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant={agg.responded === agg.total ? "green" : "outline"}>
              {agg.responded === agg.total ? "Everyone replied" : `${agg.total - agg.responded} pending`}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Send size={12} /> Ask group
            </Button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-card2 px-2.5 py-2">
            <div className="text-[9px] font-bold uppercase tracking-wide text-muted">Lowest</div>
            <div className="text-sm font-extrabold text-fg">{agg.min ? `₹${formatINR(agg.min)}` : "—"}</div>
          </div>
          <div className="rounded-xl bg-card2 px-2.5 py-2">
            <div className="text-[9px] font-bold uppercase tracking-wide text-muted">Average</div>
            <div className="text-sm font-extrabold text-fg">{agg.avg ? `₹${formatINR(agg.avg)}` : "—"}</div>
          </div>
          <div className="rounded-xl bg-accent-soft px-2.5 py-2">
            <div className="text-[9px] font-bold uppercase tracking-wide text-accent">Plan around</div>
            <div className="text-sm font-extrabold text-accent">{agg.recommended ? `₹${formatINR(agg.recommended)}` : "—"}</div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {agg.responses.map((r) => (
            <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card2 py-0.5 pl-0.5 pr-2 text-[10px] font-semibold text-muted">
              <Avatar name={r.name} size={18} />
              {r.name.split(" ")[0]}
              {r.status === "responded" ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{formatINR(r.amount ?? 0)}</span>
              ) : (
                <span className="text-[9px] text-muted">pending</span>
              )}
            </span>
          ))}
        </div>

        {agg.min && agg.max && agg.min !== agg.max && (
          <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted">
            <TrendingDown size={11} className="mt-0.5 shrink-0 text-accent" />
            Range ₹{formatINR(agg.min)}–₹{formatINR(agg.max)}. We plan to the lowest comfortable amount so no one is stretched.
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Ask your group"
        description="Everyone shares a comfortable total. The AI plans around the group's comfort zone — not just the highest bidder."
        size="md"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-2.5 text-xs text-muted">
              <Link2 size={14} className="shrink-0 text-accent" />
              <span className="truncate">{link}</span>
            </div>
            <Button size="sm" onClick={copy} className="shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white hover:brightness-95">
              <MessageCircle size={16} /> WhatsApp
            </a>
            <a href={mailto} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-sm font-bold text-fg hover:bg-card2">
              <Mail size={16} /> Email
            </a>
          </div>

          <div className="rounded-2xl border border-line bg-card2/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">Responses</div>
              <button onClick={simulate} className="text-[11px] font-bold text-accent hover:underline">
                Preview replies (demo)
              </button>
            </div>
            <div className="space-y-2">
              {responses.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Avatar name={r.name} size={26} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-fg">{r.name}</div>
                    <div className="text-[10px] text-muted">{r.role}</div>
                  </div>
                  {r.status === "responded" ? (
                    <div className="text-sm font-extrabold text-fg">₹{formatINR(r.amount ?? 0)}</div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-muted">Set</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        placeholder="₹"
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (n > 0) updateAmount(r.id, n);
                        }}
                        className="w-20 rounded-lg border border-line bg-card px-2 py-1 text-xs font-bold text-fg outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-muted">Your comfortable total</span>
              <span className="font-bold text-fg">₹{formatINR(myBudget)}</span>
            </div>
            <Range
              value={myBudget}
              min={5000}
              max={500000}
              step={2500}
              onChange={(v) => {
                setMyBudget(v);
                if (responses[0]) updateAmount(responses[0].id, v);
              }}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-[11px] leading-relaxed text-accent">
            <Sparkles size={13} className="mt-0.5 shrink-0" />
            <span>
              The agent gets the group range, average and comfort floor, then adjusts stays, meals and activities. It will
              never suggest a plan above the lowest comfort budget without warning.
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card2 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <IndianRupee size={13} className="text-accent" />
              <span className="text-muted">Plan around</span>
              <span className="font-extrabold text-fg">{agg.recommended ? `₹${formatINR(agg.recommended)}` : "—"}</span>
            </div>
            <Button size="sm" onClick={apply} disabled={!agg.recommended}>
              Apply to trip
            </Button>
          </div>

          <div className="flex items-start gap-1.5 text-[10px] text-muted">
            <Info size={11} className="mt-0.5 shrink-0" />
            Preview replies are a demo. In production each traveller opens the link and submits their own budget.
          </div>
        </div>
      </Modal>
    </>
  );
}
