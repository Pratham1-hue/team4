"use client";

import { useState } from "react";
import {
  ShieldAlert,
  PhoneCall,
  HeartPulse,
  Building2,
  Languages,
  Eye,
  AlertCircle,
  MapPin,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button, Badge, Modal, Input, Select } from "@/components/ui";
import { useVault } from "@/lib/vault/store";
import { useApp } from "@/lib/store";

interface CountryEmergency {
  country: string;
  code: string;
  police: string;
  ambulance: string;
  fire: string;
  tourist: string;
}

const EMERGENCY_DIRECTORIES: CountryEmergency[] = [
  { country: "India", code: "IN", police: "112 / 100", ambulance: "102 / 108", fire: "101", tourist: "1363" },
  { country: "United Arab Emirates (Dubai)", code: "AE", police: "999", ambulance: "998", fire: "997", tourist: "800 2626" },
  { country: "United Kingdom", code: "GB", police: "999 / 112", ambulance: "999", fire: "999", tourist: "101" },
  { country: "European Union (France/Italy/Spain)", code: "EU", police: "112", ambulance: "112", fire: "112", tourist: "112" },
  { country: "United States", code: "US", police: "911", ambulance: "911", fire: "911", tourist: "311" },
  { country: "Thailand", code: "TH", police: "191", ambulance: "1669", fire: "199", tourist: "1155" },
  { country: "Japan", code: "JP", police: "110", ambulance: "119", fire: "119", tourist: "050-3816-2787" },
];

const EMERGENCY_PHRASES = [
  { english: "I need immediate medical help / doctor", local: "Mujhe turant doctor ki zaroorat hai", phonetic: "Moo-jhay too-rant doctor kee za-roo-rat hai" },
  { english: "Where is the nearest hospital?", local: "Nazdeeki hospital kahan hai?", phonetic: "Naz-dee-kee hospital ka-haan hai?" },
  { english: "Please call the police immediately", local: "Kripya turant police ko call karein", phonetic: "Krip-ya too-rant police ko call ka-rein" },
  { english: "I lost my passport and wallet", local: "Mera passport aur wallet kho gaya hai", phonetic: "May-ra passport aur wallet kho gaya hai" },
  { english: "I am allergic to penicillin and peanuts", local: "Mujhe penicillin aur moongfali se allergy hai", phonetic: "Moo-jhay penicillin aur moong-fa-lee say allergy hai" },
];

export default function SafetyHubPage() {
  const { documents } = useVault();
  const { toast } = useApp();

  const [selectedCountry, setSelectedCountry] = useState<string>("India");
  const [medicalCardOpen, setMedicalCardOpen] = useState(false);

  // Grab active insurance from Vault if available
  const insuranceDoc = documents.find((d) => d.category === "insurance");

  const currentCountryInfo =
    EMERGENCY_DIRECTORIES.find((c) => c.country === selectedCountry) || EMERGENCY_DIRECTORIES[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-danger text-white shadow-md">
              <ShieldAlert size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-fg">
                  Emergency Hub & Offline Safety
                </h1>
                <Badge variant="green" className="text-[10px]">
                  100% Offline Accessible
                </Badge>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Instant emergency numbers, paramedic medical card, embassy contacts, and rescue phrases.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={() => setMedicalCardOpen(true)}
            className="shadow-sm"
          >
            <HeartPulse size={14} />
            <span>Show Paramedic Medical Card</span>
          </Button>
        </div>
      </div>

      {/* Country Switcher */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted block">
            Select Your Destination Country
          </label>
          <p className="text-xs text-muted mt-0.5">
            Emergency dispatch numbers update automatically based on local laws.
          </p>
        </div>

        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="h-10 rounded-xl border border-line bg-card px-3 text-xs font-bold text-fg focus:border-accent focus:outline-none"
        >
          {EMERGENCY_DIRECTORIES.map((c) => (
            <option key={c.country} value={c.country}>
              {c.country}
            </option>
          ))}
        </select>
      </div>

      {/* One-Tap Emergency Call Grid */}
      <div className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
          Instant Emergency Dispatchers ({currentCountryInfo.country})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Police */}
          <a
            href={`tel:${currentCountryInfo.police.split(" ")[0]}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-5 hover:border-danger hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted">Police / Security</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-danger/10 text-danger group-hover:scale-110 transition-transform">
                <PhoneCall size={16} />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-fg">{currentCountryInfo.police}</p>
              <p className="text-[11px] text-muted mt-1">Tap to call local police station</p>
            </div>
          </a>

          {/* Ambulance */}
          <a
            href={`tel:${currentCountryInfo.ambulance.split(" ")[0]}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-5 hover:border-danger hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted">Medical & Ambulance</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-danger/10 text-danger group-hover:scale-110 transition-transform">
                <HeartPulse size={16} />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-fg">{currentCountryInfo.ambulance}</p>
              <p className="text-[11px] text-muted mt-1">First responders & trauma units</p>
            </div>
          </a>

          {/* Fire */}
          <a
            href={`tel:${currentCountryInfo.fire}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-5 hover:border-danger hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted">Fire & Rescue</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-danger/10 text-danger group-hover:scale-110 transition-transform">
                <PhoneCall size={16} />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-fg">{currentCountryInfo.fire}</p>
              <p className="text-[11px] text-muted mt-1">Disaster & structural rescue</p>
            </div>
          </a>

          {/* Tourist Helpline */}
          <a
            href={`tel:${currentCountryInfo.tourist}`}
            className="group flex flex-col justify-between rounded-2xl border border-line bg-card p-5 hover:border-accent hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-muted">Tourist Assistance</span>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent-soft text-accent group-hover:scale-110 transition-transform">
                <ShieldAlert size={16} />
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-black text-fg">{currentCountryInfo.tourist}</p>
              <p className="text-[11px] text-muted mt-1">24x7 Multi-language support</p>
            </div>
          </a>
        </div>
      </div>

      {/* Emergency Phrases */}
      <div className="mt-8 rounded-3xl border border-line bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Languages size={18} className="text-accent" />
          <h2 className="text-sm font-bold text-fg">Offline Medical & Emergency Phrases</h2>
        </div>

        <div className="space-y-3">
          {EMERGENCY_PHRASES.map((phrase, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-line/70 bg-card2/50 p-3.5 gap-2 text-xs"
            >
              <div>
                <p className="font-bold text-fg">{phrase.english}</p>
                <p className="text-accent font-semibold text-[11px] mt-0.5">{phrase.local}</p>
                <p className="text-muted text-[10px] italic">Pronounce: &ldquo;{phrase.phonetic}&rdquo;</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if ("speechSynthesis" in window) {
                    const utterance = new SpeechSynthesisUtterance(phrase.local);
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="self-start sm:self-auto h-7 px-2.5 text-[11px]"
              >
                Speak Out Loud
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Screen Paramedic Medical Card Modal */}
      <Modal
        open={medicalCardOpen}
        onClose={() => setMedicalCardOpen(false)}
        title="Paramedic & First-Responder Medical Card"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <div className="rounded-2xl border-2 border-danger bg-danger/10 p-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-danger">
              EMERGENCY MEDICAL PROFILE · SHOW TO FIRST RESPONDERS
            </p>
            <h2 className="text-2xl font-extrabold text-fg mt-1">Pratham Prajapati</h2>
            <p className="text-xs text-muted">Born: 1998 · Indian Citizen</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-line bg-card2 p-3">
              <span className="text-[10px] uppercase font-bold text-muted">Blood Group</span>
              <p className="text-lg font-black text-danger mt-0.5">O Positive (O+)</p>
            </div>

            <div className="rounded-xl border border-line bg-card2 p-3">
              <span className="text-[10px] uppercase font-bold text-muted">Allergies</span>
              <p className="text-xs font-bold text-fg mt-1">Penicillin, Peanuts</p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-card2 p-3 text-xs">
            <span className="text-[10px] uppercase font-bold text-muted">Emergency ICE Contact</span>
            <p className="font-bold text-fg mt-0.5">Rajesh Prajapati (Father)</p>
            <a href="tel:+919876543210" className="text-accent font-mono font-semibold block mt-0.5">
              +91 98765 43210
            </a>
          </div>

          {insuranceDoc && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-3 text-xs">
              <span className="text-[10px] uppercase font-bold text-accent">
                Travel Insurance (Synced from Vault)
              </span>
              <p className="font-bold text-fg mt-0.5">{insuranceDoc.name}</p>
              <p className="font-mono text-[11px] text-muted">
                Policy #{insuranceDoc.documentNumber || "POL-019948271"} · 24x7 SOS: +91 1800 266 7780
              </p>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-line">
            <Button size="sm" onClick={() => setMedicalCardOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

