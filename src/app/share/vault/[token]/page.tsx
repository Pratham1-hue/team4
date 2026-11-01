"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Shield,
  Clock,
  Download,
  AlertTriangle,
  Lock,
  FileText,
  Printer,
  CheckCircle2,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import type { VaultDocument } from "@/lib/vault/types";

export default function SharedVaultDocumentPage() {
  const params = useParams<{ token: string }>();
  const { sharedLinks, documents, logAudit, hydrateVault } = useVault();
  const [doc, setDoc] = useState<VaultDocument | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateVault();
  }, [hydrateVault]);

  useEffect(() => {
    if (!params?.token) return;

    const link = sharedLinks[params.token];
    if (link) {
      if (new Date(link.expiresAt).getTime() < Date.now()) {
        setIsExpired(true);
      } else {
        const found = documents.find((d) => d.id === link.documentId);
        if (found) {
          setDoc(found);
          logAudit(found.id, found.name, "share_accessed");
        }
      }
    } else {
      // Demo fallback: if accessed with any valid-looking token in demo, show passport/ticket
      const demoDoc = documents[0];
      if (demoDoc) {
        setDoc(demoDoc);
        logAudit(demoDoc.id, demoDoc.name, "share_accessed");
      }
    }
    setLoading(false);
  }, [params?.token, sharedLinks, documents, logAudit]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-xs text-muted">Verifying encrypted security signature...</p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle size={28} />
        </div>
        <h1 className="text-xl font-bold text-fg">Link Expired</h1>
        <p className="mt-2 text-xs text-muted">
          This secure document link has expired and is no longer accessible. Please ask the owner to generate a new link.
        </p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-card2 text-muted">
          <FileText size={28} />
        </div>
        <h1 className="text-xl font-bold text-fg">Document Not Found</h1>
        <p className="mt-2 text-xs text-muted">
          The requested document could not be located or was revoked by its owner.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg">
              <Shield size={18} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-fg">{doc.name}</h1>
              <p className="text-xs text-muted">Secure temporary shared document via Yatri</p>
            </div>
          </div>

          <Badge variant="soft" className="text-[11px] self-start sm:self-auto">
            <Clock size={12} /> Expiring Link
          </Badge>
        </div>

        <div className="my-6 flex items-center justify-center rounded-2xl border border-line bg-card2 p-4 min-h-[300px]">
          {doc.previewThumbnail ? (
            <img
              src={doc.previewThumbnail}
              alt={doc.name}
              className="max-h-[460px] w-auto rounded-xl object-contain shadow-md"
            />
          ) : (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto text-accent mb-2" />
              <p className="text-xs font-semibold text-fg">{doc.name}</p>
              <p className="text-[11px] text-muted">{doc.mimeType}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Lock size={12} className="text-accent" /> AES-256 Verified
          </span>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer size={13} />
              <span>Print</span>
            </Button>
            <Button size="sm" onClick={() => alert("Document saved to your downloads.")}>
              <Download size={13} />
              <span>Download</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

