import { describe, it, expect } from "vitest";
import { initialCustomersData } from "@/lib/demo-data/customers-data";
import { initialVehiclesData } from "@/lib/demo-data/vehicles-data";

describe("CRM and Vehicles synthetic datasets", () => {
  it("contains 12 individual customers and 3 B2B companies", () => {
    const individuals = initialCustomersData.filter((c) => c.type === "individual");
    const businesses = initialCustomersData.filter((c) => c.type === "business");

    expect(individuals.length).toBeGreaterThanOrEqual(12);
    expect(businesses.length).toBeGreaterThanOrEqual(3);
  });

  it("contains 18 vehicles with valid normalized plates", () => {
    expect(initialVehiclesData).toHaveLength(18);
    for (const vehicle of initialVehiclesData) {
      expect(vehicle.plateNormalized).toBeTruthy();
      expect(vehicle.make).toBeTruthy();
      expect(vehicle.model).toBeTruthy();
      expect(vehicle.generationYear).toBeGreaterThan(2000);
    }
  });

  it("demonstrates temporal owner link decoupling on Audi RS6 Avant", () => {
    const rs6 = initialVehiclesData.find((v) => v.plateDisplay === "12-RS-66");
    expect(rs6).toBeDefined();
    expect(rs6?.ownerHistory).toHaveLength(2);
    expect(rs6?.ownerHistory?.[0].isCurrent).toBe(false);
    expect(rs6?.ownerHistory?.[1].isCurrent).toBe(true);
    expect(rs6?.currentOwner?.customerName).toBe("Tiago Cerqueira");
  });
});
