import { describe, it, expect } from "vitest";
import { MASTER_BODY_PARTS } from "@/domains/catalog/parts-catalog";
import { FINISH_MULTIPLIERS } from "@/domains/catalog/types";
import { roundTo2Decimals } from "@/domains/quotes/pricing-engine";
import { resolveDraftEditMode } from "@/domains/quotes/draft-mapping";
import type { DraftQuoteData, DraftQuoteOption } from "@/domains/quotes/types";
import type { QuoteCostLine, ServiceLine } from "@/domains/pricing/types";

const serviceLine = (name = "Serviço", hours = 8): ServiceLine => ({
  name,
  description: null,
  mode: "complete",
  hours,
  notes: null,
  sortOrder: 0,
});

const materialLine = (): QuoteCostLine => ({
  lineType: "material",
  name: "Película",
  quantity: 10,
  unit: "m2",
  unitCost: 20,
  wasteRatePercent: 15,
  totalCost: 230,
  kitId: null,
  supplierServiceId: null,
  materialId: null,
  deductedHours: null,
  notes: null,
  sortOrder: 0,
});

const flexibleOption = (overrides: Partial<DraftQuoteOption> = {}): DraftQuoteOption => ({
  optionId: "opt-1",
  kind: "flexible",
  tier: "recommended",
  name: "Serviço",
  discountRate: 0,
  serviceLines: [serviceLine()],
  costLines: [],
  items: [],
  adjustKind: "none",
  adjustValue: 0,
  adjustReason: null,
  ...overrides,
});

const configuratorItem = (code: string, finish: string, segmentMultiplier = 1.0) => {
  const part = MASTER_BODY_PARTS.find((p) => p.code === code);
  if (!part) throw new Error(`Peça desconhecida: ${code}`);
  const multiplier = FINISH_MULTIPLIERS[finish] ?? 1;
  const unitPrice = roundTo2Decimals(part.basePrice * segmentMultiplier * multiplier);
  return {
    serviceName: "Aplicação de Película PPF",
    bodyPartCode: part.code,
    bodyPartName: part.namePt,
    materialName: "Stek DYNOshield Gloss",
    areaM2: part.defaultAreaM2,
    laborHours: part.baseLaborHours,
    unitPrice,
    totalPrice: unitPrice,
  };
};

const configuratorOption = (
  tier: DraftQuoteOption["tier"],
  codes: string[],
  finish: string,
  segmentMultiplier = 1.0
): DraftQuoteOption => ({
  optionId: `opt-${tier}`,
  kind: "configurator",
  tier,
  name: `Opção ${tier}`,
  discountRate: 5,
  serviceLines: [],
  costLines: [],
  items: codes.map((code) => configuratorItem(code, finish, segmentMultiplier)),
  adjustKind: "none",
  adjustValue: 0,
  adjustReason: null,
});

const draftOf = (options: DraftQuoteOption[]): DraftQuoteData => ({
  quoteId: "q-1",
  quoteNumber: "ORC-2026-001",
  status: "draft",
  vehicleId: "v-1",
  customerId: "c-1",
  notes: "Nota interna",
  options,
});

describe("resolveDraftEditMode — flexível", () => {
  it("mapeia linhas de serviço, custos e preço manual", () => {
    const result = resolveDraftEditMode(
      draftOf([
        flexibleOption({
          serviceLines: [
            { name: "Wrap completo", description: "Frente e laterais", mode: "complete", hours: 32, notes: null, sortOrder: 0 },
          ],
          costLines: [materialLine()],
          adjustKind: "manual_price",
          adjustValue: 2200,
          adjustReason: "Preço comercial",
        }),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("flexible");
    if (result.kind !== "flexible") return;
    expect(result.state.serviceLines).toHaveLength(1);
    expect(result.state.serviceLines[0].name).toBe("Wrap completo");
    expect(result.state.serviceLines[0].hours).toBe(32);
    expect(result.state.costLines[0].totalCost).toBe(230);
    expect(result.state.finalPriceInput).toBe("2200");
    expect(result.state.adjustReason).toBe("Preço comercial");
  });

  it("sem preço manual devolve input vazio", () => {
    const result = resolveDraftEditMode(draftOf([flexibleOption()]), "coupe");
    expect(result.kind).toBe("flexible");
    if (result.kind !== "flexible") return;
    expect(result.state.finalPriceInput).toBe("");
    expect(result.state.adjustReason).toBe("");
  });

  it("rascunho sem linhas de serviço não é editável", () => {
    const result = resolveDraftEditMode(draftOf([flexibleOption({ serviceLines: [] })]), "coupe");
    expect(result.kind).toBe("not_editable");
  });

  it("mais do que uma opção flexível não é editável", () => {
    const result = resolveDraftEditMode(draftOf([flexibleOption(), flexibleOption()]), "coupe");
    expect(result.kind).toBe("not_editable");
  });

  it("mistura de modos não é editável", () => {
    const result = resolveDraftEditMode(
      draftOf([flexibleOption(), configuratorOption("essential", ["hood"], "gloss")]),
      "coupe"
    );
    expect(result.kind).toBe("not_editable");
  });

  it("rascunho sem opções não é editável", () => {
    const result = resolveDraftEditMode(draftOf([]), "coupe");
    expect(result.kind).toBe("not_editable");
  });
});

describe("resolveDraftEditMode — configurador", () => {
  it("reconstrói peças, acabamento gloss e desconto", () => {
    const result = resolveDraftEditMode(
      draftOf([
        configuratorOption("essential", ["hood", "front_bumper"], "gloss"),
        configuratorOption("recommended", ["hood", "front_bumper", "headlights"], "gloss"),
        configuratorOption("premium", ["hood", "roof"], "gloss"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("configurator");
    if (result.kind !== "configurator") return;
    expect(result.state.finish).toBe("gloss");
    expect(result.state.discountRate).toBe(5);
    expect(result.state.essentialParts).toEqual(["hood", "front_bumper"]);
    expect(result.state.recommendedParts).toEqual(["hood", "front_bumper", "headlights"]);
    expect(result.state.premiumParts).toEqual(["hood", "roof"]);
  });

  it("deteta acabamento matte pelos preços guardados", () => {
    const result = resolveDraftEditMode(
      draftOf([
        configuratorOption("essential", ["hood"], "matte"),
        configuratorOption("recommended", ["hood"], "matte"),
        configuratorOption("premium", ["hood"], "matte"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("configurator");
    if (result.kind !== "configurator") return;
    expect(result.state.finish).toBe("matte");
  });

  it("deteta acabamento color_ppf", () => {
    const result = resolveDraftEditMode(
      draftOf([
        configuratorOption("essential", ["hood"], "color_ppf"),
        configuratorOption("recommended", ["hood"], "color_ppf"),
        configuratorOption("premium", ["hood"], "color_ppf"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("configurator");
    if (result.kind !== "configurator") return;
    expect(result.state.finish).toBe("color_ppf");
  });

  it("aplica o multiplicador do segmento da viatura", () => {
    const result = resolveDraftEditMode(
      draftOf([
        configuratorOption("essential", ["hood"], "gloss", 1.25),
        configuratorOption("recommended", ["hood"], "gloss", 1.25),
        configuratorOption("premium", ["hood"], "gloss", 1.25),
      ]),
      "suv"
    );
    expect(result.kind).toBe("configurator");
  });

  it("peça desconhecida não é editável", () => {
    const custom = configuratorOption("essential", ["hood"], "gloss");
    custom.items[0].bodyPartCode = "part_inexistente";
    const result = resolveDraftEditMode(
      draftOf([
        custom,
        configuratorOption("recommended", ["hood"], "gloss"),
        configuratorOption("premium", ["hood"], "gloss"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("not_editable");
  });

  it("preços inconsistentes com qualquer acabamento não são editáveis", () => {
    const custom = configuratorOption("essential", ["hood"], "gloss");
    custom.items[0].unitPrice = 999.99;
    custom.items[0].totalPrice = 999.99;
    const result = resolveDraftEditMode(
      draftOf([
        custom,
        configuratorOption("recommended", ["hood"], "gloss"),
        configuratorOption("premium", ["hood"], "gloss"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("not_editable");
  });

  it("opções sem itens não são editáveis", () => {
    const empty = configuratorOption("essential", ["hood"], "gloss");
    empty.items = [];
    const result = resolveDraftEditMode(
      draftOf([
        empty,
        configuratorOption("recommended", ["hood"], "gloss"),
        configuratorOption("premium", ["hood"], "gloss"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("not_editable");
  });

  it("falta um tier não é editável", () => {
    const result = resolveDraftEditMode(
      draftOf([
        configuratorOption("essential", ["hood"], "gloss"),
        configuratorOption("premium", ["hood"], "gloss"),
      ]),
      "coupe"
    );
    expect(result.kind).toBe("not_editable");
  });
});
