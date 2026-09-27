"use client";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Check, AlertTriangle, Info } from "lucide-react";

export const cn = clsx;

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "dark" | "outline";
export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  icon,
  loading,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" | "lg"; icon?: React.ReactNode; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all select-none whitespace-nowrap",
        "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp/40",
        size === "sm" && "h-7 px-2.5 text-[12.5px]",
        size === "md" && "h-9 px-3.5 text-[13.5px]",
        size === "lg" && "h-11 px-5 text-[15px]",
        variant === "primary" && "bg-bp text-white hover:bg-bp-2 shadow-[0_1px_0_rgba(255,255,255,.2)_inset,0_1px_2px_rgba(36,64,219,.4)]",
        variant === "dark" && "bg-ink text-white hover:bg-ink-2",
        variant === "secondary" && "bg-white text-ink border border-line hover:border-line-2 hover:bg-paper-2 shadow-card",
        variant === "outline" && "border border-line text-ink-2 hover:bg-paper-2",
        variant === "ghost" && "text-ink-2 hover:bg-paper-3/70",
        variant === "danger" && "bg-bad text-white hover:opacity-90",
        className
      )}
    >
      {loading ? <Spinner className="h-3.5 w-3.5" /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className || "h-4 w-4")} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Badge({ tone = "neutral", children, className }: { tone?: "neutral" | "bp" | "ok" | "warn" | "bad" | "dark"; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium leading-none h-5",
        tone === "neutral" && "bg-paper-3 text-ink-3",
        tone === "bp" && "bg-bp-soft text-bp-2",
        tone === "ok" && "bg-ok-soft text-ok",
        tone === "warn" && "bg-warn-soft text-warn",
        tone === "bad" && "bg-bad-soft text-bad",
        tone === "dark" && "bg-ink text-white",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("rounded-xl border border-line bg-white shadow-card", className)}>
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
  dark,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; hint?: string }[];
  size?: "sm" | "md";
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("inline-flex rounded-lg p-0.5", dark ? "bg-ide-hi" : "bg-paper-3", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          title={o.hint}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md font-medium transition-all inline-flex items-center gap-1.5",
            size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]",
            value === o.value
              ? dark
                ? "bg-ide-line text-white"
                : "bg-white text-ink shadow-card"
              : dark
              ? "text-ide-dim hover:text-ide-text"
              : "text-ink-3 hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = 520,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 backdrop-blur-[2px] p-4 pt-[8vh] overflow-y-auto" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: width }}
        className="w-full rounded-2xl bg-white shadow-pop border border-line animate-in"
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
            <div>
              {title && <h3 className="text-[16px] font-semibold tracking-tight">{title}</h3>}
              {subtitle && <p className="text-[13px] text-ink-3 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-ink-4 hover:text-ink p-1 -m-1 rounded-md" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 pb-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-3 bg-paper/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative h-5 w-9 rounded-full transition-colors shrink-0", checked ? "bg-bp" : "bg-line-2")}
    >
      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-line bg-white px-3 text-[13.5px] placeholder:text-ink-4 outline-none focus:border-bp focus:ring-2 focus:ring-bp/15",
        props.className
      )}
    />
  );
}

export function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <span className="text-[12.5px] font-medium text-ink-2">{children}</span>
      {hint && <span className="text-[11.5px] text-ink-4">{hint}</span>}
    </div>
  );
}

export function Avatar({ name, src, size = 28 }: { name: string; src?: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  if (src)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div
      className="rounded-full bg-gradient-to-br from-bp to-[#7C8CFF] text-white grid place-items-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "A"}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-line bg-paper-2 px-1 font-mono text-[10.5px] text-ink-3">{children}</kbd>;
}

/* ---------- Toasts ---------- */
type ToastT = { id: number; text: string; tone: "ok" | "info" | "warn" };
export function toast(text: string, tone: ToastT["tone"] = "ok") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("a2-toast", { detail: { text, tone } }));
}
export function Toaster() {
  const [items, setItems] = useState<ToastT[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { text: string; tone: ToastT["tone"] };
      const id = Date.now() + Math.random();
      setItems((x) => [...x, { id, ...d }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
    };
    window.addEventListener("a2-toast", h);
    return () => window.removeEventListener("a2-toast", h);
  }, []);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {items.map((t) => (
        <div key={t.id} className="animate-in pointer-events-auto flex items-center gap-2 rounded-lg bg-ink text-white px-3.5 py-2 text-[13px] shadow-pop">
          {t.tone === "ok" && <Check className="h-3.5 w-3.5 text-[#7CE0A5]" />}
          {t.tone === "info" && <Info className="h-3.5 w-3.5 text-[#9DAEFF]" />}
          {t.tone === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-[#FFC46B]" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {icon && <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-paper-3 text-ink-3">{icon}</div>}
      <div className="text-[14px] font-medium">{title}</div>
      {body && <p className="mt-1 max-w-sm text-[13px] text-ink-3">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
