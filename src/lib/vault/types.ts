export type VaultCategory = "identity" | "tickets" | "stay" | "insurance" | "other";

export interface VaultCategoryConfig {
  id: VaultCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface VaultDocument {
  id: string;
  name: string;
  category: VaultCategory;
  tripId?: string;
  tripName?: string;
  fileType: "pdf" | "image" | "document";
  fileSize: number;
  encryptedData: string; // Base64 ciphertext
  iv: string; // Base64 IV
  salt: string; // Base64 salt
  mimeType: string;
  previewThumbnail?: string; // Optional thumbnail data URL
  expiryDate?: string; // ISO date string YYYY-MM-DD
  isOffline: boolean;
  documentNumber?: string; // Passport number, PNR, Booking ID
  issuingCountry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type VaultAuditAction =
  | "created"
  | "viewed"
  | "downloaded"
  | "share_created"
  | "share_accessed"
  | "offline_toggled"
  | "deleted";

export interface VaultAuditEntry {
  id: string;
  documentId: string;
  documentName: string;
  action: VaultAuditAction;
  timestamp: string;
  userName: string;
  device: string;
  ip?: string;
}

export interface VaultShareLink {
  token: string;
  documentId: string;
  documentName: string;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  maxAccess?: number;
}

export interface VaultPinSetup {
  pinHash: string;
  salt: string;
  biometricsEnabled: boolean;
  biometricsCredentialId?: string;
}

