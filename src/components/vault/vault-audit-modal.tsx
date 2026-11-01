"use client";

import { useState } from "react";
import {
  Shield,
  Eye,
  Download,
  Share2,
  Trash2,
  WifiOff,
  Clock,
  User,
  Laptop,
  CheckCircle2,
} from "lucide-react";
import type { VaultAuditEntry, VaultAuditAction } from "@/lib/vault/types";
import { Modal, Button, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function VaultAuditModal({ open, onClose }: Props) {
  const { auditLogs } = useVault();
  const [filterAction, setFilterAction] = useState<string>("all");

  const actionIcons: Record<VaultAuditAction, { icon: typeof Eye; label: string; color: string }> = {
    created: { icon: CheckCircle2, label: "Document Added", color: "text-emerald-500 bg-emerald-500/10" },
    viewed: { icon: Eye, label: "Decrypted & Viewed", color: "text-blue-500 bg-blue-500/10" },
    downloaded: { icon: Download, label: "Exported / Downloaded", color: "text-purple-500 bg-purple-500/10" },
    share_created: { icon: Share2, label: "Expiring Link Created", color: "text-accent bg-accent/10" },
    share_accessed: { icon: Share2, label: "Share Link Accessed", color: "text-amber-500 bg-amber-500/10" },
    offline_toggled: { icon: WifiOff, label: "Offline Cache Toggled", color: "text-teal-500 bg-teal-500/10" },
    deleted: { icon: Trash2, label: "Permanently Deleted", color: "text-danger bg-danger/10" },
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction === "all") return true;
    return log.action === filterAction;
  });

  return (
    <Modal open={open} onClose={onClose} title="Vault Security & Audit Log" size="lg">
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Immutable log of all interactions, views, downloads, and shares with your vault documents.
          </p>
          <Badge variant="soft" className="text-[10px]">
            {auditLogs.length} events logged
          </Badge>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap gap-1.5 border-b border-line pb-3">
          {["all", "viewed", "downloaded", "share_created", "deleted"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                filterAction === act
                  ? "bg-accent text-accent-fg"
                  : "bg-card2 text-muted hover:text-fg"
              }`}
            >
              {act === "all" ? "All Events" : act.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Audit Log Timeline */}
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No audit records match the current filter.
            </div>
          ) : (
            filteredLogs.map((entry) => {
              const meta = actionIcons[entry.action] || actionIcons.viewed;
              const Icon = meta.icon;

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-xl border border-line/70 bg-card p-3 text-xs transition-colors hover:border-accent/40"
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${meta.color}`}>
                    <Icon size={15} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-fg truncate">{entry.documentName}</p>
                      <span className="text-[10px] text-muted whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                      <span className="font-semibold text-accent">{meta.label}</span>
                      <span className="flex items-center gap-1">
                        <User size={11} /> {entry.userName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Laptop size={11} /> {entry.device}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
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

