import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "in_progress"
    | "waiting_parts"
    | "success"
    | "danger"
    | "gold"
    | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#1b2021] text-[#a9adae] border-white/10",
    in_progress: "bg-[#d3a548]/15 text-[#f7d46d] border-[#d3a548]/30",
    waiting_parts: "bg-[#253229] text-[#68a46b] border-[#68a46b]/30",
    success: "bg-[#68a46b]/15 text-[#68a46b] border-[#68a46b]/30",
    danger: "bg-[#f05a50]/15 text-[#f05a50] border-[#f05a50]/30",
    gold: "bg-gradient-to-r from-[#d3a548]/20 to-[#a77c2e]/20 text-[#f7d46d] border-[#d3a548]/40",
    outline: "bg-transparent text-[#f1ede5] border-white/20",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
