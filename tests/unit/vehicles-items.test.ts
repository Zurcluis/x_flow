import { describe, expect, it } from "vitest";
import {
  BODY_TYPE_LABELS,
  BodyType,
  isObjectBodyType,
} from "@/domains/vehicles/types";
import {
  resolveVehicleGenerationYear,
  resolveVehiclePlate,
  VehicleValidationError,
} from "@/server/vehicles";

describe("Vehicles, Boats and Standalone Objects (Bloco 1A)", () => {
  it("classifies object body types accurately with isObjectBodyType", () => {
    expect(isObjectBodyType("helmet")).toBe(true);
    expect(isObjectBodyType("part")).toBe(true);
    expect(isObjectBodyType("other")).toBe(true);

    expect(isObjectBodyType("coupe")).toBe(false);
    expect(isObjectBodyType("sedan")).toBe(false);
    expect(isObjectBodyType("suv")).toBe(false);
    expect(isObjectBodyType("motorcycle")).toBe(false);
    expect(isObjectBodyType("boat")).toBe(false);
    expect(isObjectBodyType("motorhome")).toBe(false);
    expect(isObjectBodyType("truck")).toBe(false);
  });

  it("provides pt-PT labels for all 14 body types in BODY_TYPE_LABELS", () => {
    const allTypes: BodyType[] = [
      "coupe",
      "sedan",
      "suv",
      "wagon",
      "hatchback",
      "cabrio",
      "motorcycle",
      "van",
      "boat",
      "motorhome",
      "truck",
      "helmet",
      "part",
      "other",
    ];
    for (const bt of allTypes) {
      expect(BODY_TYPE_LABELS[bt]).toBeDefined();
      expect(BODY_TYPE_LABELS[bt].length).toBeGreaterThan(0);
    }
    expect(BODY_TYPE_LABELS.boat).toBe("Barco / Embarcação");
    expect(BODY_TYPE_LABELS.helmet).toBe("Capacete");
    expect(BODY_TYPE_LABELS.part).toBe("Peça Solta");
    expect(BODY_TYPE_LABELS.other).toBe("Outro Objeto");
  });

  it("enforces mandatory valid plate for standard road vehicles", () => {
    expect(() => resolveVehiclePlate("", "vehicle", "coupe")).toThrow(
      VehicleValidationError
    );
    expect(() => resolveVehiclePlate("AB", "vehicle", "sedan")).toThrow(
      VehicleValidationError
    );

    const valid = resolveVehiclePlate("44tx88", "vehicle", "coupe");
    expect(valid).toEqual({
      displayPlate: "44-TX-88",
      plateNormalized: "44TX88",
    });
  });

  it("allows empty or custom reference plates for standalone objects and boats", () => {
    expect(resolveVehiclePlate("", "object", "helmet")).toEqual({
      displayPlate: null,
      plateNormalized: null,
    });
    expect(resolveVehiclePlate("   ", "vehicle", "boat")).toEqual({
      displayPlate: null,
      plateNormalized: null,
    });

    const customObjectRef = resolveVehiclePlate("CAP-01", "object", "helmet");
    expect(customObjectRef.displayPlate).toBe("CAP-01");
    expect(customObjectRef.plateNormalized).toBe("CAP01");

    const customBoatReg = resolveVehiclePlate(
      "PT-NAZARE-12345-LONGBOAT",
      "vehicle",
      "boat"
    );
    expect(customBoatReg.displayPlate).toBe("PT-NAZARE-12345-LONGBOAT");
    expect(customBoatReg.plateNormalized).toBe("PTNAZARE12345LONGBOAT");
  });

  it("resolves generation year as optional for objects and mandatory for vehicles", () => {
    const fixedNow = new Date("2026-08-28T12:00:00Z");
    expect(resolveVehicleGenerationYear("", "object", fixedNow)).toBe(2026);
    expect(resolveVehicleGenerationYear(NaN, "object", fixedNow)).toBe(2026);
    expect(resolveVehicleGenerationYear(0, "object", fixedNow)).toBe(2026);
    expect(resolveVehicleGenerationYear(2024, "object", fixedNow)).toBe(2024);

    expect(() => resolveVehicleGenerationYear("", "vehicle", fixedNow)).toThrow(
      VehicleValidationError
    );
    expect(resolveVehicleGenerationYear(2025, "vehicle", fixedNow)).toBe(2025);
  });
});
