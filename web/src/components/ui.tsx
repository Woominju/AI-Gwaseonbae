"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", size = "md", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-12 px-6 text-base",
        variant === "primary" && "bg-navy-800 text-white hover:bg-navy-700",
        variant === "secondary" && "bg-teal-600 text-white hover:bg-teal-700",
        variant === "outline" && "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        variant === "danger" && "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,27,45,0.04)]", className)} {...props} />;
}

export function CardHeader({ title, description, action, icon }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-teal-600">{icon}</div>}
        <div>
          <h3 className="font-bold text-navy-900">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Badge({ className, tone = "slate", ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: "slate" | "teal" | "navy" | "amber" | "rose" | "green" | "violet" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    teal: "bg-teal-50 text-teal-700 ring-1 ring-teal-100",
    navy: "bg-navy-50 text-navy-800 ring-1 ring-navy-100",
    amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)} {...props} />;
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20", className)} {...props} />;
});

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20", className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20", className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Chip({ active, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer",
        active ? "border-teal-600 bg-teal-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700",
        className,
      )}
      {...props}
    />
  );
}

export function Slider({ value, onChange, min = 0, max = 1, step = 0.05, label, display, id }: { value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label?: React.ReactNode; display?: string; id?: string }) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <label htmlFor={id} className="text-slate-700">{label}</label>
          <span className="tabular-nums font-medium text-navy-800">{display ?? value.toFixed(2)}</span>
        </div>
      )}
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-teal-600 cursor-pointer" />
    </div>
  );
}

export function Progress({ value, className, tone = "teal" }: { value: number; className?: string; tone?: "teal" | "navy" | "slate" }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)} role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all duration-500", tone === "teal" ? "bg-teal-500" : tone === "navy" ? "bg-navy-700" : "bg-slate-400")} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex rounded-lg bg-slate-100 p-1", className)}>
      {items.map((it) => (
        <button
          key={it.value}
          role="tab"
          aria-selected={value === it.value}
          onClick={() => onChange(it.value)}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer", value === it.value ? "bg-white text-navy-900 shadow-sm" : "text-slate-600 hover:text-navy-800")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="text-slate-300">{icon}</div>}
      <p className="font-semibold text-slate-700">{title}</p>
      {description && <p className="max-w-md text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} aria-label="로딩 중" />;
}
