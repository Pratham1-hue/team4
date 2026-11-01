"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  Shield,
  WifiOff,
  Share2,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Lock,
  Download,
  Building,
  Plane,
  CreditCard,
  HeartPulse,
} from "lucide-react";
import type { VaultDocument } from "@/lib/vault/types";
import { Badge, Button, IconButton } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

interface Props {
  doc: VaultDocument;
  onView: (doc: VaultDocument) => void;
  onShare: (doc: VaultDocument) => void;
  onDelete: (doc: VaultDocument) => void;
}

export function VaultDocumentCard({ doc, onView, onShare, onDelete }: Props) {
  const { toggleOffline } = useVault();
  const { toast } = useApp();
  const [isUpdatingOffline, setIsUpdatingOffline] = useState(false);

  // Expiry calculation
  let expiryInfo: { label: string; variant: "green" | "gold" | "red" | "soft"; urgent?: boolean } | null = null;
  if (doc.expiryDate) {
    const target = new Date(doc.expiryDate).getTime();
    const diffDays = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expiryInfo = { label: `Expired ${Math.abs(diffDays)}d ago`, variant: "red", urgent: true };
    } else if (diffDays <= 7) {
      expiryInfo = { label: `Expires in ${diffDays} days!`, variant: "red", urgent: true };
    } else if (diffDays <= 30) {
      expiryInfo = { label: `Expires in ${diffDays} days`, variant: "gold", urgent: true };
    } else if (diffDays <= 90) {
      expiryInfo = { label: `Expires in ${diffDays} days`, variant: "soft" };
    } else {
      expiryInfo = { label: `Valid (${diffDays}d)`, variant: "green" };
    }
  }

  const categoryIcons = {
    identity: CreditCard,
    tickets: Plane,
    stay: Building,
    insurance: HeartPulse,
    other: FileText,
  };
  const CategoryIcon = categoryIcons[doc.category] || FileText;

  const handleToggleOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatingOffline(true);
    try {
      const state = await toggleOffline(doc.id);
      toast(
        state ? "Saved for offline access" : "Removed from offline cache",
        state ? "Encrypted copy saved to device storage" : "Document will require connection",
        "info"
      );
    } finally {
      setIsUpdatingOffline(false);
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-line/80 bg-card p-4 transition-all duration-200 hover:border-accent/50 hover:shadow-lg">
      <div>
        {/* Header: Category & Expiry Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-soft text-accent">
              <CategoryIcon size={14} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {doc.category}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {expiryInfo && (
              <Badge variant={expiryInfo.variant} className="text-[10px]">
                {expiryInfo.urgent && <AlertTriangle size={10} className="animate-pulse" />}
                {expiryInfo.label}
              </Badge>
            )}

            {doc.isOffline && (
              <span
                title="Available offline (encrypted)"
                className="grid h-6 w-6 place-items-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <WifiOff size={11} />
              </span>
            )}
          </div>
        </div>

        {/* Thumbnail or File Preview */}
        {doc.previewThumbnail ? (
          <div
            onClick={() => onView(doc)}
            className="relative mb-3 h-28 w-full overflow-hidden rounded-xl border border-line bg-card2 cursor-pointer group-hover:opacity-95 transition-opacity"
          >
            <img
              src={doc.previewThumbnail}
              alt={doc.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
              <span className="text-[11px] font-semibold text-white flex items-center gap-1">
                <Eye size={12} /> Decrypt & View
              </span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => onView(doc)}
            className="mb-3 flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-line bg-card2/50 cursor-pointer hover:bg-card2 transition-colors"
          >
            <div className="flex items-center gap-2 text-muted">
              <FileText size={20} className="text-accent" />
              <span className="text-xs font-medium">Click to Decrypt Document</span>
            </div>
          </div>
        )}

        {/* Title and Details */}
        <h3
          onClick={() => onView(doc)}
          className="text-sm font-bold text-fg cursor-pointer hover:text-accent line-clamp-1"
        >
          {doc.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
          {doc.documentNumber && (
            <span className="font-mono font-medium text-fg/80">#{doc.documentNumber}</span>
          )}
          {doc.tripName && (
            <span className="rounded-md bg-card2 px-1.5 py-0.5 text-accent font-medium">
              {doc.tripName}
            </span>
          )}
        </div>

        {doc.notes && (
          <p className="mt-2 text-[11px] text-muted line-clamp-2 leading-relaxed">
            {doc.notes}
          </p>
        )}
      </div>

      {/* Card Actions */}
      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="soft"
            onClick={() => onView(doc)}
            className="h-8 px-2.5 text-xs"
          >
            <Eye size={13} />
            <span>View</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onShare(doc)}
            className="h-8 px-2.5 text-xs"
          >
            <Share2 size={13} />
            <span>Share</span>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            onClick={handleToggleOffline}
            disabled={isUpdatingOffline}
            title={doc.isOffline ? "Remove from offline storage" : "Make available offline"}
            className={cn(
              "h-8 w-8 text-xs",
              doc.isOffline
                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                : "text-muted hover:text-fg"
            )}
          >
            <WifiOff size={13} />
          </IconButton>

          <IconButton
            onClick={() => onDelete(doc)}
            title="Permanent Delete"
            className="h-8 w-8 text-xs text-muted hover:text-danger hover:border-danger/30"
          >
            <Trash2 size={13} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

