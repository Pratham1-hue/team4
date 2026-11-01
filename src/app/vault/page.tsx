"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Plus,
  Lock,
  Search,
  History,
  AlertTriangle,
  WifiOff,
  Filter,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";
import type { VaultCategory, VaultDocument } from "@/lib/vault/types";
import { VaultLockScreen } from "@/components/vault/vault-lock-screen";
import { VaultDocumentCard } from "@/components/vault/vault-document-card";
import { VaultUploadModal } from "@/components/vault/vault-upload-modal";
import { VaultViewerModal } from "@/components/vault/vault-viewer-modal";
import { VaultShareModal } from "@/components/vault/vault-share-modal";
import { VaultAuditModal } from "@/components/vault/vault-audit-modal";
import { Button, IconButton, Badge, Modal, Input } from "@/components/ui";

export default function VaultPage() {
  const { isLocked, documents, hydrateVault, lockVault, deleteDocument } = useVault();
  const { trips, toast } = useApp();

  const [activeCategory, setActiveCategory] = useState<VaultCategory | "all">("all");
  const [selectedTrip, setSelectedTrip] = useState<string>("all");
  const [offlineOnly, setOfflineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<VaultDocument | null>(null);
  const [sharingDoc, setSharingDoc] = useState<VaultDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<VaultDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    hydrateVault();
  }, [hydrateVault]);

  // Expiry reminders calculation (90, 30, 7 days)
  const expiryReminders = useMemo(() => {
    const critical: VaultDocument[] = [];
    const urgent: VaultDocument[] = [];
    const upcoming: VaultDocument[] = [];

    documents.forEach((doc) => {
      if (!doc.expiryDate) return;
      const diffDays = Math.ceil(
        (new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays <= 7) {
        critical.push(doc);
      } else if (diffDays <= 30) {
        urgent.push(doc);
      } else if (diffDays <= 90) {
        upcoming.push(doc);
      }
    });

    return { critical, urgent, upcoming, total: critical.length + urgent.length + upcoming.length };
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      if (activeCategory !== "all" && doc.category !== activeCategory) return false;
      if (selectedTrip !== "all" && doc.tripId !== selectedTrip) return false;
      if (offlineOnly && !doc.isOffline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.name.toLowerCase().includes(q);
        const matchesNumber = doc.documentNumber?.toLowerCase().includes(q);
        const matchesNotes = doc.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesNumber && !matchesNotes) return false;
      }
      return true;
    });
  }, [documents, activeCategory, selectedTrip, offlineOnly, searchQuery]);

  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;
    setIsDeleting(true);
    try {
      await deleteDocument(deletingDoc.id);
      toast("Document permanently deleted", `${deletingDoc.name} was removed from vault`, "info");
      setDeletingDoc(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // If vault is locked, display the PIN & biometric lock screen
  if (isLocked) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-20">
        <VaultLockScreen />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-fg shadow-md">
              <Shield size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">Travel Vault</h1>
                <Badge variant="green" className="text-[10px]">
                  <Lock size={10} /> Unlocked · AES-256
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Passports, visas, flight tickets, hotel vouchers & IDs protected with zero-knowledge encryption.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)}>
            <History size={14} />
            <span className="hidden sm:inline">Audit Log</span>
          </Button>

          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus size={15} />
            <span>Add Document</span>
          </Button>

          <Button variant="ghost" size="sm" onClick={lockVault} title="Lock Vault Now">
            <Lock size={14} className="text-muted hover:text-accent" />
            <span className="hidden sm:inline">Lock</span>
          </Button>
        </div>
      </div>

      {/* Expiry Tracking Banner */}
      {expiryReminders.total > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={18} />
              </span>
              <div>
                <p className="text-xs font-bold text-fg">Document Expiry Tracking Active</p>
                <p className="text-[11px] text-muted">
                  {expiryReminders.critical.length > 0 && (
                    <span className="text-danger font-semibold">
                      {expiryReminders.critical.length} critical (&lt;7 days) ·{" "}
                    </span>
                  )}
                  {expiryReminders.urgent.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {expiryReminders.urgent.length} urgent (&lt;30 days) ·{" "}
                    </span>
                  )}
                  {expiryReminders.upcoming.length > 0 && (
                    <span>{expiryReminders.upcoming.length} upcoming (&lt;90 days)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted">Auto-reminders enabled</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-1 sm:pb-0 gap-1.5 scrollbar-none">
          {[
            { id: "all", label: "All Docs" },
            { id: "identity", label: "Identity" },
            { id: "tickets", label: "Tickets" },
            { id: "stay", label: "Stay" },
            { id: "insurance", label: "Insurance" },
            { id: "other", label: "Other" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as VaultCategory | "all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? "bg-accent text-accent-fg shadow-sm"
                  : "bg-card border border-line text-muted hover:text-fg hover:border-accent/40"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Trip Filter & Offline Switch */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents or PNR..."
              className="h-9 w-full rounded-xl border border-line bg-card pl-8 pr-3 text-xs text-fg focus:border-accent focus:outline-none"
            />
          </div>

          <select
            value={selectedTrip}
            onChange={(e) => setSelectedTrip(e.target.value)}
            className="h-9 rounded-xl border border-line bg-card px-2.5 text-xs text-fg focus:border-accent focus:outline-none"
          >
            <option value="all">All Trips</option>
            {trips.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOfflineOnly((o) => !o)}
            className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-all ${
              offlineOnly
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-line bg-card text-muted hover:text-fg"
            }`}
          >
            <WifiOff size={13} />
            <span className="hidden sm:inline">Offline Available</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="mt-6">
        {filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-card2/50 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-card border border-line text-muted">
              <Shield size={26} />
            </div>
            <h3 className="mt-3 text-sm font-bold text-fg">No documents found</h3>
            <p className="mt-1 text-xs text-muted max-w-sm">
              {searchQuery || activeCategory !== "all" || offlineOnly
                ? "Try adjusting your search query or filters"
                : "Upload your passport, flight tickets, or hotel bookings to keep them safe & offline ready."}
            </p>
            <Button size="sm" className="mt-4" onClick={() => setUploadOpen(true)}>
              <Plus size={14} />
              <span>Add Document</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <VaultDocumentCard
                key={doc.id}
                doc={doc}
                onView={(d) => setViewingDoc(d)}
                onShare={(d) => setSharingDoc(d)}
                onDelete={(d) => setDeletingDoc(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <VaultUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        defaultTripId={selectedTrip !== "all" ? selectedTrip : undefined}
      />

      <VaultViewerModal
        doc={viewingDoc}
        onClose={() => setViewingDoc(null)}
        onShare={(d) => setSharingDoc(d)}
      />

      <VaultShareModal doc={sharingDoc} onClose={() => setSharingDoc(null)} />

      <VaultAuditModal open={auditOpen} onClose={() => setAuditOpen(false)} />

      {/* Permanent Delete Confirmation Dialog */}
      <Modal
        open={!!deletingDoc}
        onClose={() => setDeletingDoc(null)}
        title="Permanently Delete Document?"
        size="sm"
      >
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted">
            Are you sure you want to permanently delete{" "}
            <strong className="text-fg">{deletingDoc?.name}</strong>?
          </p>
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
            <p className="font-semibold">Irreversible Action</p>
            <p className="mt-0.5 text-[11px]">
              This will immediately purge the encrypted file and remove all offline device caches.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <Button variant="outline" size="sm" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
            >
              <Trash2 size={13} />
              <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

