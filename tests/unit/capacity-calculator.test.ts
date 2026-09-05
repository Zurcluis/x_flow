import { describe, it, expect } from "vitest";
import { calculateWeeklyCapacity } from "@/domains/calendar/capacity-calculator";
import { Appointment } from "@/domains/calendar/types";

describe("Workshop Capacity Calculator", () => {
  it("calculates accurate capacity percentage and remaining hours", () => {
    const appointments: Appointment[] = [
      {
        id: "a1",
        organizationId: "org-1",
        vehicleId: "v1",
        vehiclePlate: "44-TX-88",
        vehicleModel: "BMW M4",
        customerId: "c1",
        customerName: "AutoStand",
        bayId: "b1",
        bayName: "Baia 1",
        technicianName: "João Martins",
        serviceTitle: "PPF",
        startTime: "09:00",
        endTime: "18:00",
        date: "2026-08-28",
        estimatedHours: 8.5,
        status: "in_progress",
      },
      {
        id: "a2",
        organizationId: "org-1",
        vehicleId: "v2",
        vehiclePlate: "99-PZ-11",
        vehicleModel: "Porsche 911",
        customerId: "c2",
        customerName: "Bernardo Silva",
        bayId: "b2",
        bayName: "Baia 2",
        technicianName: "Rui Almeida",
        serviceTitle: "Wrap",
        startTime: "10:00",
        endTime: "19:00",
        date: "2026-08-28",
        estimatedHours: 7.5,
        status: "in_progress",
      },
    ];

    // Total capacity = 1 bay * 40 hours = 40 hours
    const metrics = calculateWeeklyCapacity(appointments, 1, 40);

    expect(metrics.totalCapacityHours).toBe(40);
    expect(metrics.allocatedHours).toBe(16.0); // 8.5 + 7.5
    expect(metrics.remainingHours).toBe(24.0); // 40 - 16
    expect(metrics.occupancyPercentage).toBe(40); // (16 / 40) * 100
    expect(metrics.isOverCapacity).toBe(false);
  });

  it("ignores cancelled and no-show appointments from allocated capacity", () => {
    const appointments: Appointment[] = [
      {
        id: "a1",
        organizationId: "org-1",
        vehicleId: "v1",
        vehiclePlate: "44-TX-88",
        vehicleModel: "BMW M4",
        customerId: "c1",
        customerName: "AutoStand",
        bayId: "b1",
        bayName: "Baia 1",
        technicianName: "João Martins",
        serviceTitle: "PPF",
        startTime: "09:00",
        endTime: "18:00",
        date: "2026-08-28",
        estimatedHours: 10.0,
        status: "cancelled",
      },
      {
        id: "a2",
        organizationId: "org-1",
        vehicleId: "v2",
        vehiclePlate: "99-PZ-11",
        vehicleModel: "Porsche 911",
        customerId: "c2",
        customerName: "Bernardo Silva",
        bayId: "b2",
        bayName: "Baia 2",
        technicianName: "Rui Almeida",
        serviceTitle: "Wrap",
        startTime: "10:00",
        endTime: "19:00",
        date: "2026-08-28",
        estimatedHours: 5.0,
        status: "confirmed",
      },
    ];

    const metrics = calculateWeeklyCapacity(appointments, 1, 40);
    expect(metrics.allocatedHours).toBe(5.0);
    expect(metrics.occupancyPercentage).toBe(13); // (5 / 40) * 100 = 12.5 -> 13
  });
});
