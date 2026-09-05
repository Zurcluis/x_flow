import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "symbol";
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ variant = "full", className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-7",
    md: "h-9",
    lg: "h-12",
  };

  if (variant === "symbol") {
    return (
      <svg
        viewBox="0 0 540 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size], "w-auto shrink-0", className)}
        role="img"
        aria-label="X-Flow Símbolo"
      >
        <defs>
          <linearGradient id="xf-gold-sym" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d99a24" />
            <stop offset="28%" stopColor="#f7d46d" />
            <stop offset="55%" stopColor="#e7b84c" />
            <stop offset="78%" stopColor="#f4ce66" />
            <stop offset="100%" stopColor="#b97812" />
          </linearGradient>
          <linearGradient id="xf-pearl-sym" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9c7c3" />
            <stop offset="28%" stopColor="#fffefa" />
            <stop offset="58%" stopColor="#e9e7e2" />
            <stop offset="82%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#b9b7b3" />
          </linearGradient>
        </defs>
        <g
          strokeWidth="28"
          strokeLinecap="butt"
          strokeLinejoin="round"
          transform="translate(-165, -230)"
        >
          <path
            d="M 201,492 L 420,292 Q 438,276 456,292 L 672,492"
            stroke="url(#xf-pearl-sym)"
          />
          <path
            d="M 201,291 L 420,490 Q 438,506 456,490 L 672,291"
            stroke="url(#xf-gold-sym)"
          />
          <path
            d="M 505,337 L 605,430"
            stroke="url(#xf-pearl-sym)"
          />
        </g>
      </svg>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <svg
        viewBox="0 0 540 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizeClasses[size], "w-auto shrink-0")}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="xf-gold-full" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d99a24" />
            <stop offset="28%" stopColor="#f7d46d" />
            <stop offset="55%" stopColor="#e7b84c" />
            <stop offset="78%" stopColor="#f4ce66" />
            <stop offset="100%" stopColor="#b97812" />
          </linearGradient>
          <linearGradient id="xf-pearl-full" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9c7c3" />
            <stop offset="28%" stopColor="#fffefa" />
            <stop offset="58%" stopColor="#e9e7e2" />
            <stop offset="82%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#b9b7b3" />
          </linearGradient>
        </defs>
        <g
          strokeWidth="28"
          strokeLinecap="butt"
          strokeLinejoin="round"
          transform="translate(-165, -230)"
        >
          <path
            d="M 201,492 L 420,292 Q 438,276 456,292 L 672,492"
            stroke="url(#xf-pearl-full)"
          />
          <path
            d="M 201,291 L 420,490 Q 438,506 456,490 L 672,291"
            stroke="url(#xf-gold-full)"
          />
          <path
            d="M 505,337 L 605,430"
            stroke="url(#xf-pearl-full)"
          />
        </g>
      </svg>
      <div className="flex flex-col">
        <span className="font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#f7d46d] via-[#d99a24] to-[#e7b84c] text-lg leading-tight uppercase font-sans">
          X-FLOW
        </span>
        <span className="text-[12px] font-medium tracking-normal text-[#c9c7c3] leading-none">
          by X-Motion
        </span>
      </div>
    </div>
  );
}
