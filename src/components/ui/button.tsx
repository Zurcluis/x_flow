import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-[#d3a548] to-[#a77c2e] text-[#050606] font-semibold hover:brightness-110 shadow-[0_4px_20px_rgba(211,165,72,0.25)] border border-[#e7c77c]/30",
      secondary:
        "bg-[#15191a] text-[#f1ede5] hover:bg-[#1b2021] border border-white/10 hover:border-white/20",
      outline:
        "bg-transparent text-[#f1ede5] border border-[#d3a548]/40 hover:border-[#d3a548] hover:bg-[#d3a548]/10",
      ghost:
        "bg-transparent text-[#a9adae] hover:text-[#f1ede5] hover:bg-white/5",
      danger:
        "bg-[#f05a50]/15 text-[#f05a50] border border-[#f05a50]/30 hover:bg-[#f05a50]/25",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-sm gap-1.5",
      md: "h-10 px-4 text-sm rounded-sm gap-2",
      lg: "h-12 px-6 text-base rounded-md gap-2.5",
      icon: "h-9 w-9 p-0 rounded-sm justify-center items-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
