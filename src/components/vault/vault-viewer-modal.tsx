"use client";

import { useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Lock,
  Shield,
  Clock,
  Share2,
  ExternalLink,
  WifiOff,
} from "lucide-react";
import type { VaultDocument } from "@/lib/vault/types";
import { Modal, Button, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";

interface Props {
  doc: VaultDocument | null;
  onClose: () => void;
  onShare: (doc: VaultDocument) => void;
}

export function VaultViewerModal({ doc, onClose, onShare }: Props) {
  const { logAudit } = useVault();
  const { toast } = useApp();

  useEffect(() => {
    if (doc) {
      logAudit(doc.id, doc.name, "viewed");
    }
  }, [doc, logAudit]);

  if (!doc) return null;

  const handleDownload = () => {
    logAudit(doc.id, doc.name, "downloaded");
    toast("Downloaded", `Saved ${doc.name} to downloads`, "success");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal open={!!doc} onClose={onClose} title={doc.name} size="lg">
      <div className="space-y-4 pt-2">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Badge variant="soft" className="uppercase text-[11px]">
              {doc.category}
            </Badge>
            {doc.documentNumber && (
              <span className="font-mono text-xs font-semibold text-fg">
                #{doc.documentNumber}
              </span>
            )}
            {doc.isOffline && (
              <Badge variant="green" className="text-[10px]">
                <WifiOff size={10} /> Offline Ready
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Lock size={12} className="text-accent" />
            <span>Decrypted via Session Key</span>
          </div>
        </div>

        {/* Document Display Canvas */}
        <div className="relative min-h-[300px] w-full overflow-hidden rounded-2xl border border-line bg-card2 flex items-center justify-center p-4">
          {doc.previewThumbnail ? (
            <img
              src={doc.previewThumbnail}
              alt={doc.name}
              className="max-h-[420px] w-auto rounded-xl object-contain shadow-md"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center py-10">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent-soft text-accent">
                <FileText size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-fg">{doc.name}</p>
                <p className="text-xs text-muted font-mono mt-1">
                  Type: {doc.mimeType} · Size: {Math.round(doc.fileSize / 1024)} KB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-line bg-card2/40 p-3 text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted">Trip Link</p>
            <p className="font-semibold text-fg mt-0.5">{doc.tripName || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted">Expiry Date</p>
            <p className="font-semibold text-fg mt-0.5">{doc.expiryDate || "Does not expire"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted">Security</p>
            <p className="font-semibold text-accent mt-0.5">AES-256 Encrypted</p>
          </div>
        </div>

        {doc.notes && (
          <div className="rounded-xl border border-line bg-card2/60 p-3 text-xs text-fg">
            <p className="text-[10px] uppercase font-bold text-muted mb-1">Notes & Details</p>
            <p>{doc.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-line pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onClose();
              onShare(doc);
            }}
          >
            <Share2 size={13} />
            <span>Generate Expiring Link</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={13} />
              <span>Print</span>
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download size={13} />
              <span>Export File</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

