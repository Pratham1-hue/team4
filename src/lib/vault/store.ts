"use client";

import { create } from "zustand";
import type {
  VaultDocument,
  VaultAuditEntry,
  VaultShareLink,
  VaultCategory,
  VaultAuditAction,
} from "./types";
import { hashPin, verifyPin, isBiometricsAvailable } from "./crypto";
import { storeOfflineDocument, removeOfflineDocument } from "./storage";
import { uid } from "@/lib/utils";

const VAULT_STORAGE_KEY = "yatri_vault_state_v1";

// Demo initial documents with realistic travel docs
const DEMO_DOCUMENTS: VaultDocument[] = [
  {
    id: "doc-passport-01",
    name: "Republic of India Passport",
    category: "identity",
    tripId: "trip-jaipur",
    tripName: "Royal Rajasthan Circuit",
    fileType: "image",
    fileSize: 1024 * 780, // ~780KB
    encryptedData: "DEMO_ENCRYPTED_PASSPORT_DATA",
    iv: "sample_iv",
    salt: "sample_salt",
    mimeType: "image/jpeg",
    previewThumbnail: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    expiryDate: new Date(Date.now() + 84 * 86400000).toISOString().slice(0, 10), // ~84 days (warn 90)
    documentNumber: "Z6849201",
    issuingCountry: "India",
    isOffline: true,
    notes: "Main international passport. Renew before next trip.",
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "doc-flight-indigo",
    name: "IndiGo 6E-204 New Delhi (DEL) to Jaipur (JAI)",
    category: "tickets",
    tripId: "trip-jaipur",
    tripName: "Royal Rajasthan Circuit",
    fileType: "pdf",
    fileSize: 1024 * 420,
    encryptedData: "DEMO_ENCRYPTED_TICKET_DATA",
    iv: "sample_iv",
    salt: "sample_salt",
    mimeType: "application/pdf",
    previewThumbnail: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80",
    expiryDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10), // 5 days (urgent)
    documentNumber: "PNR-6E941A",
    issuingCountry: "India",
    isOffline: true,
    notes: "Terminal 3, Seat 12F (Window). Boarding time 07:15 AM.",
    createdAt: "2026-10-20T14:30:00Z",
    updatedAt: "2026-10-20T14:30:00Z",
  },
  {
    id: "doc-stay-rambagh",
    name: "Rambagh Palace Hotel Confirmation",
    category: "stay",
    tripId: "trip-jaipur",
    tripName: "Royal Rajasthan Circuit",
    fileType: "pdf",
    fileSize: 1024 * 310,
    encryptedData: "DEMO_ENCRYPTED_HOTEL_DATA",
    iv: "sample_iv",
    salt: "sample_salt",
    mimeType: "application/pdf",
    previewThumbnail: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
    expiryDate: new Date(Date.now() + 18 * 86400000).toISOString().slice(0, 10),
    documentNumber: "HTL-RB-8812",
    issuingCountry: "India",
    isOffline: false,
    notes: "Heritage Suite, complimentary breakfast included. Check-in 14:00.",
    createdAt: "2026-10-22T09:15:00Z",
    updatedAt: "2026-10-22T09:15:00Z",
  },
  {
    id: "doc-insurance-tata",
    name: "Tata AIG Comprehensive Travel Protect",
    category: "insurance",
    tripId: "trip-jaipur",
    tripName: "Royal Rajasthan Circuit",
    fileType: "pdf",
    fileSize: 1024 * 650,
    encryptedData: "DEMO_ENCRYPTED_INSURANCE_DATA",
    iv: "sample_iv",
    salt: "sample_salt",
    mimeType: "application/pdf",
    previewThumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    expiryDate: new Date(Date.now() + 25 * 86400000).toISOString().slice(0, 10), // 25 days (<30d)
    documentNumber: "POL-019948271",
    issuingCountry: "India",
    isOffline: true,
    notes: "Emergency 24x7 Helpline: +91 1800 266 7780. Covers baggage delay & medical.",
    createdAt: "2026-10-25T11:00:00Z",
    updatedAt: "2026-10-25T11:00:00Z",
  },
  {
    id: "doc-rail-irctc",
    name: "IRCTC Vande Bharat Express Ticket (12015)",
    category: "tickets",
    tripId: "trip-jaipur",
    tripName: "Royal Rajasthan Circuit",
    fileType: "pdf",
    fileSize: 1024 * 280,
    encryptedData: "DEMO_ENCRYPTED_TRAIN_DATA",
    iv: "sample_iv",
    salt: "sample_salt",
    mimeType: "application/pdf",
    previewThumbnail: "https://images.unsplash.com/photo-1532105956626-9569c03602f6?w=600&auto=format&fit=crop&q=80",
    expiryDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    documentNumber: "PNR-2481928371",
    issuingCountry: "India",
    isOffline: true,
    notes: "Coach C3, Seat 45, 46. Executive Chair Car.",
    createdAt: "2026-10-27T16:20:00Z",
    updatedAt: "2026-10-27T16:20:00Z",
  },
];

const DEMO_AUDIT_LOGS: VaultAuditEntry[] = [
  {
    id: "audit-01",
    documentId: "doc-passport-01",
    documentName: "Republic of India Passport",
    action: "created",
    timestamp: "2026-08-15T10:00:00Z",
    userName: "Pratham Prajapati",
    device: "iPhone 15 Pro · Safari",
  },
  {
    id: "audit-02",
    documentId: "doc-passport-01",
    documentName: "Republic of India Passport",
    action: "viewed",
    timestamp: "2026-10-18T12:30:00Z",
    userName: "Pratham Prajapati",
    device: "MacBook Air · Chrome",
  },
  {
    id: "audit-03",
    documentId: "doc-flight-indigo",
    documentName: "IndiGo 6E-204 New Delhi (DEL) to Jaipur (JAI)",
    action: "offline_toggled",
    timestamp: "2026-10-20T14:32:00Z",
    userName: "Pratham Prajapati",
    device: "iPhone 15 Pro",
  },
];

interface VaultState {
  isLocked: boolean;
  hasPin: boolean;
  pinHash: string | null;
  salt: string | null;
  biometricsSupported: boolean;
  biometricsEnabled: boolean;
  biometricCredentialId: string | null;
  documents: VaultDocument[];
  auditLogs: VaultAuditEntry[];
  sharedLinks: Record<string, VaultShareLink>;
  currentPinSession: string | null; // stored in memory only while unlocked

  // Actions
  hydrateVault: () => Promise<void>;
  setupPin: (pin: string, enableBiometrics?: boolean, credentialId?: string) => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lockVault: () => void;
  addDocument: (doc: Omit<VaultDocument, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateDocument: (id: string, patch: Partial<VaultDocument>) => void;
  deleteDocument: (id: string) => Promise<boolean>;
  toggleOffline: (id: string) => Promise<boolean>;
  logAudit: (docId: string, docName: string, action: VaultAuditAction) => void;
  createShareLink: (docId: string, docName: string, durationHours: number) => VaultShareLink;
}

export const useVault = create<VaultState>((set, get) => ({
  isLocked: true,
  hasPin: false,
  pinHash: null,
  salt: null,
  biometricsSupported: false,
  biometricsEnabled: false,
  biometricCredentialId: null,
  documents: DEMO_DOCUMENTS,
  auditLogs: DEMO_AUDIT_LOGS,
  sharedLinks: {},
  currentPinSession: null,

  hydrateVault: async () => {
    if (typeof window === "undefined") return;

    const bioSupported = await isBiometricsAvailable();
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          hasPin: !!parsed.pinHash,
          pinHash: parsed.pinHash || null,
          salt: parsed.salt || null,
          biometricsSupported: bioSupported,
          biometricsEnabled: !!parsed.biometricsEnabled,
          biometricCredentialId: parsed.biometricCredentialId || null,
          documents: Array.isArray(parsed.documents) && parsed.documents.length ? parsed.documents : DEMO_DOCUMENTS,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : DEMO_AUDIT_LOGS,
          sharedLinks: parsed.sharedLinks || {},
        });
        return;
      }
    } catch {
      // ignore
    }

    // Default demo setup: PIN "1234"
    const { hash, salt } = await hashPin("1234");
    set({
      hasPin: true,
      pinHash: hash,
      salt: salt,
      biometricsSupported: bioSupported,
      documents: DEMO_DOCUMENTS,
      auditLogs: DEMO_AUDIT_LOGS,
    });
  },

  setupPin: async (pin: string, enableBiometrics = false, credentialId) => {
    const { hash, salt } = await hashPin(pin);
    const update = {
      hasPin: true,
      pinHash: hash,
      salt: salt,
      biometricsEnabled: enableBiometrics,
      biometricCredentialId: credentialId || null,
      isLocked: false,
      currentPinSession: pin,
    };
    set(update);
    persistState(get());
    return true;
  },

  unlockWithPin: async (pin: string) => {
    const { pinHash, salt } = get();
    if (!pinHash || !salt) {
      // If no pin configured yet, allow setting
      await get().setupPin(pin);
      return true;
    }

    const isValid = await verifyPin(pin, pinHash, salt);
    if (isValid) {
      set({ isLocked: false, currentPinSession: pin });
      return true;
    }
    return false;
  },

  unlockWithBiometrics: async () => {
    const { biometricCredentialId } = get();
    if (!biometricCredentialId) return false;
    // Authenticate and unlock
    set({ isLocked: false });
    return true;
  },

  lockVault: () => {
    set({ isLocked: true, currentPinSession: null });
  },

  addDocument: async (docData) => {
    const id = uid("doc");
    const now = new Date().toISOString();
    const doc: VaultDocument = {
      ...docData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (doc.isOffline) {
      await storeOfflineDocument(doc.id, {
        encryptedData: doc.encryptedData,
        iv: doc.iv,
        salt: doc.salt,
        mimeType: doc.mimeType,
        name: doc.name,
      });
    }

    const documents = [doc, ...get().documents];
    set({ documents });
    get().logAudit(id, doc.name, "created");
    persistState(get());
    return id;
  },

  updateDocument: (id, patch) => {
    const documents = get().documents.map((d) =>
      d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
    );
    set({ documents });
    persistState(get());
  },

  deleteDocument: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return false;

    await removeOfflineDocument(id);
    const documents = get().documents.filter((d) => d.id !== id);
    set({ documents });
    get().logAudit(id, doc.name, "deleted");
    persistState(get());
    return true;
  },

  toggleOffline: async (id) => {
    const doc = get().documents.find((d) => d.id === id);
    if (!doc) return false;

    const nextOffline = !doc.isOffline;
    if (nextOffline) {
      await storeOfflineDocument(doc.id, {
        encryptedData: doc.encryptedData,
        iv: doc.iv,
        salt: doc.salt,
        mimeType: doc.mimeType,
        name: doc.name,
      });
    } else {
      await removeOfflineDocument(doc.id);
    }

    get().updateDocument(id, { isOffline: nextOffline });
    get().logAudit(id, doc.name, "offline_toggled");
    return nextOffline;
  },

  logAudit: (docId, docName, action) => {
    const entry: VaultAuditEntry = {
      id: uid("audit"),
      documentId: docId,
      documentName: docName,
      action,
      timestamp: new Date().toISOString(),
      userName: "Pratham Prajapati",
      device: typeof window !== "undefined" ? (window.innerWidth < 768 ? "Mobile Device" : "Desktop Browser") : "Web",
    };
    const auditLogs = [entry, ...get().auditLogs.slice(0, 99)];
    set({ auditLogs });
    persistState(get());
  },

  createShareLink: (docId, docName, durationHours) => {
    const token = "vsh_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
    const link: VaultShareLink = {
      token,
      documentId: docId,
      documentName: docName,
      createdAt: new Date().toISOString(),
      expiresAt,
      accessCount: 0,
    };

    const sharedLinks = { ...get().sharedLinks, [token]: link };
    set({ sharedLinks });
    get().logAudit(docId, docName, "share_created");
    persistState(get());
    return link;
  },
}));

function persistState(state: VaultState) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      hasPin: state.hasPin,
      pinHash: state.pinHash,
      salt: state.salt,
      biometricsEnabled: state.biometricsEnabled,
      biometricCredentialId: state.biometricCredentialId,
      documents: state.documents,
      auditLogs: state.auditLogs,
      sharedLinks: state.sharedLinks,
    };
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota exceeded or private mode
  }
}

