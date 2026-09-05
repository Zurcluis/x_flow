import { describe, it, expect } from "vitest";
import { initialCheckinsData } from "@/lib/demo-data/checkins-data";
import { initialWorkOrdersData } from "@/lib/demo-data/work-orders-data";
import { initialAppointmentsData, initialBaysData } from "@/lib/demo-data/appointments-data";

describe("Check-ins and Work Orders Integrity", () => {
  it("ensures every completed check-in has the roof photo validated", () => {
    expect(initialCheckinsData.length).toBeGreaterThan(0);

    for (const checkin of initialCheckinsData) {
      expect(checkin.hasRoofPhoto).toBe(true);

      const hasRoofPhotoInGallery = checkin.photos.some(
        (p) => p.angle === "roof"
      );
      expect(hasRoofPhotoInGallery).toBe(true);
    }
  });

  it("contains 4 active work orders matching live workshop state", () => {
    expect(initialWorkOrdersData).toHaveLength(4);

    const bmw = initialWorkOrdersData.find((wo) => wo.vehiclePlate === "44-TX-88");
    expect(bmw).toBeDefined();
    expect(bmw?.progressPercentage).toBe(65);
    expect(bmw?.primaryTechnicianName).toBe("João Martins");

    const mercedes = initialWorkOrdersData.find((wo) => wo.vehiclePlate === "78-MB-22");
    expect(mercedes).toBeDefined();
    expect(mercedes?.status).toBe("waiting_parts");
  });

  it("has 4 configured workshop bays and 6 appointments", () => {
    expect(initialBaysData).toHaveLength(4);
    expect(initialAppointmentsData).toHaveLength(6);
  });
});
