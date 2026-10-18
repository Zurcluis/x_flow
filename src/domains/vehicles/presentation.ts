import { parseDateKey, WORKSHOP_TIME_ZONE } from "@/domains/calendar/datetime";

const DATE_ONLY_FORMATTER = new Intl.DateTimeFormat("pt-PT", {
  timeZone: WORKSHOP_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatVehicleDateKey(value: string): string {
  const parts = parseDateKey(value);
  if (!parts) return "Data indisponível";
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  return DATE_ONLY_FORMATTER.format(date);
}
