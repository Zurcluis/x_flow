import { getDb } from "@/lib/db";
import { FORMULA_LABELS, round2 } from "@/domains/pricing/engine";
import type {
  ConsumableKit,
  ConsumableKitKind,
  ExpenseCategory,
  ExpenseKind,
  ExpenseValidationState,
  FormulaCode,
  FormulaComponent,
  FormulaComponentType,
  PricingExpenseItem,
  PricingFormulaVersion,
  PricingMethod,
  PricingPolicy,
  SupplierService,
} from "@/domains/pricing/types";

type Row = Record<string, unknown>;

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function dateStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value).slice(0, 10);
}

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function numOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function mapPolicy(row: Row): PricingPolicy {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    version: num(row.version),
    method: row.method as PricingPolicy["method"],
    manualDailyExpenses: num(row.manual_daily_expenses),
    dailyCapacityHours: num(row.daily_capacity_hours),
    profitDailyTarget: num(row.profit_daily_target),
    spotSurchargePerHour: num(row.spot_surcharge_per_hour),
    productiveDaysPerMonth: numOrNull(row.productive_days_per_month),
    subletFeePercent: num(row.sublet_fee_percent),
    wasteRatePercent: num(row.waste_rate_percent),
    vatRate: num(row.vat_rate),
    status: row.status as PricingPolicy["status"],
    effectiveFrom: String(row.effective_from).slice(0, 10),
    publishedAt: row.published_at ? iso(row.published_at) : null,
    createdAt: iso(row.created_at),
  };
}

function mapExpenseItem(row: Row): PricingExpenseItem {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    version: num(row.version),
    name: String(row.name),
    description: (row.description as string) ?? null,
    category: row.category as ExpenseCategory,
    kind: row.kind as ExpenseKind,
    amount: num(row.amount),
    periodicity: row.periodicity as PricingExpenseItem["periodicity"],
    monthlyEquivalent: num(row.monthly_equivalent),
    includedInPricing: Boolean(row.included_in_pricing),
    includesPersonnel: Boolean(row.includes_personnel),
    source: (row.source as string) ?? null,
    validationState: row.validation_state as ExpenseValidationState,
    effectiveFrom: String(row.effective_from).slice(0, 10),
    effectiveTo: dateStr(row.effective_to),
    notes: (row.notes as string) ?? null,
    createdAt: iso(row.created_at),
  };
}

function mapKit(row: Row): ConsumableKit {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    code: String(row.code),
    name: String(row.name),
    kind: row.kind as ConsumableKitKind,
    price: num(row.price),
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
  };
}

function mapSupplierService(row: Row): SupplierService {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    supplierId: String(row.supplier_id),
    supplierName: String(row.supplier_name),
    serviceName: String(row.service_name),
    basePrice: num(row.base_price),
    replacedPhaseKey: (row.replaced_phase_key as string) ?? null,
    phaseHours: numOrNull(row.phase_hours),
    active: Boolean(row.active),
    createdAt: iso(row.created_at),
  };
}

function mapFormulaVersion(row: Row): PricingFormulaVersion {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    formulaId: String(row.formula_id),
    code: row.code as FormulaCode,
    name: String(row.name),
    description: (row.description as string) ?? null,
    version: num(row.version),
    components: parseComponents(row.components),
    status: row.status as PricingFormulaVersion["status"],
    effectiveFrom: String(row.effective_from).slice(0, 10),
    publishedAt: row.published_at ? iso(row.published_at) : null,
    createdAt: iso(row.created_at),
  };
}

function parseComponents(value: unknown): FormulaComponent[] {
  if (Array.isArray(value)) return value as FormulaComponent[];
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as FormulaComponent[];
    } catch {
      return [];
    }
  }
  return [];
}

export interface PricingFormulaSummary {
  formulaId: string;
  code: FormulaCode;
  name: string;
  description: string | null;
  isArchived: boolean;
  published: PricingFormulaVersion | null;
}

export interface PricingContextData {
  policy: PricingPolicy | null;
  expenseItems: PricingExpenseItem[];
  formulas: PricingFormulaSummary[];
  kits: ConsumableKit[];
  supplierServices: SupplierService[];
}

export async function loadPricingContext(
  organizationId: string
): Promise<PricingContextData> {
  const db = getDb();
  const [policy, expenseItems, formulaRows, kitRows, serviceRows] =
    await Promise.all([
      getActivePolicy(organizationId),
      getExpenseItems(organizationId, { asOf: todayIso() }),
      db.query<Row>(
        `SELECT pf.id AS formula_id, pf.code, pf.name AS formula_name, pf.description AS formula_description,
                pf.is_archived,
                pfv.id, pfv.formula_id AS version_formula_id, pfv.organization_id, pfv.version,
                pfv.components, pfv.status, pfv.effective_from, pfv.published_at, pfv.created_at
         FROM pricing_formulas pf
         LEFT JOIN LATERAL (
           SELECT * FROM pricing_formula_versions v
           WHERE v.formula_id = pf.id AND v.status = 'published'
           ORDER BY v.version DESC LIMIT 1
         ) pfv ON TRUE
         WHERE pf.organization_id = $1
         ORDER BY pf.created_at`,
        [organizationId]
      ),
      db.query<Row>(
        `SELECT * FROM consumable_kits WHERE organization_id = $1 AND active = TRUE ORDER BY name`,
        [organizationId]
      ),
      db.query<Row>(
        `SELECT ss.*, s.name AS supplier_name
         FROM supplier_services ss
         JOIN suppliers s ON s.id = ss.supplier_id
         WHERE ss.organization_id = $1 AND ss.active = TRUE
         ORDER BY s.name, ss.service_name`,
        [organizationId]
      ),
    ]);

  const formulas: PricingFormulaSummary[] = formulaRows.rows.map((row) => ({
    formulaId: String(row.formula_id),
    code: row.code as FormulaCode,
    name: String(row.formula_name),
    description: (row.formula_description as string) ?? null,
    isArchived: Boolean(row.is_archived),
    published: row.id ? mapFormulaVersion(row) : null,
  }));

  return {
    policy,
    expenseItems,
    formulas,
    kits: kitRows.rows.map(mapKit),
    supplierServices: serviceRows.rows.map(mapSupplierService),
  };
}

export async function getActivePolicy(
  organizationId: string
): Promise<PricingPolicy | null> {
  const { rows } = await getDb().query<Row>(
    `SELECT * FROM pricing_policies
     WHERE organization_id = $1 AND status = 'active'
     ORDER BY version DESC LIMIT 1`,
    [organizationId]
  );
  return rows.length > 0 ? mapPolicy(rows[0]) : null;
}

export async function getExpenseItems(
  organizationId: string,
  opts?: { asOf?: string; includeArchived?: boolean }
): Promise<PricingExpenseItem[]> {
  const params: unknown[] = [organizationId];
  let where = "organization_id = $1";
  if (!opts?.includeArchived) {
    params.push(opts?.asOf ?? todayIso());
    where += ` AND effective_from <= $${params.length}::date
       AND (effective_to IS NULL OR effective_to >= $${params.length}::date)`;
  }
  const { rows } = await getDb().query<Row>(
    `SELECT * FROM pricing_expense_items WHERE ${where}
     ORDER BY CASE category WHEN 'operational' THEN 0 ELSE 1 END, created_at`,
    params
  );
  return rows.map(mapExpenseItem);
}

export interface ExpenseItemVersionInput {
  name: string;
  description?: string | null;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  periodicity: "monthly" | "yearly";
  includedInPricing: boolean;
  includesPersonnel: boolean;
  source?: string | null;
  validationState: ExpenseValidationState;
  effectiveFrom: string;
  notes?: string | null;
}

export async function createExpenseItemVersion(
  organizationId: string,
  input: ExpenseItemVersionInput
): Promise<{ id: string; version: number }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const monthlyEquivalent =
      input.periodicity === "yearly"
        ? round2(input.amount / 12)
        : round2(input.amount);

    const { rows: activeRows } = await client.query<Row>(
      `SELECT 1 FROM pricing_expense_items
       WHERE organization_id = $1 AND name = $2 AND category = $3 AND effective_to IS NULL
       LIMIT 1`,
      [organizationId, input.name, input.category]
    );

    let version = 1;
    if (activeRows.length > 0) {
      const { rows: maxRows } = await client.query<Row>(
        `SELECT COALESCE(MAX(version), 0) AS max_version FROM pricing_expense_items
         WHERE organization_id = $1 AND name = $2 AND category = $3`,
        [organizationId, input.name, input.category]
      );
      version = num(maxRows[0]?.max_version) + 1;
      await client.query(
        `UPDATE pricing_expense_items
         SET effective_to = ($4::date - 1), updated_at = NOW()
         WHERE organization_id = $1 AND name = $2 AND category = $3 AND effective_to IS NULL`,
        [organizationId, input.name, input.category, input.effectiveFrom]
      );
    }

    const { rows: inserted } = await client.query<Row>(
      `INSERT INTO pricing_expense_items
        (organization_id, version, name, description, category, kind, amount, periodicity,
         monthly_equivalent, included_in_pricing, includes_personnel, source, validation_state,
         effective_from, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING id`,
      [
        organizationId,
        version,
        input.name,
        input.description ?? null,
        input.category,
        input.kind,
        input.amount,
        input.periodicity,
        monthlyEquivalent,
        input.includedInPricing,
        input.includesPersonnel,
        input.source ?? null,
        input.validationState,
        input.effectiveFrom,
        input.notes ?? null,
      ]
    );
    await client.query("COMMIT");
    return { id: String(inserted[0].id), version };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function archiveExpenseItem(
  organizationId: string,
  itemId: string,
  effectiveTo: string
): Promise<void> {
  const { rowCount } = await getDb().query(
    `UPDATE pricing_expense_items
     SET effective_to = $3::date, updated_at = NOW()
     WHERE id = $2 AND organization_id = $1`,
    [organizationId, itemId, effectiveTo]
  );
  if (!rowCount) {
    throw new Error("Rubrica não encontrada.");
  }
}

export interface KitInput {
  id?: string;
  name: string;
  kind: ConsumableKitKind;
  price: number;
  active?: boolean;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function saveKit(
  organizationId: string,
  input: KitInput
): Promise<string> {
  const db = getDb();
  if (input.id) {
    const { rowCount } = await db.query(
      `UPDATE consumable_kits
       SET name = $3, kind = $4, price = $5, active = COALESCE($6::boolean, active), updated_at = NOW()
       WHERE id = $2 AND organization_id = $1`,
      [organizationId, input.id, input.name, input.kind, input.price, input.active ?? null]
    );
    if (!rowCount) {
      throw new Error("Kit não encontrado.");
    }
    return input.id;
  }

  const baseCode = slugify(input.name) || "kit";
  let code = baseCode;
  let attempt = 2;
  for (;;) {
    const { rows } = await db.query<Row>(
      `SELECT 1 FROM consumable_kits WHERE organization_id = $1 AND code = $2 LIMIT 1`,
      [organizationId, code]
    );
    if (rows.length === 0) break;
    code = `${baseCode}-${attempt}`;
    attempt += 1;
  }

  const { rows } = await db.query<Row>(
    `INSERT INTO consumable_kits (organization_id, code, name, kind, price, active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [organizationId, code, input.name, input.kind, input.price, input.active ?? true]
  );
  return String(rows[0].id);
}

export interface SupplierInput {
  id?: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export async function saveSupplier(
  organizationId: string,
  input: SupplierInput
): Promise<string> {
  const db = getDb();
  if (input.id) {
    const { rowCount } = await db.query(
      `UPDATE suppliers
       SET name = $3, phone = $4, email = $5, notes = $6, updated_at = NOW()
       WHERE id = $2 AND organization_id = $1`,
      [organizationId, input.id, input.name, input.phone ?? null, input.email ?? null, input.notes ?? null]
    );
    if (!rowCount) {
      throw new Error("Fornecedor não encontrado.");
    }
    return input.id;
  }
  const { rows } = await db.query<Row>(
    `INSERT INTO suppliers (organization_id, name, phone, email, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [organizationId, input.name, input.phone ?? null, input.email ?? null, input.notes ?? null]
  );
  return String(rows[0].id);
}

export interface SupplierServiceInput {
  id?: string;
  supplierId: string;
  serviceName: string;
  basePrice: number;
  replacedPhaseKey?: string | null;
  phaseHours?: number | null;
  active?: boolean;
}

export async function saveSupplierService(
  organizationId: string,
  input: SupplierServiceInput
): Promise<string> {
  const db = getDb();
  if (input.id) {
    const { rowCount } = await db.query(
      `UPDATE supplier_services
       SET supplier_id = $3, service_name = $4, base_price = $5,
           replaced_phase_key = $6, phase_hours = $7, active = COALESCE($8::boolean, active), updated_at = NOW()
       WHERE id = $2 AND organization_id = $1`,
      [
        organizationId,
        input.id,
        input.supplierId,
        input.serviceName,
        input.basePrice,
        input.replacedPhaseKey ?? null,
        input.phaseHours ?? null,
        input.active ?? null,
      ]
    );
    if (!rowCount) {
      throw new Error("Serviço do fornecedor não encontrado.");
    }
    return input.id;
  }
  const { rows } = await db.query<Row>(
    `INSERT INTO supplier_services
      (organization_id, supplier_id, service_name, base_price, replaced_phase_key, phase_hours, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [
      organizationId,
      input.supplierId,
      input.serviceName,
      input.basePrice,
      input.replacedPhaseKey ?? null,
      input.phaseHours ?? null,
      input.active ?? true,
    ]
  );
  return String(rows[0].id);
}

const VALID_COMPONENT_TYPES: readonly FormulaComponentType[] = [
  "expense_base",
  "profit_objective",
  "spot_surcharge",
  "fixed_amount",
  "material",
  "material_margin",
  "percent_adjust",
  "consumable_kits",
  "sublet",
  "extras",
];

const VALID_SCOPES = ["aggregated", "operational", "cash_recovery"] as const;
const VALID_BASES = ["material", "service_part", "subtotal_before_percent"] as const;

export function validateFormulaComponents(
  components: FormulaComponent[]
): string | null {
  if (!Array.isArray(components) || components.length === 0) {
    return "A fórmula precisa de pelo menos um componente.";
  }
  for (const component of components) {
    if (!component || typeof component.id !== "string" || !component.id.trim()) {
      return "Cada componente precisa de um identificador.";
    }
    if (!VALID_COMPONENT_TYPES.includes(component.type)) {
      return "Tipo de componente desconhecido.";
    }
    if (typeof component.enabled !== "boolean") {
      return "Estado do componente inválido.";
    }
    const params = component.params ?? {};
    if (
      params.scope !== undefined &&
      !VALID_SCOPES.includes(params.scope as (typeof VALID_SCOPES)[number])
    ) {
      return "Âmbito do componente inválido.";
    }
    if (
      params.amount !== undefined &&
      (!Number.isFinite(params.amount) || params.amount < 0)
    ) {
      return "O montante fixo tem de ser um número igual ou superior a zero.";
    }
    if (
      params.percent !== undefined &&
      (!Number.isFinite(params.percent) || params.percent < 0 || params.percent > 100)
    ) {
      return "A percentagem do componente tem de estar entre 0 e 100.";
    }
    if (
      params.base !== undefined &&
      !VALID_BASES.includes(params.base as (typeof VALID_BASES)[number])
    ) {
      return "Base do acréscimo percentual inválida.";
    }
  }
  return null;
}

function normalizeComponents(components: FormulaComponent[]): FormulaComponent[] {
  return components.map((component) => ({
    id: component.id,
    type: component.type,
    label:
      typeof component.label === "string" && component.label.trim() !== ""
        ? component.label
        : FORMULA_LABELS[component.type],
    enabled: component.enabled,
    params: component.params ?? {},
  }));
}

export interface FormulaPublishInput {
  formulaId: string;
  name: string;
  description?: string | null;
  components: FormulaComponent[];
  effectiveFrom: string;
  profileId?: string;
}

export async function publishFormulaVersion(
  organizationId: string,
  input: FormulaPublishInput
): Promise<{ versionId: string; version: number }> {
  const componentError = validateFormulaComponents(input.components);
  if (componentError) {
    throw new Error(componentError);
  }

  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: formulaRows } = await client.query<Row>(
      `SELECT id FROM pricing_formulas WHERE id = $1 AND organization_id = $2`,
      [input.formulaId, organizationId]
    );
    if (formulaRows.length === 0) {
      throw new Error("Fórmula não encontrada.");
    }

    await client.query(
      `UPDATE pricing_formulas
       SET name = $3, description = $4, is_archived = FALSE, updated_at = NOW()
       WHERE organization_id = $1 AND id = $2`,
      [organizationId, input.formulaId, input.name, input.description ?? null]
    );

    await client.query(
      `UPDATE pricing_formula_versions
       SET status = 'archived', updated_at = NOW()
       WHERE formula_id = $1 AND status = 'published'`,
      [input.formulaId]
    );

    const { rows: maxRows } = await client.query<Row>(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM pricing_formula_versions WHERE formula_id = $1`,
      [input.formulaId]
    );
    const version = num(maxRows[0]?.max_version) + 1;

    const { rows: inserted } = await client.query<Row>(
      `INSERT INTO pricing_formula_versions
        (formula_id, organization_id, version, components, status, effective_from, published_at, published_by)
       VALUES ($1,$2,$3,$4,'published',$5::date,NOW(),$6)
       RETURNING id`,
      [
        input.formulaId,
        organizationId,
        version,
        JSON.stringify(normalizeComponents(input.components)),
        input.effectiveFrom,
        input.profileId ?? null,
      ]
    );

    await client.query("COMMIT");
    return { versionId: String(inserted[0].id), version };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export interface PolicyVersionInput {
  method: PricingMethod;
  manualDailyExpenses: number;
  dailyCapacityHours: number;
  profitDailyTarget: number;
  spotSurchargePerHour: number;
  productiveDaysPerMonth: number | null;
  subletFeePercent: number;
  wasteRatePercent: number;
  vatRate: number;
  effectiveFrom: string;
}

export async function createPolicyVersion(
  organizationId: string,
  input: PolicyVersionInput,
  opts: { intent: "draft" | "publish"; profileId?: string }
): Promise<{ policyId: string; version: number }> {
  const db = getDb();
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const { rows: maxRows } = await client.query<Row>(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM pricing_policies WHERE organization_id = $1`,
      [organizationId]
    );
    const version = num(maxRows[0]?.max_version) + 1;
    const status = opts.intent === "publish" ? "active" : "draft";

    const { rows: inserted } = await client.query<Row>(
      `INSERT INTO pricing_policies
        (organization_id, version, method, manual_daily_expenses, daily_capacity_hours,
         profit_daily_target, spot_surcharge_per_hour, productive_days_per_month,
         sublet_fee_percent, waste_rate_percent, vat_rate, status, effective_from,
         published_at, published_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::date,
               CASE WHEN $12 = 'active' THEN NOW() ELSE NULL END, $14)
       RETURNING id`,
      [
        organizationId,
        version,
        input.method,
        input.manualDailyExpenses,
        input.dailyCapacityHours,
        input.profitDailyTarget,
        input.spotSurchargePerHour,
        input.productiveDaysPerMonth ?? null,
        input.subletFeePercent,
        input.wasteRatePercent,
        input.vatRate,
        status,
        input.effectiveFrom,
        opts.profileId ?? null,
      ]
    );
    const policyId = String(inserted[0].id);

    if (opts.intent === "publish") {
      await client.query(
        `UPDATE pricing_policies
         SET status = 'archived', updated_at = NOW()
         WHERE organization_id = $1 AND status = 'active' AND id <> $2`,
        [organizationId, policyId]
      );
    }

    await client.query("COMMIT");
    return { policyId, version };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
