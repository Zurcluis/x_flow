import { describe, it, expect } from "vitest";
import {
  sortPassportEventsChronologically,
  countPassportLifecycleMilestones,
} from "@/domains/finance/passport-builder";
import { PassportEvent } from "@/domains/finance/types";

describe("Passport Builder & Milestone Counter", () => {
  const sampleEvents: PassportEvent[] = [
    {
      id: "1",
      date: "2026-08-28 09:15",
      type: "checkin",
      title: "Receção",
      subtitle: "Checkin",
      description: "Entrada",
    },
    {
      id: "2",
      date: "2026-08-28 09:25",
      type: "quote",
      title: "Orçamento",
      subtitle: "Aprovado",
      description: "Signature",
    },
    {
      id: "3",
      date: "2026-08-28 15:45",
      type: "work_order",
      title: "Produção",
      subtitle: "Fases",
      description: "PPF",
    },
    {
      id: "4",
      date: "2026-08-28 16:30",
      type: "qc_pass",
      title: "QC",
      subtitle: "10/10",
      description: "Conforme",
    },
    {
      id: "5",
      date: "2026-08-28 17:00",
      type: "invoice",
      title: "Fatura",
      subtitle: "FT 2026/042",
      description: "Paga",
    },
    {
      id: "6",
      date: "2026-08-28 17:30",
      type: "delivery",
      title: "Entrega",
      subtitle: "Assinada",
      description: "Levantamento",
    },
    {
      id: "7",
      date: "2026-08-28 17:35",
      type: "warranty",
      title: "Garantia",
      subtitle: "10 Anos",
      description: "Ativa",
    },
  ];

  it("should sort events chronologically", () => {
    const shuffled = [sampleEvents[3], sampleEvents[0], sampleEvents[6], sampleEvents[1]];
    const sorted = sortPassportEventsChronologically(shuffled);
    expect(sorted[0].type).toBe("checkin");
    expect(sorted[sorted.length - 1].type).toBe("warranty");
  });

  it("should count all 7 completed milestones in full lifecycle", () => {
    const milestones = countPassportLifecycleMilestones(sampleEvents);
    expect(milestones.hasCheckin).toBe(true);
    expect(milestones.hasQuote).toBe(true);
    expect(milestones.hasWorkOrder).toBe(true);
    expect(milestones.hasQCPass).toBe(true);
    expect(milestones.hasInvoice).toBe(true);
    expect(milestones.hasDelivery).toBe(true);
    expect(milestones.hasWarranty).toBe(true);
    expect(milestones.completedMilestonesCount).toBe(7);
  });
});
