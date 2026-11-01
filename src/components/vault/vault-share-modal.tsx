"use client";

import { useState } from "react";
import {
  Share2,
  Clock,
  Copy,
  Check,
  ShieldAlert,
  QrCode,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import type { VaultDocument, VaultShareLink } from "@/lib/vault/types";
import { Modal, Button, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";

interface Props {
  doc: VaultDocument | null;
  onClose: () => void;
}

export function VaultShareModal({ doc, onClose }: Props) {
  const { createShareLink } = useVault();
  const { toast } = useApp();
  const [duration, setDuration] = useState<number>(24); // default 24 hours
  const [activeLink, setActiveLink] = useState<VaultShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  if (!doc) return null;

  const handleGenerate = () => {
    const link = createShareLink(doc.id, doc.name, duration);
    setActiveLink(link);
    toast("Share link created", `Expires in ${duration} hours`, "success");
  };

  const getFullUrl = (token: string) => {
    if (typeof window === "undefined") return `/share/vault/${token}`;
    return `${window.location.origin}/share/vault/${token}`;
  };

  const handleCopy = () => {
    if (!activeLink) return;
    navigator.clipboard.writeText(getFullUrl(activeLink.token));
    setCopied(true);
    toast("Link copied", "Secure expiring link copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal open={!!doc} onClose={onClose} title="Secure Expiring Link" size="md">
      <div className="space-y-4 pt-2">
        <p className="text-xs text-muted">
          Generate a time-limited, encrypted access link for{" "}
          <strong className="text-fg">{doc.name}</strong>. The link will automatically self-destruct after the set duration.
        </p>

        {/* Expiration Duration Selection */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">
            Link Expiration Period
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { hours: 1, label: "1 Hour", sub: "Quick check-in" },
              { hours: 24, label: "24 Hours", sub: "Standard share" },
              { hours: 168, label: "7 Days", sub: "Full trip" },
            ].map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => {
                  setDuration(opt.hours);
                  setActiveLink(null);
                }}
                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                  duration === opt.hours
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line bg-card hover:bg-card2 text-fg"
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className="text-[10px] text-muted">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {!activeLink ? (
          <Button onClick={handleGenerate} className="w-full">
            <Share2 size={14} />
            <span>Generate Expiring Link</span>
          </Button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-accent/30 bg-accent-soft/20 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-bold text-accent">
                <ShieldCheck size={14} />
                <span>Active Signed Link</span>
              </span>
              <Badge variant="soft" className="text-[10px]">
                <Clock size={10} /> Expires {new Date(activeLink.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-line bg-card p-2 text-xs">
              <span className="truncate font-mono text-[11px] text-muted">
                {getFullUrl(activeLink.token)}
              </span>
              <Button size="sm" variant="soft" onClick={handleCopy} className="shrink-0 h-7 px-2.5">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>Access count: 0 views</span>
              <span>Audit logged on every view</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl border border-line bg-card2/60 p-2.5 text-[11px] text-muted">
          <ShieldAlert size={14} className="text-gold shrink-0" />
          <span>
            Every view or download through this link is logged in your Vault audit trail.
          </span>
        </div>

        <div className="flex justify-end pt-2 border-t border-line">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

