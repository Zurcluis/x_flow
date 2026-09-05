import { describe, it, expect } from "vitest";
import {
  initialInvoicesData,
  initialDeliveriesData,
  initialWarrantiesData,
  initialBMWPassport,
} from "@/lib/demo-data/finance-deliveries-data";

describe("Finance, Deliveries, Warranties & Passport Datasets Integrity", () => {
  it("should have valid invoices with 23% VAT and matching line totals", () => {
    expect(initialInvoicesData.length).toBeGreaterThan(0);
    const invoice1 = initialInvoicesData[0];
    expect(invoice1.invoiceNumber).toBe("FT 2026/042");
    expect(invoice1.subtotal).toBe(4000.0);
    expect(invoice1.vatAmount).toBe(920.0);
    expect(invoice1.totalAmount).toBe(4920.0);
    expect(invoice1.paymentStatus).toBe("paid");
  });

  it("should have complete delivery with signature and returned belongings", () => {
    const delivery = initialDeliveriesData[0];
    expect(delivery.vehiclePlate).toBe("44-TX-88");
    expect(delivery.receiverName).toBe("Miguel Ângelo Costa");
    expect(delivery.belongingsReturnedConfirmed).toBe(true);
    expect(delivery.belongings.length).toBe(2);
  });

  it("should have active warranty with 10 years and maintenance rules", () => {
    const warranty = initialWarrantiesData[0];
    expect(warranty.vehiclePlate).toBe("44-TX-88");
    expect(warranty.warrantyYears).toBe(10);
    expect(warranty.maintenanceRules.length).toBe(4);
  });

  it("should have full 360-degree vehicle passport with 7 lifecycle events", () => {
    expect(initialBMWPassport.plate).toBe("44-TX-88");
    expect(initialBMWPassport.events.length).toBe(7);
    expect(initialBMWPassport.events[0].type).toBe("checkin");
    expect(initialBMWPassport.events[6].type).toBe("warranty");
  });
});
