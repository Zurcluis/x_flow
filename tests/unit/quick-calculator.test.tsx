import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  buildQuickCalculatorPrefill,
  calculateQuickQuote,
  createQuickLineFromPreset,
  decodeQuickCalculatorPrefill,
  encodeQuickCalculatorPrefill,
  EXCEL_DEFAULT_FIXED_HOURLY_COST,
  formatQuickQuoteSummaryText,
} from "@/domains/pricing/quick-calculator";
import { navSectionsForRole } from "@/components/xflow/Sidebar";
import { QuickCalculatorView } from "@/app/quotes/calculator/QuickCalculatorView";
import { AppShell } from "@/components/xflow/AppShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Quick Calculator domain engine", () => {
  it("reproduces the exact X-Motion spreadsheet math (hours, material, hourly margin, 23% VAT)", () => {
    const result = calculateQuickQuote({
      fixedHourlyCost: EXCEL_DEFAULT_FIXED_HOURLY_COST,
      vatRate: 23,
      discountRate: 0,
      lines: [
        {
          id: "l1",
          serviceId: "car_wrapping",
          serviceName: "Car Wrapping",
          hours: 22,
          materialId: "custom",
          materialName: "Material",
          materialUnit: "linear_meter",
          materialUnitPrice: 27.72,
          materialQuantity: 17,
          wasteRatePercent: 0,
          marginValue: 24.18,
          marginUnit: "per_hour",
        },
      ],
    });

    expect(result.totalLaborCost).toBe(757.68);
    expect(result.totalMaterialCost).toBe(471.24);
    expect(result.totalProfitMargin).toBe(531.96);
    expect(result.finalPriceBeforeVat).toBe(1760.88);
    expect(result.vatAmount).toBe(405);
    expect(result.finalPriceWithVat).toBe(2165.88);
  });

  it("supports multiple services with distinct margin units (per_hour, flat, per_unit), waste and discount", () => {
    const result = calculateQuickQuote({
      fixedHourlyCost: 34.44,
      vatRate: 23,
      discountRate: 10,
      lines: [
        {
          id: "l1",
          serviceId: "chrome_delete",
          serviceName: "Chrome Delete",
          hours: 3,
          materialId: "chrome_delete",
          materialName: "Chrome Delete",
          materialUnit: "linear_meter",
          materialUnitPrice: 1,
          materialQuantity: 10,
          wasteRatePercent: 10, // 10 * 1 * 1.1 = 11.00
          marginValue: 93.78,
          marginUnit: "flat",
        },
        {
          id: "l2",
          serviceId: "pintura_pincas",
          serviceName: "Pintura de Pinças",
          hours: 4,
          materialId: "spray_pinca",
          materialName: "Spray (por pinça)",
          materialUnit: "unit",
          materialUnitPrice: 10,
          materialQuantity: 4,
          wasteRatePercent: 0, // 4 * 10 = 40.00
          marginValue: 36.52,
          marginUnit: "per_unit", // 4 * 36.52 = 146.08
        },
      ],
    });

    expect(result.totalHours).toBe(7);
    expect(result.totalLaborCost).toBe(241.08);
    expect(result.totalMaterialCost).toBe(51);
    expect(result.totalProfitMargin).toBe(239.86);
    expect(result.subtotalBeforeVat).toBe(531.94);
    expect(result.discountAmount).toBe(53.19);
    expect(result.finalPriceBeforeVat).toBe(478.75);
    expect(result.vatAmount).toBe(110.11);
    expect(result.finalPriceWithVat).toBe(588.86);
  });

  it("round-trips prefill payload safely and rejects malformed payloads", () => {
    const line = createQuickLineFromPreset("full_ppf", "l1");
    line.hours = 10;
    line.materialQuantity = 12;
    const input = {
      fixedHourlyCost: 34.44,
      vatRate: 23,
      discountRate: 0,
      lines: [line],
    };
    const result = calculateQuickQuote(input);
    const prefill = buildQuickCalculatorPrefill(input, result);
    const encoded = encodeQuickCalculatorPrefill(prefill);
    const decoded = decodeQuickCalculatorPrefill(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.serviceLines[0].name).toBe("Full PPF");
    expect(decoded?.costLines[0].name).toBe("Full PPF");
    expect(decoded?.finalPriceBeforeVat).toBe(result.finalPriceBeforeVat);
    expect(decodeQuickCalculatorPrefill("invalid%%%")).toBeNull();

    const text = formatQuickQuoteSummaryText(input, result);
    expect(text).toContain("Estimativa X-Motion");
    expect(text).toContain("Full PPF");
  });
});

describe("Quick Calculator RBAC & Mobile Navigation", () => {
  it("exposes Calculadora in Sidebar only to admin and workshop_manager", () => {
    const adminHrefs = navSectionsForRole("admin").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    const managerHrefs = navSectionsForRole("workshop_manager").flatMap((s) =>
      s.items.map((i) => i.href)
    );
    const techHrefs = navSectionsForRole("technician").flatMap((s) =>
      s.items.map((i) => i.href)
    );

    expect(adminHrefs).toContain("/quotes/calculator");
    expect(managerHrefs).toContain("/quotes/calculator");
    expect(techHrefs).not.toContain("/quotes/calculator");
  });

  it("renders mobile header 1-tap shortcut for management roles and hides it for technicians", () => {
    const { rerender } = render(
      <AppShell
        user={{ name: "Admin", email: "admin@xmotion.pt", role: "admin" }}
      >
        <div>Conteúdo</div>
      </AppShell>
    );

    expect(screen.getByLabelText("Calculadora Rápida")).toBeInTheDocument();

    rerender(
      <AppShell
        user={{ name: "Técnico", email: "tech@xmotion.pt", role: "technician" }}
      >
        <div>Conteúdo</div>
      </AppShell>
    );

    expect(screen.queryByLabelText("Calculadora Rápida")).not.toBeInTheDocument();
  });

  it("allows adding services and updating totals interactively in QuickCalculatorView", () => {
    render(
      <QuickCalculatorView
        initialFixedHourlyCost={34.44}
        policyHourlyCost={null}
        initialVatRate={23}
        defaultWasteRate={0}
        stockMaterials={[]}
      />
    );

    expect(screen.getByText("Calculadora Rápida")).toBeInTheDocument();
    const addChromeDelete = screen.getByRole("button", { name: "Chrome Delete" });
    fireEvent.click(addChromeDelete);

    expect(screen.getByText(/2 serviços/)).toBeInTheDocument();
    expect(screen.getByLabelText("Remover serviço 2")).toBeInTheDocument();
  });
});
