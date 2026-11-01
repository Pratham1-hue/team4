"use client";

import { useMemo, useState } from "react";
import { Copy, Mail, MessageCircle, Link2, Download, Printer, Check, Users, Shield, Eye, Pencil } from "lucide-react";
import type { Trip } from "@/lib/types";
import { downloadICS, formatDate, uid } from "@/lib/utils";
import { useApp } from "@/lib/store";
import { Avatar, Badge, Button, Modal } from "@/components/ui";

const roleIcon = {
  owner: <Shield size={11} />,
  editor: <Pencil size={11} />,
  viewer: <Eye size={11} />,
};

export function ShareModal({ trip, open, onClose }: { trip: Trip; open: boolean; onClose: () => void }) {
  const toast = useApp((s) => s.toast);
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const token = useMemo(() => uid("inv"), []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://voyage.ai";
  const publicUrl = `${origin}/share/${trip.id}`;
  const inviteUrl = `${publicUrl}?invite=${token}&role=${role}`;

  const copy = async (text: string, label = "Link copied") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast(label, "Share it with your travel crew.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy", "Copy the link manually from the field.", "error");
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Join my trip “${trip.title}” on Yatri ✈️\n${inviteUrl}`
  )}`;
  const mailto = `mailto:?subject=${encodeURIComponent(`Join my trip: ${trip.title}`)}&body=${encodeURIComponent(
    `Hey! I planned “${trip.title}” (${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}) on Yatri.\n\nJoin as ${role}: ${inviteUrl}\n\nSee you there!`
  )}`;

  return (
    <Modal open={open} onClose={onClose} title="Share this trip" description={`Invite your crew to “${trip.title}”.`} size="md">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {trip.members.map((m) => (
            <span key={m.id} className="flex items-center gap-2 rounded-full border border-line bg-card2 py-1 pl-1 pr-3">
              <Avatar name={m.name} size={26} />
              <span className="text-xs font-semibold text-fg">{m.name}</span>
              <Badge variant="outline" className="gap-1 px-1.5 py-0.5 text-[9px]">{roleIcon[m.role]}{m.role}</Badge>
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-xs font-semibold text-muted">
            <Users size={13} /> {trip.members.length} member{trip.members.length > 1 ? "s" : ""}
          </span>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Invite link</div>
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-card2 px-3 py-2.5 text-xs text-muted">
              <Link2 size={14} className="shrink-0 text-accent" />
              <span className="truncate">{inviteUrl}</span>
            </div>
            <Button size="sm" onClick={() => copy(inviteUrl, "Invite link copied")} className="shrink-0">
              {copied ? <Check size={14} /> : <Copy size={14} />} Copy
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted">
            <span className="font-semibold">Permission:</span>
            <div className="inline-flex rounded-lg border border-line bg-card2 p-0.5">
              <button onClick={() => setRole("viewer")} className={`rounded-md px-2 py-1 text-[11px] font-bold ${role === "viewer" ? "bg-card text-fg shadow-sm" : "text-muted"}`}>Viewer</button>
              <button onClick={() => setRole("editor")} className={`rounded-md px-2 py-1 text-[11px] font-bold ${role === "editor" ? "bg-card text-fg shadow-sm" : "text-muted"}`}>Editor</button>
            </div>
            <span className="text-[10px]">Expires in 7 days</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a href={whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-95">
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a href={mailto} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-sm font-bold text-fg transition hover:bg-card2">
            <Mail size={16} /> Email
          </a>
        </div>

        <div className="rounded-2xl border border-line bg-card2/60 p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Trip exports</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button variant="outline" size="sm" onClick={() => downloadICS(trip)}><Download size={14} /> Calendar (.ics)</Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}><Printer size={14} /> PDF / print</Button>
            <Button variant="outline" size="sm" onClick={() => copy(publicUrl, "Public link copied")}><Link2 size={14} /> Public page</Button>
          </div>
          <p className="mt-2 text-[10px] text-muted">The public page is read-only. Anyone with the link can view and remix a copy.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2.5">
          <span className="text-xs font-semibold text-accent">Anyone with the link can join as {role}</span>
          <button onClick={() => copy(inviteUrl, "Invite sent (demo)")} className="text-xs font-bold text-accent underline underline-offset-2">
            Send invite
          </button>
        </div>
      </div>
    </Modal>
  );
}
