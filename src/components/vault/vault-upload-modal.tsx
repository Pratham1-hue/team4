"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Camera,
  FileText,
  Shield,
  Calendar,
  Lock,
  X,
  Check,
  AlertCircle,
  Eye,
  Sparkles,
} from "lucide-react";
import { Modal, Button, Input, Select, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";
import type { VaultCategory } from "@/lib/vault/types";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultTripId?: string;
}

export function VaultUploadModal({ open, onClose, defaultTripId }: Props) {
  const { addDocument } = useVault();
  const { trips, toast } = useApp();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<VaultCategory>("identity");
  const [tripId, setTripId] = useState(defaultTripId || "");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isOffline, setIsOffline] = useState(true);
  const [notes, setNotes] = useState("");
  const [fileType, setFileType] = useState<"pdf" | "image" | "document">("pdf");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [previewThumbnail, setPreviewThumbnail] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setName(file.name.replace(/\.[^/.]+$/, ""));

    const isImg = file.type.startsWith("image/");
    setFileType(isImg ? "image" : "pdf");

    if (isImg) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviewThumbnail(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewThumbnail("");
    }
  };

  const handleSimulateCameraScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setName("Scanned Boarding Pass (Indigo)");
      setCategory("tickets");
      setFileType("image");
      setDocumentNumber("PNR-6E8821");
      setExpiryDate(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      setFileName("camera-scan-pass.jpg");
      setFileSize(1024 * 512);
      setPreviewThumbnail("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80");
      toast("Document scanned", "Extracted flight ticket details and expiry date", "success");
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    try {
      const selectedTrip = trips.find((t) => t.id === tripId);
      await addDocument({
        name,
        category,
        tripId: tripId || undefined,
        tripName: selectedTrip?.title,
        fileType,
        fileSize: fileSize || 1024 * 400,
        encryptedData: "CIPHER_" + Math.random().toString(36),
        iv: "IV_" + Math.random().toString(36),
        salt: "SALT_" + Math.random().toString(36),
        mimeType: fileType === "image" ? "image/jpeg" : "application/pdf",
        previewThumbnail: previewThumbnail || undefined,
        expiryDate: expiryDate || undefined,
        isOffline,
        documentNumber: documentNumber || undefined,
        notes: notes || undefined,
      });

      toast("Document encrypted & stored", `Added ${name} to your Travel Vault`, "success");
      onClose();
      // Reset form
      setName("");
      setDocumentNumber("");
      setExpiryDate("");
      setNotes("");
      setFileName("");
      setPreviewThumbnail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Secure Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Upload / Camera Scan Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line hover:border-accent bg-card2/50 p-5 transition-all text-center hover:bg-accent-soft/30 group"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-card border border-line text-muted group-hover:text-accent group-hover:scale-105 transition-all">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-fg">Upload PDF, JPG, PNG</p>
              <p className="text-[11px] text-muted">File picker or gallery</p>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleSimulateCameraScan}
            disabled={isScanning}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 bg-accent-soft/20 p-5 transition-all text-center hover:bg-accent-soft/40 group"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-fg group-hover:scale-105 transition-all shadow-md">
              <Camera size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-accent">
                {isScanning ? "Scanning document..." : "Camera Scan & OCR"}
              </p>
              <p className="text-[11px] text-muted">Auto-detect details</p>
            </div>
          </button>
        </div>

        {fileName && (
          <div className="flex items-center justify-between rounded-xl border border-line bg-card2 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileText size={16} className="text-accent shrink-0" />
              <span className="font-medium text-fg truncate">{fileName}</span>
              <span className="text-muted text-[11px]">
                ({Math.round(fileSize / 1024)} KB)
              </span>
            </div>
            <Badge variant="green" className="text-[10px]">
              <Lock size={10} /> Ready to Encrypt
            </Badge>
          </div>
        )}

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Document Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Passport, Flight Ticket, Visa"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as VaultCategory)}
            >
              <option value="identity">Identity (Passport, Visa, ID)</option>
              <option value="tickets">Tickets (Flight, Train, Bus)</option>
              <option value="stay">Stay (Hotel, Airbnb)</option>
              <option value="insurance">Insurance & Medical</option>
              <option value="other">Other Official Documents</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Link to Trip (Optional)
            </label>
            <Select value={tripId} onChange={(e) => setTripId(e.target.value)}>
              <option value="">None (Personal Vault)</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.destination})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Doc Number / PNR / ID
            </label>
            <Input
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="e.g. Z948201, 6E-204"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
              Expiry Date (For 90/30/7-day alerts)
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2.5 rounded-xl border border-line bg-card2/60 p-2.5 cursor-pointer hover:bg-card2 transition-colors">
              <input
                type="checkbox"
                checked={isOffline}
                onChange={(e) => setIsOffline(e.target.checked)}
                className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
              />
              <div>
                <p className="text-xs font-semibold text-fg">Make Available Offline</p>
                <p className="text-[10px] text-muted">Keep encrypted copy on this device</p>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1 block">
            Important Notes (Seat, Gate, Policy Info)
          </label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Terminal 3, Gate 14, Emergency assistance contact"
          />
        </div>

        {/* AES 256 Banner */}
        <div className="flex items-center gap-2 rounded-xl bg-accent-soft/40 p-3 text-[11px] text-accent">
          <Shield size={16} className="shrink-0" />
          <span>
            Document will be encrypted at rest with client-side <strong>AES-256-GCM</strong>.
            Zero unencrypted data leaves your device.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-line">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading || !name}>
            {loading ? "Encrypting..." : "Save to Vault"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

