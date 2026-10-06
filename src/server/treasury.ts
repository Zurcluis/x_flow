import { getDb } from "@/lib/db";
import {
  BankAccount,
  RecurringRule,
  RecurringRuleCreateInput,
  Transaction,
  TransactionCategory,
  TransactionCreateInput,
  TreasurySummary,
} from "@/domains/finance/types";

type Row = Record<string, unknown>;

const DEFAULT_CATEGORIES: Array<{
  name: string;
  kind: TransactionCategory["kind"];
  isRecurring: boolean;
}> = [
  { name: "Cobrança de faturas", kind: "other", isRecurring: false },
  { name: "Receitas avulsas", kind: "other", isRecurring: false },
  { name: "Renda do pavilhão", kind: "rent", isRecurring: true },
  { name: "Salários e ordenados", kind: "payroll", isRecurring: true },
  { name: "Segurança Social", kind: "payroll", isRecurring: true },
  { name: "Contabilidade", kind: "operational", isRecurring: true },
  { name: "Seguros", kind: "operational", isRecurring: true },
  { name: "Luz", kind: "operational", isRecurring: true },
  { name: "Água", kind: "operational", isRecurring: true },
  { name: "Limpeza", kind: "operational", isRecurring: true },
  { name: "Marketing", kind: "marketing", isRecurring: true },
  { name: "Acordo de transição", kind: "other", isRecurring: true },
  { name: "Consumíveis e materiais", kind: "supplier", isRecurring: false },
  { name: "Ferramentas e equipamento", kind: "supplier", isRecurring: false },
  { name: "Combustível e deslocações", kind: "operational", isRecurring: false },
  { name: "Serviços subcontratados", kind: "supplier", isRecurring: false },
  { name: "Impostos — IVA", kind: "tax", isRecurring: true },
  { name: "Impostos — Segurança Social", kind: "tax", isRecurring: true },
  { name: "Impostos — IRC", kind: "tax", isRecurring: true },
  { name: "Outros", kind: "other", isRecurring: false },
];

const DEFAULT_RECURRING: Array<{
  name: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  notes?: string;
}> = [
  { name: "Renda do pavilhão", category: "Renda do pavilhão", amount: 630.74, dayOfMonth: 1 },
  {
    name: "Acordo de transição — a formalizar",
    category: "Acordo de transição",
    amount: 833.33,
    dayOfMonth: 5,
    notes: "Acordo verbal ativo, por formalizar (20.000 € em 24 meses).",
  },
  { name: "Marketing", category: "Marketing", amount: 500.0, dayOfMonth: 5 },
  { name: "Contabilidade externa", category: "Contabilidade", amount: 170.73, dayOfMonth: 10 },
  { name: "Seguro", category: "Seguros", amount: 80.0, dayOfMonth: 10 },
  { name: "Multirriscos", category: "Seguros", amount: 33.83, dayOfMonth: 10 },
  { name: "Luz", category: "Luz", amount: 81.3, dayOfMonth: 15 },
  { name: "Água", category: "Água", amount: 65.04, dayOfMonth: 15 },
  { name: "Limpeza", category: "Limpeza", amount: 56.91, dayOfMonth: 15 },
];

function num(value: unknown): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export async function ensureDefaultCategories(organizationId: string): Promise<void> {
  const db = getDb();
  for (const c of DEFAULT_CATEGORIES) {
    await db.query(
      `INSERT INTO transaction_categories (organization_id, name, kind, is_recurring)
       VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id, name) DO NOTHING`,
      [organizationId, c.name, c.kind, c.isRecurring]
    );
  }
  await db.query(
    `INSERT INTO bank_accounts (organization_id, name, iban, bic, kind)
     VALUES ($1,'Millennium BCP','PT50.0036.0096.99100129889.26','MPIOPTPL','bank')
     ON CONFLICT (organization_id, name) DO NOTHING`,
    [organizationId]
  );
  await db.query(
    `INSERT INTO bank_accounts (organization_id, name, kind)
     VALUES ($1,'Caixa','cash') ON CONFLICT (organization_id, name) DO NOTHING`,
    [organizationId]
  );

  const { rows: categoryRows } = await db.query<Row>(
    `SELECT id, name FROM transaction_categories WHERE organization_id = $1`,
    [organizationId]
  );
  const categoryIdByName = new Map(categoryRows.map((r) => [String(r.name), String(r.id)]));

  const { rows: ruleRows } = await db.query<Row>(
    `SELECT name FROM recurring_rules WHERE organization_id = $1`,
    [organizationId]
  );
  const existingRules = new Set(ruleRows.map((r) => String(r.name)));
  for (const r of DEFAULT_RECURRING) {
    if (existingRules.has(r.name)) continue;
    await db.query(
      `INSERT INTO recurring_rules (organization_id, name, category_id, type, amount, frequency, day_of_month, notes)
       VALUES ($1,$2,$3,'expense',$4,'monthly',$5,$6)`,
      [organizationId, r.name, categoryIdByName.get(r.category) ?? null, r.amount.toFixed(2), r.dayOfMonth, r.notes ?? null]
    );
  }
}

export async function listCategories(organizationId: string): Promise<TransactionCategory[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT * FROM transaction_categories WHERE organization_id = $1 ORDER BY kind, name`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    kind: (r.kind as TransactionCategory["kind"]) ?? "other",
    isRecurring: Boolean(r.is_recurring),
    vatDefaultRate: num(r.vat_default_rate),
  }));
}

export async function listBankAccounts(organizationId: string): Promise<BankAccount[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT * FROM bank_accounts WHERE organization_id = $1 AND active = TRUE ORDER BY kind, name`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    iban: (r.iban as string) ?? undefined,
    bic: (r.bic as string) ?? undefined,
    kind: (r.kind as BankAccount["kind"]) ?? "bank",
    initialBalance: num(r.initial_balance),
    active: Boolean(r.active),
  }));
}

export async function listRecurringRules(organizationId: string): Promise<RecurringRule[]> {
  const { rows } = await getDb().query<Row>(
    `SELECT r.*, c.name AS category_name FROM recurring_rules r
     LEFT JOIN transaction_categories c ON c.id = r.category_id
     WHERE r.organization_id = $1 ORDER BY r.type, r.amount DESC`,
    [organizationId]
  );
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    categoryId: r.category_id ? String(r.category_id) : undefined,
    categoryName: (r.category_name as string) ?? undefined,
    type: (r.type as RecurringRule["type"]) ?? "expense",
    amount: num(r.amount),
    vatRate: num(r.vat_rate),
    frequency: (r.frequency as RecurringRule["frequency"]) ?? "monthly",
    dayOfMonth: num(r.day_of_month),
    startsAt: iso(r.starts_at).slice(0, 10),
    endsAt: r.ends_at ? iso(r.ends_at).slice(0, 10) : undefined,
    active: Boolean(r.active),
    notes: (r.notes as string) ?? undefined,
  }));
}

export async function createRecurringRule(
  organizationId: string,
  input: RecurringRuleCreateInput
): Promise<void> {
  if (!input.name?.trim()) throw new Error("O nome da rubrica é obrigatório.");
  if (!(input.amount > 0)) throw new Error("O valor tem de ser superior a zero.");
  await getDb().query(
    `INSERT INTO recurring_rules
      (organization_id, name, category_id, type, amount, vat_rate, frequency, day_of_month, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      organizationId,
      input.name.trim(),
      input.categoryId || null,
      input.type,
      input.amount.toFixed(2),
      (input.vatRate ?? 0).toFixed(2),
      input.frequency ?? "monthly",
      Math.min(Math.max(input.dayOfMonth ?? 1, 1), 31),
      input.notes?.trim() || null,
    ]
  );
}

export async function toggleRecurringRule(
  organizationId: string,
  ruleId: string,
  active: boolean
): Promise<void> {
  const { rowCount } = await getDb().query(
    `UPDATE recurring_rules SET active = $3 WHERE id = $1 AND organization_id = $2`,
    [ruleId, organizationId, active]
  );
  if (rowCount === 0) throw new Error("Rubrica recorrente não encontrada.");
}

export async function createTransaction(
  organizationId: string,
  profileId: string | undefined,
  input: TransactionCreateInput
): Promise<string> {
  if (!(input.amount > 0)) throw new Error("O valor tem de ser superior a zero.");
  const db = getDb();
  const { rows } = await db.query<Row>(
    `INSERT INTO transactions
      (organization_id, type, occurred_at, amount, category_id, bank_account_id, description,
       payment_method, reference, vat_amount, source_type, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'manual',$11) RETURNING id`,
    [
      organizationId,
      input.type,
      input.occurredAt,
      input.amount.toFixed(2),
      input.categoryId || null,
      input.bankAccountId || null,
      input.description?.trim() || null,
      input.paymentMethod ?? "bank_transfer",
      input.reference?.trim() || null,
      (input.vatAmount ?? 0).toFixed(2),
      profileId ?? null,
    ]
  );
  return String(rows[0].id);
}

export async function listTransactions(
  organizationId: string,
  options?: { from?: string; to?: string; type?: Transaction["type"] }
): Promise<Transaction[]> {
  const db = getDb();
  const conditions = ["t.organization_id = $1"];
  const params: unknown[] = [organizationId];
  if (options?.from) {
    params.push(options.from);
    conditions.push(`t.occurred_at >= $${params.length}`);
  }
  if (options?.to) {
    params.push(options.to);
    conditions.push(`t.occurred_at < ($${params.length}::timestamp + interval '1 day')`);
  }
  if (options?.type) {
    params.push(options.type);
    conditions.push(`t.type = $${params.length}`);
  }
  const { rows } = await db.query<Row>(
    `SELECT t.*, c.name AS category_name, b.name AS bank_account_name
     FROM transactions t
     LEFT JOIN transaction_categories c ON c.id = t.category_id
     LEFT JOIN bank_accounts b ON b.id = t.bank_account_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY t.occurred_at DESC, t.created_at DESC
     LIMIT 500`,
    params
  );
  return rows.map((r) => ({
    id: String(r.id),
    type: (r.type as Transaction["type"]) ?? "expense",
    occurredAt: iso(r.occurred_at),
    amount: num(r.amount),
    categoryId: r.category_id ? String(r.category_id) : undefined,
    categoryName: (r.category_name as string) ?? undefined,
    bankAccountId: r.bank_account_id ? String(r.bank_account_id) : undefined,
    bankAccountName: (r.bank_account_name as string) ?? undefined,
    description: (r.description as string) ?? undefined,
    paymentMethod: String(r.payment_method ?? "bank_transfer"),
    reference: (r.reference as string) ?? undefined,
    vatAmount: num(r.vat_amount),
    sourceType: (r.source_type as Transaction["sourceType"]) ?? "manual",
    sourceId: r.source_id ? String(r.source_id) : undefined,
    recurringRuleId: r.recurring_rule_id ? String(r.recurring_rule_id) : undefined,
    periodKey: (r.period_key as string) ?? undefined,
  }));
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function periodDate(year: number, month: number, dayOfMonth: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(Date.UTC(year, month, Math.min(dayOfMonth, lastDay), 12, 0, 0));
}

export async function generateDueRecurring(organizationId: string): Promise<number> {
  const db = getDb();
  const now = new Date();
  const { rows: rules } = await db.query<Row>(
    `SELECT * FROM recurring_rules WHERE organization_id = $1 AND active = TRUE`,
    [organizationId]
  );
  if (rules.length === 0) return 0;

  let generated = 0;
  for (const rule of rules) {
    const start = new Date(String(rule.starts_at));
    const end = rule.ends_at ? new Date(String(rule.ends_at)) : now;
    const monthsCount =
      (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const monthSteps: Array<{ year: number; month: number }> = [];
    for (let i = 0; i <= Math.max(monthsCount, 0); i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      if (d > end) break;
      if (d.getFullYear() > now.getFullYear()) break;
      if (d.getFullYear() === now.getFullYear() && d.getMonth() > now.getMonth()) break;
      monthSteps.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    if (rule.frequency === "yearly") {
      const kept = monthSteps.filter((s) => s.month === start.getMonth());
      monthSteps.length = 0;
      monthSteps.push(...kept);
    }
    for (const step of monthSteps) {
      const periodKey = monthKey(new Date(step.year, step.month, 1));
      const { rowCount } = await db.query(
        `INSERT INTO transactions
          (organization_id, type, occurred_at, amount, category_id, bank_account_id, description,
           payment_method, vat_amount, source_type, source_id, recurring_rule_id, period_key)
         SELECT $1, r.type, $2, r.amount, r.category_id, NULL, r.name, 'bank_transfer', 0,
                'recurring', r.id, r.id, $3::text
         FROM recurring_rules r WHERE r.id = $4
           AND NOT EXISTS (
             SELECT 1 FROM transactions t
             WHERE t.recurring_rule_id = r.id AND t.period_key = $3::text
           )`,
        [
          organizationId,
          periodDate(step.year, step.month, num(rule.day_of_month)),
          periodKey,
          String(rule.id),
        ]
      );
      generated += rowCount ?? 0;
    }
  }
  return generated;
}

export async function getTreasurySummary(organizationId: string): Promise<TreasurySummary> {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const { rows: balanceRows } = await db.query<Row>(
    `SELECT
       (SELECT COALESCE(SUM(initial_balance), 0) FROM bank_accounts WHERE organization_id = $1 AND active) AS initial,
       (SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0)
        FROM transactions WHERE organization_id = $1) AS movs`,
    [organizationId]
  );

  const { rows: monthRows } = await db.query<Row>(
    `SELECT
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
     FROM transactions WHERE organization_id = $1 AND occurred_at >= $2`,
    [organizationId, monthStart]
  );

  const { rows: recurringRows } = await db.query<Row>(
    `SELECT type, frequency, amount FROM recurring_rules WHERE organization_id = $1 AND active = TRUE`,
    [organizationId]
  );
  let recurringMonthly = 0;
  for (const r of recurringRows) {
    const factor = r.frequency === "yearly" ? 1 / 12 : r.frequency === "quarterly" ? 1 / 3 : 1;
    recurringMonthly += num(r.amount) * factor * (r.type === "expense" ? 1 : -1);
  }

  const { rows: pendingRows } = await db.query<Row>(
    `SELECT
       COALESCE(SUM(CASE WHEN due_at < NOW() THEN total_amount ELSE 0 END), 0) AS overdue_total,
       count(CASE WHEN due_at < NOW() THEN 1 END)::int AS overdue_count,
       COALESCE(SUM(total_amount), 0) AS pending_total,
       count(*)::int AS pending_count
     FROM invoices WHERE organization_id = $1 AND payment_status = 'pending'`,
    [organizationId]
  );

  return {
    currentBalance: num(balanceRows[0].initial) + num(balanceRows[0].movs),
    monthIncome: num(monthRows[0].income),
    monthExpense: num(monthRows[0].expense),
    monthNet: num(monthRows[0].income) - num(monthRows[0].expense),
    recurringMonthlyTotal: recurringMonthly,
    pendingInvoiceTotal: num(pendingRows[0].pending_total),
    pendingInvoiceCount: num(pendingRows[0].pending_count),
    overdueInvoiceTotal: num(pendingRows[0].overdue_total),
    overdueInvoiceCount: num(pendingRows[0].overdue_count),
  };
}
