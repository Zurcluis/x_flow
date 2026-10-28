"use client";

import {
  Aperture,
  ChevronDown,
  Sun,
  Sunset,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

import {
  CAR_ENVIRONMENTS,
  type EnvironmentIconKey,
  type EnvironmentId,
} from "@/lib/car-environments";

const ENVIRONMENT_ICONS: Record<EnvironmentIconKey, LucideIcon> = {
  aperture: Aperture,
  warehouse: Warehouse,
  sun: Sun,
  sunset: Sunset,
};

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a548]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050606]";

export function EnvironmentSelector({
  value,
  onChange,
  busy = false,
}: {
  value: EnvironmentId;
  onChange: (id: EnvironmentId) => void;
  busy?: boolean;
}) {
  const current =
    CAR_ENVIRONMENTS.find((environment) => environment.id === value) ??
    CAR_ENVIRONMENTS[0];
  const Icon = ENVIRONMENT_ICONS[current.icon];

  return (
    <label className="relative flex w-full items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#050606]/85 py-1.5 pl-2.5 pr-7 backdrop-blur-md">
      <Icon className="h-3 w-3 shrink-0 text-[#d3a548]" aria-hidden="true" />
      <span className="sr-only">Cenário</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as EnvironmentId)}
        aria-label="Cenário"
        aria-busy={busy}
        title={current.name}
        className={`min-w-0 flex-1 appearance-none truncate bg-transparent text-[10px] font-bold uppercase tracking-wide text-[#d7dbdc] outline-none ${FOCUS_RING}`}
      >
        {CAR_ENVIRONMENTS.map((environment) => {
          const planned = environment.availability !== "available";
          return (
            <option
              key={environment.id}
              value={environment.id}
              disabled={planned}
            >
              {environment.name}
              {planned ? " (em breve)" : ""}
            </option>
          );
        })}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 h-3 w-3 text-[#8a9092]"
        aria-hidden="true"
      />
    </label>
  );
}
