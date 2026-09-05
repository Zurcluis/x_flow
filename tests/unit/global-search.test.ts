import { describe, it, expect } from "vitest";
import {
  searchGlobalIndex,
  registerDynamicSearchItems,
} from "@/domains/search/global-search-engine";

describe("X-Flow Global Search Engine — Omnibox & Command Palette", () => {
  it("finds vehicles by formatted and unformatted license plate", () => {
    const byFormatted = searchGlobalIndex("44-TX-88");
    expect(byFormatted.length).toBeGreaterThan(0);
    expect(byFormatted[0].title).toContain("BMW M4");

    const byUnformatted = searchGlobalIndex("44tx88");
    expect(byUnformatted.length).toBeGreaterThan(0);
    expect(byUnformatted[0].title).toContain("44-TX-88");
  });

  it("finds customer by name and phone number", () => {
    const byName = searchGlobalIndex("AutoStand Prime");
    expect(byName.length).toBeGreaterThan(0);
    expect(byName.some((r) => r.category === "customers")).toBe(true);

    const byPhone = searchGlobalIndex("912345678");
    expect(byPhone.length).toBeGreaterThan(0);
    expect(byPhone[0].title).toContain("AutoStand Prime");
  });

  it("finds quotes and work orders by their official identification numbers", () => {
    const quoteResults = searchGlobalIndex("ORC-2026-042");
    expect(quoteResults.length).toBeGreaterThan(0);
    expect(quoteResults[0].category).toBe("quotes");

    const woResults = searchGlobalIndex("OT-2026-042");
    expect(woResults.length).toBeGreaterThan(0);
    expect(woResults.some((r) => r.category === "production")).toBe(true);
  });

  it("finds stock materials by batch number and tools by QR code", () => {
    const stockResults = searchGlobalIndex("STK-2026-04A");
    expect(stockResults.length).toBeGreaterThan(0);
    expect(stockResults[0].category).toBe("stock");

    const toolResults = searchGlobalIndex("QR-TOOL-01");
    expect(toolResults.length).toBeGreaterThan(0);
    expect(toolResults[0].category).toBe("tools");
  });

  it("finds invoices and warranties by official document numbers", () => {
    const invoiceResults = searchGlobalIndex("FT 2026/042");
    expect(invoiceResults.length).toBeGreaterThan(0);
    expect(invoiceResults.some((r) => r.category === "invoices")).toBe(true);

    const warrantyResults = searchGlobalIndex("QC-2026-44TX88-PASS");
    expect(warrantyResults.length).toBeGreaterThan(0);
    expect(warrantyResults.some((r) => r.category === "warranties")).toBe(true);
  });

  it("finds system pages and navigation routes by keywords", () => {
    const visionResults = searchGlobalIndex("vision");
    expect(visionResults.some((r) => r.href.includes("/vision"))).toBe(true);

    const simulatorResults = searchGlobalIndex("simulador");
    expect(simulatorResults.some((r) => r.href.includes("/simulator"))).toBe(true);

    const timebookResults = searchGlobalIndex("time book");
    expect(timebookResults.some((r) => r.href.includes("/time-book"))).toBe(true);
  });

  it("supports extensible registration of new future pages and entities", () => {
    registerDynamicSearchItems([
      {
        id: "future-custom-module-1",
        title: "Academia X-Motion & Certificações",
        subtitle: "Módulo de formação contínua de instaladores e manuais SOP",
        category: "pages",
        categoryLabel: "Novo Módulo",
        href: "/academy",
        badge: "Academia",
        badgeVariant: "gold",
        keywords: ["academia", "formacao", "cursos", "sop", "certificacao"],
      },
    ]);

    const results = searchGlobalIndex("formacao");
    expect(results.some((r) => r.id === "future-custom-module-1")).toBe(true);
    expect(results.find((r) => r.id === "future-custom-module-1")?.href).toBe("/academy");
  });
});
