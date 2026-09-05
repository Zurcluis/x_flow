import { PassportEvent } from "./types";

export function sortPassportEventsChronologically(
  events: PassportEvent[]
): PassportEvent[] {
  return [...events].sort((a, b) => a.date.localeCompare(b.date));
}

export function countPassportLifecycleMilestones(events: PassportEvent[]): {
  hasCheckin: boolean;
  hasQuote: boolean;
  hasWorkOrder: boolean;
  hasQCPass: boolean;
  hasInvoice: boolean;
  hasDelivery: boolean;
  hasWarranty: boolean;
  completedMilestonesCount: number;
} {
  const types = new Set(events.map((e) => e.type));

  const hasCheckin = types.has("checkin");
  const hasQuote = types.has("quote");
  const hasWorkOrder = types.has("work_order");
  const hasQCPass = types.has("qc_pass");
  const hasInvoice = types.has("invoice");
  const hasDelivery = types.has("delivery");
  const hasWarranty = types.has("warranty");

  const completedMilestonesCount = [
    hasCheckin,
    hasQuote,
    hasWorkOrder,
    hasQCPass,
    hasInvoice,
    hasDelivery,
    hasWarranty,
  ].filter(Boolean).length;

  return {
    hasCheckin,
    hasQuote,
    hasWorkOrder,
    hasQCPass,
    hasInvoice,
    hasDelivery,
    hasWarranty,
    completedMilestonesCount,
  };
}
