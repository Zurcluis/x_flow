import { describe, expect, it } from "vitest";
import {
  buildTimeBookModels,
  confidence,
  median,
  type TimeBookEntryRow,
} from "@/domains/timebook/benchmarks";

function row(overrides: Partial<TimeBookEntryRow> = {}): TimeBookEntryRow {
  return {
    make: "BMW",
    model: "M4",
    generationYear: 2023,
    bodyType: "coupe",
    serviceTitle: "Full PPF",
    vehicleId: "veh-1",
    workOrderId: "wo-1",
    estimatedHours: 30,
    phaseKey: "application",
    hoursSpent: 4,
    notes: null,
    ...overrides,
  };
}

describe("timebook benchmarks", () => {
  it("computes median for odd and even samples", () => {
    expect(median([3])).toBe(3);
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it("maps sample counts to confidence levels", () => {
    expect(confidence(0)).toBe("initial");
    expect(confidence(4)).toBe("initial");
    expect(confidence(5)).toBe("learning");
    expect(confidence(14)).toBe("learning");
    expect(confidence(15)).toBe("reliable");
  });

  it("aggregates entries per work order and phase before the median", () => {
    const models = buildTimeBookModels([
      row({ workOrderId: "wo-1", vehicleId: "veh-1", hoursSpent: 2 }),
      row({ workOrderId: "wo-1", vehicleId: "veh-1", hoursSpent: 3 }),
      row({ workOrderId: "wo-2", vehicleId: "veh-2", hoursSpent: 6 }),
    ]);

    expect(models).toHaveLength(1);
    expect(models[0].panels[0].medianMinutes).toBe(330);
    expect(models[0].panels[0].minMinutes).toBe(300);
    expect(models[0].panels[0].maxMinutes).toBe(360);
    expect(models[0].panels[0].sampleCount).toBe(2);
    expect(models[0].totalSamples).toBe(2);
    expect(models[0].totalMedianHours).toBe(5.5);
  });

  it("excludes automatic completion entries and zeroed records", () => {
    const models = buildTimeBookModels([
      row({ workOrderId: "wo-1", hoursSpent: 4 }),
      row({ workOrderId: "wo-2", hoursSpent: 9, notes: "Conclusão de fase" }),
      row({ workOrderId: "wo-3", hoursSpent: 0 }),
    ]);

    expect(models).toHaveLength(1);
    expect(models[0].totalSamples).toBe(1);
    expect(models[0].panels[0].medianMinutes).toBe(240);
  });

  it("separates coverage/services and uses median planned hours", () => {
    const models = buildTimeBookModels([
      row({
        vehicleId: "veh-1",
        serviceTitle: "Wrap Completo — 3M",
        estimatedHours: 20,
      }),
      row({
        vehicleId: "veh-1",
        phaseKey: "assembly",
        hoursSpent: 2,
        serviceTitle: "Wrap Completo — 3M",
        estimatedHours: 20,
      }),
      row({
        workOrderId: "wo-2",
        vehicleId: "veh-2",
        serviceTitle: "Wrap Completo — 3M",
        estimatedHours: 24,
      }),
      row({
        workOrderId: "wo-3",
        vehicleId: "veh-3",
        serviceTitle: "Full PPF",
        estimatedHours: 40,
        phaseKey: "assembly",
        hoursSpent: 3,
      }),
    ]);

    expect(models).toHaveLength(2);

    const wrap = models.find((model) => model.serviceType === "Wrap");
    expect(wrap).toBeDefined();
    expect(wrap?.serviceCategory).toBe("Wrap Completo — 3M");
    expect(wrap?.totalEstimatedHours).toBe(22);
    expect(wrap?.totalSamples).toBe(2);
    expect(wrap?.panels.find((panel) => panel.panelCode === "assembly")?.sampleCount).toBe(1);

    const ppf = models.find((model) => model.serviceCategory === "Full PPF");
    expect(ppf?.serviceType).toBe("PPF");
    expect(ppf?.totalSamples).toBe(1);
  });

  it("separates models by year and body type", () => {
    const models = buildTimeBookModels([
      row({ workOrderId: "wo-1", generationYear: 2023, bodyType: "coupe" }),
      row({ workOrderId: "wo-2", generationYear: 2024, bodyType: "coupe" }),
    ]);

    expect(models).toHaveLength(2);
    expect(models.map((m) => m.generationYear).sort()).toEqual([2023, 2024]);
  });

  it("returns an empty list without valid rows", () => {
    expect(buildTimeBookModels([])).toEqual([]);
    expect(buildTimeBookModels([row({ notes: "Conclusão de fase" })])).toEqual([]);
  });
});
