import { describe, it, expect } from "vitest";
import { initialDashboardData } from "@/lib/demo-data/dashboard-data";

describe("Dashboard demo data integrity", () => {
  it("contains valid user data and unread notification count", () => {
    expect(initialDashboardData.user.name).toBe("Luís Gonçalves");
    expect(initialDashboardData.user.unreadNotifications).toBe(3);
  });

  it("contains 5 KPI indicators matching mockup values", () => {
    expect(initialDashboardData.kpis.todayVehicles.count).toBe(4);
    expect(initialDashboardData.kpis.pendingQuotes.count).toBe(7);
    expect(initialDashboardData.kpis.weeklyCapacity.percentage).toBe(76);
    expect(initialDashboardData.kpis.criticalStock.count).toBe(5);
    expect(initialDashboardData.kpis.todayDeliveries.count).toBe(2);
  });

  it("contains 4 active works in progress", () => {
    expect(initialDashboardData.activeWorks).toHaveLength(4);
    expect(initialDashboardData.activeWorks[0].vehicle).toBe("BMW M4");
  });

  it("contains 6 agenda events covering the daily timeline", () => {
    expect(initialDashboardData.todayAgenda).toHaveLength(6);
    expect(initialDashboardData.todayAgenda[0].time).toBe("09:00");
  });

  it("contains 3 intelligence alerts with proper severity levels", () => {
    expect(initialDashboardData.intelligenceAlerts).toHaveLength(3);
    expect(initialDashboardData.intelligenceAlerts[0].severity).toBe("danger");
  });
});
