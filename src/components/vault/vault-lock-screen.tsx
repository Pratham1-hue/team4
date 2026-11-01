"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Fingerprint, Delete, KeyRound, Lock, Info, CheckCircle2 } from "lucide-react";
import { useVault } from "@/lib/vault/store";
import { Button } from "@/components/ui";

export function VaultLockScreen() {
  const { unlockWithPin, hasPin, setupPin, biometricsSupported } = useVault();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(!hasPin);
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [message, setMessage] = useState("");

  const handleDigit = async (d: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + d;
    setPin(nextPin);
    setError(false);

    if (nextPin.length === 4) {
      if (isSettingUp) {
        if (step === "enter") {
          setConfirmPin(nextPin);
          setPin("");
          setStep("confirm");
        } else {
          if (nextPin === confirmPin) {
            await setupPin(nextPin, false);
            setMessage("PIN configured successfully!");
          } else {
            setError(true);
            setMessage("PINs did not match. Try again.");
            setPin("");
            setConfirmPin("");
            setStep("enter");
          }
        }
      } else {
        const success = await unlockWithPin(nextPin);
        if (!success) {
          setError(true);
          setPin("");
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  return (
    <div className="relative flex min-h-[580px] w-full flex-col items-center justify-center rounded-3xl border border-line/80 bg-gradient-to-b from-card via-card to-card2/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
      <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
        <Lock size={12} />
        <span>AES-256 Zero-Knowledge</span>
      </div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        <div className="relative mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent shadow-inner">
          <Shield size={32} strokeWidth={2.2} />
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="absolute -top-1 -right-1 flex h-4 w-4"
          >
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent/80"></span>
          </motion.span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-fg">
          {isSettingUp
            ? step === "enter"
              ? "Create Vault PIN"
              : "Confirm Your PIN"
            : "Unlock Travel Vault"}
        </h2>
        <p className="mt-1.5 text-xs text-muted">
          {isSettingUp
            ? "Set a 4-digit security PIN to encrypt your passports & tickets"
            : "Enter your 4-digit PIN to decrypt and access your documents"}
        </p>

        {/* PIN Dots */}
        <div className="my-6 flex items-center gap-3.5">
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            return (
              <motion.div
                key={i}
                animate={error ? { x: [-6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.3 }}
                className={`h-4 w-4 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? "border-danger bg-danger/30"
                    : filled
                    ? "border-accent bg-accent scale-110 shadow-[0_0_12px_var(--accent)]"
                    : "border-line bg-card2"
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="mb-2 text-xs font-semibold text-danger">
            {message || "Incorrect PIN. Please try again."}
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-64 my-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-line/60 bg-card/60 text-lg font-bold text-fg shadow-sm transition-all hover:bg-accent-soft hover:text-accent hover:border-accent/40 active:scale-95"
            >
              {num}
            </button>
          ))}

          {/* Biometrics / Extra Button */}
          <button
            onClick={() => handleDigit("1")} // demo fallback shortcut
            title="Biometric unlock available"
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-line/60 bg-card/40 text-muted transition-all hover:bg-card2 hover:text-fg active:scale-95"
          >
            <Fingerprint size={22} className="text-accent" />
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit("0")}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-line/60 bg-card/60 text-lg font-bold text-fg shadow-sm transition-all hover:bg-accent-soft hover:text-accent hover:border-accent/40 active:scale-95"
          >
            0
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={pin.length === 0}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-line/60 bg-card/40 text-muted transition-all hover:bg-card2 hover:text-fg disabled:opacity-30 active:scale-95"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Demo PIN hint */}
        <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-line bg-card2/60 px-3 py-1.5 text-[11px] text-muted">
          <Info size={13} className="shrink-0 text-accent" />
          <span>
            Quick test PIN: <strong className="text-fg font-mono">1234</strong>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

