"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X, Loader2, ChevronRight } from "lucide-react";
import { cn, initials, avatarColor } from "@/lib/utils";

/* ---------------- Button ---------------- */
type BtnVariant = "primary" | "soft" | "outline" | "ghost" | "danger" | "dark";
type BtnSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-accent text-accent-fg shadow-[0_8px_24px_-8px_var(--accent)] hover:brightness-110 hover:shadow-[0_10px_30px_-8px_var(--accent)]",
  soft: "bg-accent-soft text-accent hover:brightness-95",
  outline: "border border-line bg-card text-fg hover:border-accent/60 hover:bg-accent-soft/50",
  ghost: "text-muted hover:text-fg hover:bg-card2",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
  dark: "bg-fg text-bg hover:opacity-90",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "h-9 px-3.5 text-[13px] rounded-[10px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-[15px] py-3.5",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-card text-fg transition-all hover:border-accent/50 hover:bg-accent-soft/50 active:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({
  children,
  variant = "soft",
  className,
}: {
  children: React.ReactNode;
  variant?: "soft" | "solid" | "outline" | "gold" | "green" | "red" | "glass";
  className?: string;
}) {
  const v = {
    soft: "bg-accent-soft text-accent border-transparent",
    solid: "bg-accent text-accent-fg border-transparent",
    outline: "border-line text-muted bg-transparent",
    gold: "bg-gold/12 text-gold border-transparent",
    green: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-transparent",
    red: "bg-danger/12 text-danger border-transparent",
    glass: "bg-black/35 text-white border-white/15 backdrop-blur-md",
  }[variant];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none", v, className)}>
      {children}
    </span>
  );
}

/* ---------------- Card ---------------- */
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...props}>
      {children}
    </div>
  );
}

/* ---------------- Stars ---------------- */
export function Stars({ rating, size = 13, showValue = false }: { rating: number; size?: number; showValue?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex items-center gap-[1px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            width={size}
            height={size}
            className={i < Math.round(rating) ? "fill-gold text-gold" : "fill-transparent text-muted/40"}
          />
        ))}
      </span>
      {showValue && <span className="text-xs font-bold text-fg">{rating.toFixed(1)}</span>}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-card", className)}
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, size = 28, max = 4 }: { names: string[]; size?: number; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((n, i) => (
        <span key={n + i} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar name={n} size={size} />
        </span>
      ))}
      {rest > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-card2 text-[10px] font-bold text-muted ring-2 ring-card"
          style={{ width: size, height: size, marginLeft: -size * 0.3 }}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

/* ---------------- Image with fallback ---------------- */
export function Img({
  src,
  alt,
  className,
  emoji = "🏞️",
}: {
  src: string;
  alt: string;
  className?: string;
  emoji?: string;
}) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-teal-500/25 via-indigo-500/15 to-pink-500/20", className)}>
        <span className="text-4xl opacity-70">{emoji}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setBroken(true)}
    />
  );
}

/* ---------------- Modal ---------------- */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-card p-5 shadow-lift sm:rounded-3xl sm:p-6",
              size === "sm" && "sm:max-w-md",
              size === "md" && "sm:max-w-xl",
              size === "lg" && "sm:max-w-3xl"
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                {title && <h3 className="text-xl font-bold text-fg">{title}</h3>}
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-card2 text-muted transition-colors hover:text-fg"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Tabs ---------------- */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  className,
  variant = "pill",
}: {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: "pill" | "underline";
}) {
  if (variant === "underline") {
    return (
      <div className={cn("flex gap-1 overflow-x-auto no-scrollbar border-b border-line", className)}>
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
              active === t.id ? "text-accent" : "text-muted hover:text-fg"
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === "number" && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active === t.id ? "bg-accent text-accent-fg" : "bg-card2 text-muted")}>
                {t.count}
              </span>
            )}
            {active === t.id && (
              <motion.span layoutId="tab-underline" className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-2xl border border-line bg-card2 p-1", className)}>
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors sm:px-4",
            active === t.id ? "text-fg" : "text-muted hover:text-fg"
          )}
        >
          {active === t.id && (
            <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-xl bg-card shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
          )}
          <span className="relative flex items-center gap-1.5">
            {t.icon}
            {t.label}
            {typeof t.count === "number" && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", active === t.id ? "bg-accent text-accent-fg" : "bg-card text-muted")}>
                {t.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Segmented ---------------- */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1 rounded-xl border border-line bg-card2 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
            value === o.value ? "bg-card text-fg shadow-sm" : "text-muted hover:text-fg"
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Range ---------------- */
export function Range({
  value,
  min,
  max,
  step = 1,
  onChange,
  className,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={className}
      style={{ "--pct": `${pct}%` } as React.CSSProperties}
    />
  );
}

/* ---------------- Misc ---------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-card2/40 px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">{icon}</div>
      <h3 className="text-lg font-bold text-fg">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} size={16} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-xl bg-card2", className)} />;
}

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-card2", className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color ?? "var(--accent)" }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  center,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", center && "sm:flex-col sm:items-center sm:text-center")}>
      <div className={cn(center && "mx-auto max-w-2xl")}>
        {eyebrow && <div className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</div>}
        <h2 className="text-2xl font-bold text-fg sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-muted sm:text-[15px]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LinkArrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
      {children}
      <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
    </span>
  );
}
