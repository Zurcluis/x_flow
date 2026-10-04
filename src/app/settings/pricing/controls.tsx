"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const INPUT_CLASS =
  "h-10 px-3.5 rounded-sm bg-[#15191a] border border-white/[0.08] focus:border-[#d3a548] text-sm text-[#f1ede5] w-full outline-none";

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-semibold text-[#a9adae]">
        {label}
        {required && <span className="text-[#d3a548]"> *</span>}
      </label>
      {children}
      {error ? (
        <span className="text-xs font-semibold text-[#f05a50]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-[#8a9092]">{hint}</span>
      ) : null}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  allowEmpty = false,
  min,
  max,
  step,
  placeholder,
  disabled,
  className,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  allowEmpty?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [raw, setRaw] = useState<string | null>(null);
  const display = raw !== null ? raw : value === null ? "" : String(value);

  return (
    <input
      type="number"
      inputMode="decimal"
      value={display}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        const next = e.target.value;
        setRaw(next);
        const trimmed = next.trim();
        if (trimmed === "") {
          onChange(allowEmpty ? null : 0);
          return;
        }
        const parsed = Number(trimmed.replace(",", "."));
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
      onBlur={() => setRaw(null)}
      className={cn(INPUT_CLASS, "font-mono", className)}
    />
  );
}

export function DateInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type="date"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT_CLASS, "[color-scheme:dark]", className)}
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT_CLASS, className)}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  children,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(INPUT_CLASS, "cursor-pointer", className)}
    >
      {children}
    </select>
  );
}

export function CheckboxRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 p-3 rounded-sm bg-[#15191a] border border-white/[0.06] cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="flex flex-col min-w-0">
        <span className="text-xs font-semibold text-[#f1ede5]">{label}</span>
        {description && (
          <span className="text-[11px] text-[#8a9092]">{description}</span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#d3a548] shrink-0"
      />
    </label>
  );
}

export function ToggleSwitch({
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        checked
          ? "bg-[#d3a548] border-[#d3a548]"
          : "bg-[#080a0b] border-white/20"
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-3.5 w-3.5 rounded-full bg-[#f1ede5] transition-all",
          checked ? "left-[20px]" : "left-[2px]"
        )}
      />
    </button>
  );
}

export function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050606]/85 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full rounded-[18px] bg-[#101314] border border-white/[0.12] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.6)] my-8",
          wide ? "max-w-3xl" : "max-w-xl"
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-[#f1ede5]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a9092] hover:text-[#f1ede5] hover:bg-white/[0.05] cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FeedbackBanner({
  tone,
  text,
  onDismiss,
}: {
  tone: "success" | "error";
  text: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-3 rounded-md border text-xs",
        tone === "success"
          ? "bg-[#68a46b]/10 border-[#68a46b]/30 text-[#68a46b]"
          : "bg-[#f05a50]/10 border-[#f05a50]/30 text-[#f05a50]"
      )}
    >
      <span className="font-semibold">{text}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto p-1 rounded-sm hover:bg-white/5 cursor-pointer"
        aria-label="Fechar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
