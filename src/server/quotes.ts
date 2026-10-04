import { getDb } from "@/lib/db";
import { getPrimaryOrganizationId } from "@/server/org";
import type { PoolClient } from "pg";
import {
  OptionTier,
  PublicQuote,
  PublicQuoteOption,
  PublicQuoteOptionLine,
  Quote,
  QuoteEvent,
  QuoteOption,
  QuoteStatus,
  type CreateQuoteCostLine,
  type CreateQuoteInput,
  type CreateQuoteServiceLine,
  type DraftQuoteData,
  type DraftQuoteOption,
  type QuoteOptionInput,
  type QuoteOptionItemInput,
} from "@/domains/quotes/types";
import { calculateOptionFinancials, type PricingFinancials } from "@/domains/quotes/pricing-engine";
import {
  computeFinalFinancials,
  computeSuggestion,
  resolvePricingContext,
  round2,
  validateQuotePricing,
} from "@/domains/pricing/engine";
import { loadPricingContext, type PricingFormulaSummary } from "@/server/pricing";
import {
  buildPhasePlan,
  insertPlannedPhases,
  loadFlexibleOptionPhasePlanData,
} from "@/server/production-phases-map";
import type {
  AdjustKind,
  ConsumableKit,
  FinalFinancials,
  PricingExpenseItem,
  PricingFormulaVersion,
  PricingPolicy,
  PricingRates,
  QuoteCostLine,
  ServiceLine,
  SuggestionResult,
  SupplierService,
} from "@/domains/pricing/types";

export type { CreateQuoteInput, DraftQuoteData, DraftQuoteOption, QuoteOptionInput } from "@/domains/quotes/types";

type Row = Record<string, unknown>;

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function mapOption(row: Row): QuoteOption {
  return {
    id: String(row.id),
    quoteId: String(row.quote_id),
    tier: row.tier as OptionTier,
    name: String(row.name),
    description: (row.description as string) ?? "",
    isRecommended: Boolean(row.is_recommended),
    warrantyYears: num(row.warranty_years),
    subtotal: num(row.subtotal),
    discountRate: num(row.discount_rate),
    discountAmount: num(row.discount_amount),
    taxableBase: num(row.taxable_base),
    vatRate: num(row.vat_rate),
    vatAmount: num(row.vat_amount),
    totalWithVat: num(row.total_with_vat),
    estimatedCost: num(row.estimated_cost),
    estimatedMarginAmount: num(row.estimated_margin_amount),
    estimatedMarginPercentage: num(row.estimated_margin_percentage),
    estimatedHours: num(row.estimated_hours),
    items: [],
  };
}

function mapQuote(row: Row): Quote {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    quoteNumber: String(row.quote_number),
    vehicleId: String(row.vehicle_id),
    vehiclePlate: String(row.vehicle_plate ?? ""),
    vehicleModel: String(row.vehicle_model ?? ""),
    vehicleYear: num(row.vehicle_year),
    vehicleColor: String(row.vehicle_color ?? ""),
    customerId: String(row.customer_id),
    customerName: String(row.customer_name ?? ""),
    customerEmail: String(row.customer_email ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    customerType: (row.customer_type as "individual" | "business") ?? "individual",
    status: row.status as QuoteStatus,
    selectedOptionId: row.selected_option_id ? String(row.selected_option_id) : undefined,
    publicToken: String(row.public_token),
    expiresAt: iso(row.expires_at),
    notes: (row.notes as string) ?? undefined,
    createdBy: row.created_by ? String(row.created_by) : "",
    approvedAt: row.approved_at ? iso(row.approved_at) : undefined,
    approvedByName: (row.approved_by_name as string) ?? undefined,
    options: [],
    events: [],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

const QUOTE_JOINS = `
  FROM quotes q
  JOIN vehicles v ON v.id = q.vehicle_id
  JOIN customers c ON c.id = q.customer_id`;

export async function listQuotes(organizationId: string): Promise<Quote[]> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT q.*, v.plate_display AS vehicle_plate, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year AS vehicle_year, v.original_color_name AS vehicle_color,
            c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
            c.type AS customer_type
     ${QUOTE_JOINS}
     WHERE q.organization_id = $1
     ORDER BY q.created_at DESC`,
    [organizationId]
  );
  if (rows.length === 0) return [];

  const { rows: optionRows } = await db.query<Row>(
    `SELECT o.* FROM quote_options o
     JOIN quotes q ON q.id = o.quote_id
     WHERE q.organization_id = $1 ORDER BY o.created_at`,
    [organizationId]
  );
  const optionsByQuote = new Map<string, QuoteOption[]>();
  for (const r of optionRows) {
    const qid = String(r.quote_id);
    if (!optionsByQuote.has(qid)) optionsByQuote.set(qid, []);
    optionsByQuote.get(qid)!.push(mapOption(r));
  }

  return rows.map((r) => {
    const q = mapQuote(r);
    q.options = optionsByQuote.get(q.id) ?? [];
    return q;
  });
}

export async function getQuoteById(
  organizationId: string,
  quoteId: string
): Promise<Quote | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT q.*, v.plate_display AS vehicle_plate, v.make || ' ' || v.model AS vehicle_model,
            v.generation_year AS vehicle_year, v.original_color_name AS vehicle_color,
            c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
            c.type AS customer_type
     ${QUOTE_JOINS}
     WHERE q.organization_id = $1 AND q.id = $2`,
    [organizationId, quoteId]
  );
  if (rows.length === 0) return null;
  const quote = mapQuote(rows[0]);

  const { rows: optionRows } = await db.query<Row>(
    `SELECT o.* FROM quote_options o WHERE o.quote_id = $1 ORDER BY o.created_at`,
    [quoteId]
  );
  quote.options = optionRows.map(mapOption);

  const { rows: itemRows } = await db.query<Row>(
    `SELECT i.* FROM quote_option_items i JOIN quote_options o ON o.id = i.quote_option_id WHERE o.quote_id = $1`,
    [quoteId]
  );
  for (const opt of quote.options) {
    opt.items = itemRows
      .filter((i) => String(i.quote_option_id) === opt.id)
      .map((i) => ({
        id: String(i.id),
        serviceName: String(i.service_name),
        bodyPartCode: String(i.body_part_code),
        bodyPartName: String(i.body_part_name),
        materialName: String(i.material_name),
        areaM2: num(i.area_m2),
        laborHours: num(i.labor_hours),
        unitPrice: num(i.unit_price),
        totalPrice: num(i.total_price),
      }));
  }

  const { rows: eventRows } = await db.query<Row>(
    `SELECT * FROM quote_events WHERE quote_id = $1 ORDER BY created_at DESC`,
    [quoteId]
  );
  quote.events = eventRows.map<QuoteEvent>((r) => ({
    id: String(r.id),
    quoteId: String(r.quote_id),
    eventType: r.event_type as QuoteEvent["eventType"],
    description: String(r.description),
    authorName: (r.author_name as string) ?? undefined,
    createdAt: iso(r.created_at),
  }));

  return quote;
}

const PRICING_NOT_CONFIGURED_ERROR =
  "Configura a base financeira em Configurações → Orçamentos e preços antes de criar orçamentos.";

interface PreparedFlexibleOption {
  kind: "flexible";
  input: QuoteOptionInput;
  serviceLines: ServiceLine[];
  costLines: QuoteCostLine[];
  formula: PricingFormulaVersion;
  suggestion: SuggestionResult;
  financials: FinalFinancials;
}

interface PreparedConfiguratorOption {
  kind: "configurator";
  input: QuoteOptionInput;
  items: QuoteOptionItemInput[];
  financials: PricingFinancials;
}

type PreparedOption = PreparedFlexibleOption | PreparedConfiguratorOption;

interface OptionValues {
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxableBase: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  estimatedCost: number;
  estimatedMarginAmount: number;
  estimatedMarginPercentage: number;
  estimatedHours: number;
}

function mapServiceLine(line: CreateQuoteServiceLine): ServiceLine {
  return {
    name: line.name,
    description: line.description ?? null,
    mode: line.mode,
    hours: line.hours,
    notes: line.notes ?? null,
    sortOrder: line.sortOrder,
  };
}

function normalizeCostLine(
  line: CreateQuoteCostLine,
  kits: ConsumableKit[],
  supplierServices: SupplierService[],
  materialCosts: Map<string, number>
): QuoteCostLine {
  const quantity = line.quantity;
  const notes = line.notes ?? null;
  const sortOrder = line.sortOrder;
  const deductedHours =
    line.lineType === "sublet" ? line.deductedHours ?? null : null;

  if (line.lineType === "material") {
    let unitCost = line.unitCost;
    if (line.materialId && unitCost === 0) {
      const cost = materialCosts.get(line.materialId);
      if (cost === undefined) {
        throw new Error(`Material não encontrado na linha "${line.name}".`);
      }
      unitCost = cost;
    }
    const wasteRatePercent = line.wasteRatePercent;
    return {
      lineType: "material",
      name: line.name,
      quantity,
      unit: line.unit,
      unitCost,
      wasteRatePercent,
      totalCost: round2(quantity * unitCost * (1 + wasteRatePercent / 100)),
      kitId: null,
      supplierServiceId: null,
      materialId: line.materialId ?? null,
      deductedHours: null,
      notes,
      sortOrder,
    };
  }

  if (line.lineType === "consumable_kit") {
    const kit = kits.find((k) => k.id === line.kitId);
    if (!kit || !kit.active) {
      throw new Error(
        `Kit de consumíveis não encontrado ou inativo na linha "${line.name}".`
      );
    }
    return {
      lineType: "consumable_kit",
      name: line.name,
      quantity,
      unit: line.unit,
      unitCost: kit.price,
      wasteRatePercent: 0,
      totalCost: round2(quantity * kit.price),
      kitId: kit.id,
      supplierServiceId: null,
      materialId: null,
      deductedHours: null,
      notes,
      sortOrder,
    };
  }

  if (line.lineType === "sublet") {
    const service = supplierServices.find((s) => s.id === line.supplierServiceId);
    if (!service) {
      throw new Error(
        `Serviço subcontratado não encontrado na linha "${line.name}".`
      );
    }
    return {
      lineType: "sublet",
      name: line.name,
      quantity,
      unit: line.unit,
      unitCost: service.basePrice,
      wasteRatePercent: 0,
      totalCost: round2(service.basePrice * quantity),
      kitId: null,
      supplierServiceId: service.id,
      materialId: null,
      deductedHours,
      notes,
      sortOrder,
    };
  }

  return {
    lineType: "extra",
    name: line.name,
    quantity,
    unit: line.unit,
    unitCost: line.unitCost,
    wasteRatePercent: 0,
    totalCost: round2(quantity * line.unitCost),
    kitId: null,
    supplierServiceId: null,
    materialId: null,
    deductedHours: null,
    notes,
    sortOrder,
  };
}

function prepareFlexibleOption(
  opt: QuoteOptionInput,
  rates: PricingRates,
  formulas: PricingFormulaSummary[],
  kits: ConsumableKit[],
  supplierServices: SupplierService[],
  materialCosts: Map<string, number>
): PreparedFlexibleOption {
  const serviceLines = (opt.serviceLines ?? []).map(mapServiceLine);
  if (serviceLines.length === 0) {
    throw new Error(
      `A opção "${opt.name}" precisa de pelo menos uma linha de serviço.`
    );
  }

  const hasSpot = serviceLines.some((line) => line.mode === "spot");
  const code = hasSpot ? "spot" : "complete";
  const summary = formulas.find((f) => f.code === code && !f.isArchived);
  if (!summary || !summary.published) {
    throw new Error(
      hasSpot
        ? "Não existe fórmula publicada para serviços pontuais. Publica a fórmula em Configurações → Orçamentos e preços."
        : "Não existe fórmula publicada para serviços completos. Publica a fórmula em Configurações → Orçamentos e preços."
    );
  }
  const formula = summary.published;

  const costLines = (opt.costLines ?? []).map((line) =>
    normalizeCostLine(line, kits, supplierServices, materialCosts)
  );

  const adjustKind: AdjustKind =
    opt.adjustKind ?? (opt.manualPriceBeforeVat != null ? "manual_price" : "none");
  const adjustValue =
    adjustKind === "manual_price" ? opt.manualPriceBeforeVat ?? 0 : opt.adjustValue ?? 0;

  const validationErrors = validateQuotePricing({
    serviceLines,
    costLines,
    adjustKind,
    adjustValue,
  });
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.map((e) => e.message).join(" "));
  }

  const suggestion = computeSuggestion({ rates, formula, serviceLines, costLines });
  const financials = computeFinalFinancials({
    rates,
    formula,
    serviceLines,
    costLines,
    adjustKind,
    adjustValue,
    adjustReason: opt.adjustReason ?? undefined,
  });

  return {
    kind: "flexible",
    input: opt,
    serviceLines,
    costLines,
    formula,
    suggestion,
    financials,
  };
}

function prepareConfiguratorOption(opt: QuoteOptionInput): PreparedConfiguratorOption {
  const items = opt.items ?? [];
  const financials = calculateOptionFinancials(items, opt.discountRate ?? 0);
  return { kind: "configurator", input: opt, items, financials };
}

interface PreparedQuoteContext {
  policy: PricingPolicy | null;
  rates: PricingRates | null;
  expenseItems: PricingExpenseItem[];
  prepared: PreparedOption[];
}

async function prepareQuoteOptions(
  organizationId: string,
  input: CreateQuoteInput
): Promise<PreparedQuoteContext> {
  const hasFlexible = input.options.some((opt) => opt.kind === "flexible");

  const context = await loadPricingContext(organizationId);
  const policy = context.policy;
  let rates: PricingRates | null = null;
  if (hasFlexible) {
    if (!policy) {
      throw new Error(PRICING_NOT_CONFIGURED_ERROR);
    }
    rates = resolvePricingContext({ policy, expenseItems: context.expenseItems });
  } else if (policy) {
    try {
      rates = resolvePricingContext({ policy, expenseItems: context.expenseItems });
    } catch {
      rates = null;
    }
  }

  const materialCosts = new Map<string, number>();
  const materialIds = new Set<string>();
  for (const opt of input.options) {
    for (const line of opt.costLines ?? []) {
      if (line.lineType === "material" && line.materialId) {
        materialIds.add(line.materialId);
      }
    }
  }
  if (materialIds.size > 0) {
    const { rows } = await getDb().query<Row>(
      `SELECT id, cost_per_meter FROM materials
       WHERE organization_id = $1 AND id = ANY($2::uuid[])`,
      [organizationId, Array.from(materialIds)]
    );
    for (const row of rows) {
      materialCosts.set(String(row.id), Number(row.cost_per_meter));
    }
  }

  const kits = hasFlexible ? context.kits : [];
  const supplierServices = hasFlexible ? context.supplierServices : [];
  const prepared: PreparedOption[] = [];
  for (const opt of input.options) {
    if (opt.kind === "flexible") {
      if (!rates) {
        throw new Error(PRICING_NOT_CONFIGURED_ERROR);
      }
      prepared.push(
        prepareFlexibleOption(opt, rates, context.formulas, kits, supplierServices, materialCosts)
      );
    } else {
      prepared.push(prepareConfiguratorOption(opt));
    }
  }

  return { policy, rates, expenseItems: context.expenseItems, prepared };
}

export async function createQuote(
  organizationId: string,
  input: CreateQuoteInput,
  profileId?: string
): Promise<Quote> {
  if (input.options.length === 0) {
    throw new Error("O orçamento precisa de pelo menos uma opção.");
  }

  const { policy, rates, expenseItems, prepared } = await prepareQuoteOptions(
    organizationId,
    input
  );

  const db = getDb();
  const client = await db.connect();
  let quoteId: string;
  try {
    await client.query("BEGIN");

    const quoteNumber = `ORC-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const publicToken = `qt_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    const status = input.intent === "draft" ? "draft" : "sent";

    const { rows: quoteRows } = await client.query<Row>(
      `INSERT INTO quotes
        (organization_id, quote_number, vehicle_id, customer_id, status, public_token,
         expires_at, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6, NOW() + INTERVAL '30 days', $7, $8)
       RETURNING id`,
      [
        organizationId,
        quoteNumber,
        input.vehicleId,
        input.customerId,
        status,
        publicToken,
        input.notes ?? null,
        profileId ?? null,
      ]
    );
    quoteId = String(quoteRows[0].id);

    await insertPreparedOptions(client, organizationId, quoteId, {
      prepared,
      policy,
      rates,
      expenseItems,
      intent: input.intent,
      profileId,
    });

    const eventDescription =
      input.intent === "draft"
        ? "Rascunho criado"
        : "Orçamento criado e emitido — link seguro disponível";
    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'created',$2,'X-Flow')`,
      [quoteId, eventDescription]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const quote = await getQuoteById(organizationId, quoteId);
  if (!quote) throw new Error("Orçamento não encontrado após criação.");
  return quote;
}

type OptionClient = Pick<PoolClient, "query">;

interface PreparedOptionsParams {
  prepared: PreparedOption[];
  policy: PricingPolicy | null;
  rates: PricingRates | null;
  expenseItems: PricingExpenseItem[];
  intent: "draft" | "send";
  profileId?: string;
}

async function insertPreparedOptions(
  client: OptionClient,
  organizationId: string,
  quoteId: string,
  params: PreparedOptionsParams
): Promise<void> {
  const { prepared, policy, rates, expenseItems, intent, profileId } = params;
  for (const preparedOption of prepared) {
    const opt = preparedOption.input;
    const optionRows = await insertQuoteOption(
      client,
      quoteId,
      opt,
      preparedOption,
      rates
    );
    const optionId = String(optionRows[0].id);

    if (preparedOption.kind === "flexible") {
      if (!rates || !policy) {
        throw new Error(PRICING_NOT_CONFIGURED_ERROR);
      }
      const { suggestion, financials, formula } = preparedOption;

      for (const line of preparedOption.serviceLines) {
        await client.query(
          `INSERT INTO quote_service_lines
            (quote_option_id, organization_id, name, description, mode, hours, notes, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            optionId,
            organizationId,
            line.name,
            line.description ?? null,
            line.mode,
            line.hours,
            line.notes ?? null,
            line.sortOrder,
          ]
        );
      }

      for (const line of preparedOption.costLines) {
        await client.query(
          `INSERT INTO quote_cost_lines
            (quote_option_id, organization_id, line_type, name, quantity, unit, unit_cost,
             waste_rate_percent, total_cost, kit_id, supplier_service_id, material_id,
             deducted_hours, notes, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            optionId,
            organizationId,
            line.lineType,
            line.name,
            line.quantity,
            line.unit,
            line.unitCost,
            line.wasteRatePercent,
            line.totalCost,
            line.kitId ?? null,
            line.supplierServiceId ?? null,
            line.materialId ?? null,
            line.deductedHours ?? 0,
            line.notes ?? null,
            line.sortOrder,
          ]
        );
      }

      const snapshotPayload = {
        schemaVersion: 1,
        kind: "flexible",
        intent,
        policy: {
          id: policy.id,
          version: policy.version,
          method: policy.method,
          manualDailyExpenses: policy.manualDailyExpenses,
          dailyCapacityHours: policy.dailyCapacityHours,
          profitDailyTarget: policy.profitDailyTarget,
          spotSurchargePerHour: policy.spotSurchargePerHour,
          productiveDaysPerMonth: policy.productiveDaysPerMonth,
          subletFeePercent: policy.subletFeePercent,
          wasteRatePercent: policy.wasteRatePercent,
          vatRate: policy.vatRate,
        },
        rates,
        expenseItems: expenseItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          kind: item.kind,
          monthlyEquivalent: item.monthlyEquivalent,
          includedInPricing: item.includedInPricing,
          version: item.version,
        })),
        formula: {
          id: formula.id,
          code: formula.code,
          name: formula.name,
          version: formula.version,
        },
        serviceLines: preparedOption.serviceLines,
        costLines: preparedOption.costLines,
        breakdown: suggestion.breakdown,
        costSummary: suggestion.costSummary,
        suggestedPriceBeforeVat: suggestion.suggestedPriceBeforeVat,
        adjust: {
          kind: financials.adjustKind,
          value: financials.adjustValue,
          reason: opt.adjustReason ?? null,
        },
        priceBeforeVat: financials.priceBeforeVat,
        vatAmount: financials.vatAmount,
        totalWithVat: financials.totalWithVat,
        operationalResult: financials.operationalResult,
        balanceAfterBase: financials.balanceAfterBase,
        operationalAttributed: financials.operationalAttributed,
        aggregatedAttributed: financials.aggregatedAttributed,
        dataQuality: financials.dataQuality,
      };

      await client.query(
        `INSERT INTO quote_pricing_snapshots
          (organization_id, quote_id, quote_option_id, revision, policy_id, policy_version,
           formula_version_id, payload, suggested_price, manual_price, adjust_kind, adjust_value,
           price_before_vat, vat_rate, vat_amount, total_with_vat, schema_version, created_by, reason)
         VALUES ($1,$2,$3,1,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,1,$16,$17)`,
        [
          organizationId,
          quoteId,
          optionId,
          policy.id,
          policy.version,
          formula.id,
          JSON.stringify(snapshotPayload),
          suggestion.suggestedPriceBeforeVat,
          financials.adjustKind === "manual_price" ? financials.priceBeforeVat : null,
          financials.adjustKind,
          financials.adjustValue,
          financials.priceBeforeVat,
          rates.vatRate,
          financials.vatAmount,
          financials.totalWithVat,
          profileId ?? null,
          opt.adjustReason ?? null,
        ]
      );
    } else {
      for (const item of preparedOption.items) {
        await client.query(
          `INSERT INTO quote_option_items
            (quote_option_id, service_name, body_part_code, body_part_name,
             material_name, area_m2, labor_hours, unit_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            optionId,
            item.serviceName,
            item.bodyPartCode,
            item.bodyPartName,
            item.materialName,
            item.areaM2,
            item.laborHours,
            item.unitPrice,
            item.totalPrice,
          ]
        );
      }

      const snapshotPayload = {
        schemaVersion: 1,
        kind: "configurator",
        items: preparedOption.items,
        financials: preparedOption.financials,
        rates,
      };

      await client.query(
        `INSERT INTO quote_pricing_snapshots
          (organization_id, quote_id, quote_option_id, revision, policy_id, policy_version,
           payload, schema_version, created_by)
         VALUES ($1,$2,$3,1,$4,$5,$6,1,$7)`,
        [
          organizationId,
          quoteId,
          optionId,
          policy?.id ?? null,
          policy?.version ?? null,
          JSON.stringify(snapshotPayload),
          profileId ?? null,
        ]
      );
    }
  }
}

async function insertQuoteOption(
  client: OptionClient,
  quoteId: string,
  opt: QuoteOptionInput,
  preparedOption: PreparedOption,
  rates: PricingRates | null
): Promise<Row[]> {
  let values: OptionValues;
  if (preparedOption.kind === "flexible") {
    if (!rates) {
      throw new Error(PRICING_NOT_CONFIGURED_ERROR);
    }
    const { suggestion, financials } = preparedOption;
    const discountRate =
      financials.adjustKind === "percent_discount" ? financials.adjustValue : 0;
    const discountAmount =
      financials.adjustKind === "percent_discount"
        ? round2((suggestion.suggestedPriceBeforeVat * financials.adjustValue) / 100)
        : 0;
    const estimatedCost = round2(
      suggestion.costSummary.totalDirectCost + financials.aggregatedAttributed
    );
    const estimatedMarginAmount = round2(financials.priceBeforeVat - estimatedCost);
    values = {
      subtotal: suggestion.suggestedPriceBeforeVat,
      discountRate,
      discountAmount,
      taxableBase: financials.priceBeforeVat,
      vatRate: round2(rates.vatRate / 100),
      vatAmount: financials.vatAmount,
      totalWithVat: financials.totalWithVat,
      estimatedCost,
      estimatedMarginAmount,
      estimatedMarginPercentage:
        financials.priceBeforeVat > 0
          ? round2((estimatedMarginAmount / financials.priceBeforeVat) * 100)
          : 0,
      estimatedHours: suggestion.costSummary.billedHours,
    };
  } else {
    const financials = preparedOption.financials;
    values = {
      subtotal: financials.subtotal,
      discountRate: financials.discountRate,
      discountAmount: financials.discountAmount,
      taxableBase: financials.taxableBase,
      vatRate: financials.vatRate,
      vatAmount: financials.vatAmount,
      totalWithVat: financials.totalWithVat,
      estimatedCost: financials.estimatedCost,
      estimatedMarginAmount: financials.estimatedMarginAmount,
      estimatedMarginPercentage: financials.estimatedMarginPercentage,
      estimatedHours: financials.estimatedHours,
    };
  }

  const { rows } = await client.query<Row>(
    `INSERT INTO quote_options
      (quote_id, tier, name, description, is_recommended, warranty_years,
       subtotal, discount_rate, discount_amount, taxable_base, vat_rate,
       vat_amount, total_with_vat, estimated_cost, estimated_margin_amount,
       estimated_margin_percentage, estimated_hours)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING id`,
    [
      quoteId,
      opt.tier,
      opt.name,
      opt.description ?? null,
      opt.isRecommended ?? false,
      opt.warrantyYears ?? 5,
      values.subtotal,
      values.discountRate,
      values.discountAmount,
      values.taxableBase,
      values.vatRate,
      values.vatAmount,
      values.totalWithVat,
      values.estimatedCost,
      values.estimatedMarginAmount,
      values.estimatedMarginPercentage,
      values.estimatedHours,
    ]
  );
  return rows;
}

export async function updateDraftQuote(
  organizationId: string,
  quoteId: string,
  input: CreateQuoteInput,
  profileId?: string
): Promise<Quote> {
  if (input.options.length === 0) {
    throw new Error("O orçamento precisa de pelo menos uma opção.");
  }

  const { policy, rates, expenseItems, prepared } = await prepareQuoteOptions(
    organizationId,
    input
  );

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: quoteRows } = await client.query<Row>(
      `SELECT id, status FROM quotes WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [quoteId, organizationId]
    );
    if (quoteRows.length === 0) {
      throw new Error("Orçamento não encontrado.");
    }
    if (quoteRows[0].status !== "draft") {
      throw new Error(
        "Só é possível editar rascunhos — este orçamento já foi enviado ou aprovado."
      );
    }

    await client.query(`DELETE FROM quote_pricing_snapshots WHERE quote_id = $1`, [quoteId]);
    await client.query(`DELETE FROM quote_options WHERE quote_id = $1`, [quoteId]);

    const status = input.intent === "draft" ? "draft" : "sent";
    if (input.intent === "send") {
      await client.query(
        `UPDATE quotes
         SET vehicle_id = $2, customer_id = $3, notes = $4, status = $5,
             expires_at = NOW() + INTERVAL '30 days', updated_at = NOW()
         WHERE id = $1`,
        [quoteId, input.vehicleId, input.customerId, input.notes ?? null, status]
      );
    } else {
      await client.query(
        `UPDATE quotes
         SET vehicle_id = $2, customer_id = $3, notes = $4, status = $5, updated_at = NOW()
         WHERE id = $1`,
        [quoteId, input.vehicleId, input.customerId, input.notes ?? null, status]
      );
    }

    await insertPreparedOptions(client, organizationId, quoteId, {
      prepared,
      policy,
      rates,
      expenseItems,
      intent: input.intent,
      profileId,
    });

    const eventDescription =
      input.intent === "draft"
        ? "Rascunho atualizado"
        : "Proposta emitida — link seguro disponível";
    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'created',$2,'X-Flow')`,
      [quoteId, eventDescription]
    );

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  const quote = await getQuoteById(organizationId, quoteId);
  if (!quote) throw new Error("Orçamento não encontrado após atualização.");
  return quote;
}

function mapDraftServiceLine(row: Row): ServiceLine {
  return {
    name: String(row.name),
    description: (row.description as string) ?? null,
    mode: row.mode as ServiceLine["mode"],
    hours: num(row.hours),
    notes: (row.notes as string) ?? null,
    sortOrder: num(row.sort_order),
  };
}

function mapDraftCostLine(row: Row): QuoteCostLine {
  const lineType = row.line_type as QuoteCostLine["lineType"];
  return {
    lineType,
    name: String(row.name),
    quantity: num(row.quantity),
    unit: row.unit as QuoteCostLine["unit"],
    unitCost: num(row.unit_cost),
    wasteRatePercent: num(row.waste_rate_percent),
    totalCost: num(row.total_cost),
    kitId: row.kit_id ? String(row.kit_id) : null,
    supplierServiceId: row.supplier_service_id ? String(row.supplier_service_id) : null,
    materialId: row.material_id ? String(row.material_id) : null,
    deductedHours: lineType === "sublet" ? num(row.deducted_hours) : null,
    notes: (row.notes as string) ?? null,
    sortOrder: num(row.sort_order),
  };
}

export async function loadDraftQuote(
  organizationId: string,
  quoteId: string
): Promise<DraftQuoteData | null> {
  const db = getDb();
  const { rows } = await db.query<Row>(
    `SELECT id, status, quote_number, vehicle_id, customer_id, notes
     FROM quotes WHERE id = $1 AND organization_id = $2 LIMIT 1`,
    [quoteId, organizationId]
  );
  if (rows.length === 0) return null;
  const quoteRow = rows[0];
  if (quoteRow.status !== "draft") return null;

  const { rows: optionRows } = await db.query<Row>(
    `SELECT id, tier, name, discount_rate FROM quote_options
     WHERE quote_id = $1 ORDER BY created_at`,
    [quoteId]
  );

  const options: DraftQuoteOption[] = [];
  for (const optionRow of optionRows) {
    const optionId = String(optionRow.id);
    const { rows: serviceRows } = await db.query<Row>(
      `SELECT name, description, mode, hours, notes, sort_order FROM quote_service_lines
       WHERE quote_option_id = $1 ORDER BY sort_order, created_at`,
      [optionId]
    );
    const { rows: costRows } = await db.query<Row>(
      `SELECT line_type, name, quantity, unit, unit_cost, waste_rate_percent, total_cost,
              kit_id, supplier_service_id, material_id, deducted_hours, notes, sort_order
       FROM quote_cost_lines WHERE quote_option_id = $1 ORDER BY sort_order, created_at`,
      [optionId]
    );
    const { rows: itemRows } = await db.query<Row>(
      `SELECT service_name, body_part_code, body_part_name, material_name, area_m2,
              labor_hours, unit_price, total_price FROM quote_option_items
       WHERE quote_option_id = $1`,
      [optionId]
    );
    const { rows: snapshotRows } = await db.query<Row>(
      `SELECT adjust_kind, adjust_value, price_before_vat, payload FROM quote_pricing_snapshots
       WHERE quote_option_id = $1 ORDER BY revision DESC LIMIT 1`,
      [optionId]
    );

    let adjustKind: AdjustKind = "none";
    let adjustValue = 0;
    let adjustReason: string | null = null;
    if (snapshotRows.length > 0) {
      const snap = snapshotRows[0];
      const payload =
        typeof snap.payload === "string"
          ? (JSON.parse(snap.payload) as { adjust?: { reason?: string | null } })
          : (snap.payload as { adjust?: { reason?: string | null } } | null);
      adjustReason = payload?.adjust?.reason ?? null;
      const snapKind = (snap.adjust_kind as AdjustKind) ?? "none";
      if (snapKind === "manual_price") {
        adjustKind = "manual_price";
        adjustValue = num(snap.adjust_value);
      } else if (snapKind === "percent_discount" || snapKind === "euro_adjust") {
        adjustKind = "manual_price";
        adjustValue = num(snap.price_before_vat);
      }
    }

    options.push({
      optionId,
      kind: serviceRows.length > 0 ? "flexible" : "configurator",
      tier: optionRow.tier as OptionTier,
      name: String(optionRow.name),
      discountRate: num(optionRow.discount_rate),
      serviceLines: serviceRows.map(mapDraftServiceLine),
      costLines: costRows.map(mapDraftCostLine),
      items: itemRows.map((i) => ({
        serviceName: String(i.service_name),
        bodyPartCode: String(i.body_part_code),
        bodyPartName: String(i.body_part_name),
        materialName: String(i.material_name),
        areaM2: num(i.area_m2),
        laborHours: num(i.labor_hours),
        unitPrice: num(i.unit_price),
        totalPrice: num(i.total_price),
      })),
      adjustKind,
      adjustValue,
      adjustReason,
    });
  }

  return {
    quoteId: String(quoteRow.id),
    quoteNumber: String(quoteRow.quote_number),
    status: quoteRow.status as QuoteStatus,
    vehicleId: String(quoteRow.vehicle_id),
    customerId: String(quoteRow.customer_id),
    notes: (quoteRow.notes as string) ?? null,
    options,
  };
}

export async function emitQuote(
  organizationId: string,
  quoteId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query<Row>(
      `SELECT id, status FROM quotes WHERE id = $1 AND organization_id = $2 FOR UPDATE`,
      [quoteId, organizationId]
    );
    if (rows.length === 0) {
      throw new Error("Orçamento não encontrado.");
    }
    if (rows[0].status !== "draft") {
      await client.query("ROLLBACK");
      return { ok: false, error: "Só é possível emitir rascunhos." };
    }

    await client.query(
      `UPDATE quotes SET status = 'sent', expires_at = NOW() + INTERVAL '30 days', updated_at = NOW()
       WHERE id = $1`,
      [quoteId]
    );
    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'created','Proposta emitida — link seguro disponível','X-Flow')`,
      [quoteId]
    );

    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao emitir o orçamento.",
    };
  } finally {
    client.release();
  }
}

export async function rejectQuote(organizationId: string, quoteId: string): Promise<void> {
  await getDb().query(
    `UPDATE quotes SET status = 'rejected', updated_at = NOW() WHERE id = $1 AND organization_id = $2`,
    [quoteId, organizationId]
  );
  await getDb().query(
    `INSERT INTO quote_events (quote_id, event_type, description, author_name)
     VALUES ($1,'rejected','Proposta recusada pelo cliente.','Cliente')`,
    [quoteId]
  );
}

export async function deleteQuote(
  organizationId: string,
  quoteId: string
): Promise<{ ok: boolean; error?: string }> {
  const { rows } = await getDb().query<Row>(
    `SELECT count(*)::int AS n FROM work_orders WHERE quote_id = $1`,
    [quoteId]
  );
  if (Number(rows[0].n) > 0) {
    return {
      ok: false,
      error: "A proposta já gerou uma ordem de trabalho e não pode ser eliminada.",
    };
  }
  await getDb().query(
    `DELETE FROM quotes WHERE id = $1 AND organization_id = $2`,
    [quoteId, organizationId]
  );
  return { ok: true };
}

export async function approveQuote(
  organizationId: string,
  quoteId: string,
  selectedOptionId?: string,
  approverName?: string
): Promise<{ ok: true; workOrderId: string } | { ok: false; error: string }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: quoteRows } = await client.query<Row>(
      `SELECT q.id, q.selected_option_id, q.vehicle_id, q.customer_id
       FROM quotes q
       WHERE q.id = $1 AND q.organization_id = $2
       FOR UPDATE OF q`,
      [quoteId, organizationId]
    );
    if (quoteRows.length === 0) {
      throw new Error("Orçamento não encontrado.");
    }
    const quote = quoteRows[0];

    const { rows: existing } = await client.query<Row>(
      `SELECT id FROM work_orders WHERE quote_id = $1 LIMIT 1`,
      [quoteId]
    );
    if (existing.length > 0) {
      await client.query("ROLLBACK");
      return { ok: true, workOrderId: String(existing[0].id) };
    }

    let chosenOptionId: string | null = null;
    let chosenOptionName: string | null = null;
    let chosenEstimatedHours: number | null = null;

    if (selectedOptionId) {
      const { rows: owned } = await client.query<Row>(
        `SELECT id, name, estimated_hours FROM quote_options WHERE id = $1 AND quote_id = $2`,
        [selectedOptionId, quoteId]
      );
      if (owned.length === 0) {
        await client.query("ROLLBACK");
        return {
          ok: false,
          error: "A opção selecionada não pertence a esta proposta.",
        };
      }
      chosenOptionId = String(owned[0].id);
      chosenOptionName = (owned[0].name as string) ?? null;
      chosenEstimatedHours =
        owned[0].estimated_hours === null ? null : num(owned[0].estimated_hours);
    } else {
      const { rows: optRows } = await client.query<Row>(
        `SELECT id, name, estimated_hours FROM quote_options
         WHERE quote_id = $1 AND (is_recommended OR id = $2)
         LIMIT 1`,
        [quoteId, quote.selected_option_id ?? null]
      );
      if (optRows.length > 0) {
        chosenOptionId = String(optRows[0].id);
        chosenOptionName = (optRows[0].name as string) ?? null;
        chosenEstimatedHours =
          optRows[0].estimated_hours === null ? null : num(optRows[0].estimated_hours);
      }
    }

    await client.query(
      `UPDATE quotes
       SET status = 'approved', approved_at = NOW(), approved_by_name = $2, updated_at = NOW()
       WHERE id = $1`,
      [quoteId, approverName ?? "Cliente"]
    );
    if (chosenOptionId) {
      await client.query(
        `UPDATE quotes SET selected_option_id = $2 WHERE id = $1`,
        [quoteId, chosenOptionId]
      );
    }

    const serviceTitle = chosenOptionName ? chosenOptionName : "Serviço aprovado";
    const { rows: woRows } = await client.query<Row>(
      `INSERT INTO work_orders
        (organization_id, work_order_number, vehicle_id, customer_id, quote_id, status,
         service_title, progress_percentage, estimated_hours, actual_hours_spent)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,0,$7,0) RETURNING id`,
      [
        organizationId,
        `WO-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        quote.vehicle_id,
        quote.customer_id,
        quoteId,
        serviceTitle,
        chosenEstimatedHours || 8,
      ]
    );
    const workOrderId = String(woRows[0].id);

    // Fases da ordem de trabalho: para opções flexíveis, o plano vem da opção
    // aprovada — cada subcontratação cria uma fase própria (com o serviço do
    // fornecedor e o custo real: total da linha + taxa de gestão) e a fase interna
    // que substitui deixa de ser criada. No fluxo do configurador mantêm-se as
    // 8 fases padrão.
    const flexiblePlanData = chosenOptionId
      ? await loadFlexibleOptionPhasePlanData(client, organizationId, quoteId, chosenOptionId)
      : null;

    if (flexiblePlanData) {
      const plan = buildPhasePlan(flexiblePlanData);
      await insertPlannedPhases(client, workOrderId, plan.phases);
    } else {
      const STANDARD_PHASES: Array<[string, string, number]> = [
        ["prep_decontamination", "Preparação e Descontaminação", 2],
        ["disassembly", "Desmontagem", 2.5],
        ["film_cutting", "Corte de Filme", 4],
        ["application", "Aplicação", 18],
        ["assembly", "Montagem", 2.5],
        ["thermal_cure", "Cura Térmica", 1.5],
        ["detailing_finish", "Detalhes e Acabamento", 1.5],
        ["quality_control", "Controlo de Qualidade", 1],
      ];
      for (let i = 0; i < STANDARD_PHASES.length; i++) {
        const [key, name, estHours] = STANDARD_PHASES[i];
        await client.query(
          `INSERT INTO work_order_phases (work_order_id, phase_key, name, status, order_index, estimated_hours)
           VALUES ($1,$2,$3,'pending',$4,$5)`,
          [workOrderId, key, name, i, estHours]
        );
      }
    }

    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name)
       VALUES ($1,'approved',$2,'Sistema')`,
      [quoteId, `Orçamento aprovado. Ordem de trabalho criada (${String(woRows[0].id).slice(0, 8)}).`]
    );

    await client.query("COMMIT");
    return { ok: true, workOrderId };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao aprovar orçamento." };
  } finally {
    client.release();
  }
}

export async function getQuoteByToken(token: string): Promise<Quote | null> {
  const db = getDb();
  const { rows } = await db.query<{ id: string; organization_id: string }>(
    `SELECT id, organization_id FROM quotes WHERE public_token = $1 LIMIT 1`,
    [token]
  );
  if (rows.length === 0) return null;
  return getQuoteById(rows[0].organization_id, rows[0].id);
}

const UNIT_LABELS: Record<string, string> = {
  linear_meter: "m lineares",
  m2: "m²",
  unit: "un.",
  package: "pacote",
};

export async function getPublicQuoteByToken(token: string): Promise<PublicQuote | null> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("SELECT set_config('app.public_token', $1, false)", [token]);

    const { rows } = await client.query<Row>(
      `SELECT q.id, q.quote_number, q.status, q.selected_option_id, q.approved_by_name,
              q.expires_at, q.notes,
              c.name AS customer_name,
              v.plate_display AS vehicle_plate, v.make || ' ' || v.model AS vehicle_model,
              v.generation_year AS vehicle_year, v.original_color_name AS vehicle_color
       FROM quotes q
       JOIN vehicles v ON v.id = q.vehicle_id
       JOIN customers c ON c.id = q.customer_id
       WHERE q.public_token = $1
       LIMIT 1`,
      [token]
    );
    if (rows.length === 0) return null;
    const quoteRow = rows[0];
    const quoteId = String(quoteRow.id);

    const { rows: optionRows } = await client.query<Row>(
      `SELECT * FROM quote_options WHERE quote_id = $1 ORDER BY created_at`,
      [quoteId]
    );
    const { rows: serviceRows } = await client.query<Row>(
      `SELECT sl.* FROM quote_service_lines sl
       JOIN quote_options o ON o.id = sl.quote_option_id
       WHERE o.quote_id = $1
       ORDER BY sl.sort_order`,
      [quoteId]
    );
    const { rows: materialRows } = await client.query<Row>(
      `SELECT cl.* FROM quote_cost_lines cl
       JOIN quote_options o ON o.id = cl.quote_option_id
       WHERE o.quote_id = $1 AND cl.line_type = 'material'
       ORDER BY cl.sort_order`,
      [quoteId]
    );
    const { rows: itemRows } = await client.query<Row>(
      `SELECT i.* FROM quote_option_items i
       JOIN quote_options o ON o.id = i.quote_option_id
       WHERE o.quote_id = $1`,
      [quoteId]
    );

    const options: PublicQuoteOption[] = optionRows.map((row) => {
      const optionId = String(row.id);
      const displayLines: PublicQuoteOptionLine[] = [];
      const optionServiceLines = serviceRows.filter(
        (l) => String(l.quote_option_id) === optionId
      );

      if (optionServiceLines.length > 0) {
        for (const material of materialRows.filter(
          (l) => String(l.quote_option_id) === optionId
        )) {
          const quantity = Number(material.quantity);
          const unitLabel = UNIT_LABELS[String(material.unit)] ?? null;
          displayLines.push({
            kind: "material",
            name: String(material.name),
            description: quantity > 1 ? `${quantity} ${unitLabel ?? ""}`.trim() : null,
            quantity,
            unitLabel,
          });
        }
        for (const service of optionServiceLines) {
          displayLines.push({
            kind: "service",
            name: String(service.name),
            description: (service.description as string) ?? null,
          });
        }
      } else {
        for (const item of itemRows.filter(
          (i) => String(i.quote_option_id) === optionId
        )) {
          const bodyPartName = String(item.body_part_name);
          const materialName = String(item.material_name ?? "");
          displayLines.push({
            kind: "service",
            name: String(item.service_name),
            description: `${bodyPartName}${materialName ? ` — ${materialName}` : ""}`,
          });
        }
      }

      return {
        id: optionId,
        tier: row.tier as OptionTier,
        name: String(row.name),
        description: (row.description as string) ?? null,
        isRecommended: Boolean(row.is_recommended),
        warrantyYears: num(row.warranty_years),
        taxableBase: num(row.taxable_base),
        vatRate: num(row.vat_rate),
        vatAmount: num(row.vat_amount),
        totalWithVat: num(row.total_with_vat),
        discountRate: num(row.discount_rate),
        discountAmount: num(row.discount_amount),
        displayLines,
      };
    });

    return {
      id: quoteId,
      quoteNumber: String(quoteRow.quote_number),
      status: quoteRow.status as QuoteStatus,
      customerName: String(quoteRow.customer_name ?? ""),
      vehiclePlate: String(quoteRow.vehicle_plate ?? ""),
      vehicleModel: String(quoteRow.vehicle_model ?? ""),
      vehicleYear:
        quoteRow.vehicle_year === null || quoteRow.vehicle_year === undefined
          ? null
          : num(quoteRow.vehicle_year),
      vehicleColor: (quoteRow.vehicle_color as string) ?? null,
      expiresAt: iso(quoteRow.expires_at),
      notes: (quoteRow.notes as string) ?? null,
      selectedOptionId: quoteRow.selected_option_id
        ? String(quoteRow.selected_option_id)
        : null,
      approvedByName: (quoteRow.approved_by_name as string) ?? null,
      options,
    };
  } finally {
    await client.query("RESET app.public_token").catch(() => {});
    client.release();
  }
}

export { getPrimaryOrganizationId };
