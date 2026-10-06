// Importação do histórico real de faturação (Faturacao25-26.xlsx) para o X-Flow.
//
// Fase 1.5 do plano de Gestão Financeira — X-Flow_Plano_Melhoria_Faturacao_AntiGravity.md v2.0
//
// Fonte: docs/X-motion/Faturação/Faturacao25-26.xlsx
//   Bloco 2025: linhas 4..49  → colunas A=Data, B=Número, C=Cliente, D=Valor (total c/ IVA)
//   Bloco 2026: linhas 4..40  → colunas H=Data, I=Número, J=Cliente, K=Valor (total c/ IVA)
//   46 faturas 2025 (42.883,14 €) + 37 faturas 2026 (28.459,25 €) = 83 faturas (71.342,39 €)
//
// Regras:
//   - Idempotente: faturas cujo número já exista na organização 'x-motion' são ignoradas.
//   - O X-Flow NÃO emite faturas fiscais (Fase 0): este script apenas REGISTA o histórico real.
//   - Valor da folha = total COM IVA (23%): subtotal = valor / 1.23; iva = valor - subtotal.
//   - Estado de pagamento presumido 'paid' (histórico da empresa); corrigir manualmente na app.
//   - Sem matrícula na fonte: vehicle_plate/model ficam '' (podem ser ligadas depois na app).
//   - Clientes sem NIF na fonte ficam com NIF null; os validados (Carclasse 503048852,
//     RSB Automóveis 517793253) já existem no seed e são reutilizados por nome.
//
// Uso: node scripts/import-faturacao.mjs
import pg from "pg";
import fs from "node:fs";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const XLSX_PATH =
  process.argv[2] || fileURLToPath(new URL("../docs/X-motion/Faturação/Faturacao25-26.xlsx", import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (() => {
    try {
      const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
      return env.match(/DATABASE_URL="(.+)"/)?.[1];
    } catch {
      return undefined;
    }
  })();

if (!DATABASE_URL) {
  console.error("ERRO: DATABASE_URL em falta (.env.local ou env var).");
  process.exit(1);
}

// ── 1. Leitor mínimo de XLSX (ZIP + inflate, sem dependências) ───────────────
function readZipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("ZIP: EOCD não encontrado.");
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("ZIP: entrada inválida no central directory.");
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString("utf8");
    const lh = localOffset;
    if (buf.readUInt32LE(lh) !== 0x04034b50) throw new Error(`ZIP: local header inválido para ${name}.`);
    const lhNameLen = buf.readUInt16LE(lh + 26);
    const lhExtraLen = buf.readUInt16LE(lh + 28);
    const dataStart = lh + 30 + lhNameLen + lhExtraLen;
    const data = buf.slice(dataStart, dataStart + compressedSize);
    entries.set(name, { method, data });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function unzipText(buf) {
  const entries = readZipEntries(buf);
  const out = new Map();
  for (const [name, { method, data }] of entries) {
    const raw = method === 8 ? zlib.inflateRawSync(data) : data;
    out.set(name, raw.toString("utf8"));
  }
  return out;
}

// ── 2. Parser de XML das folhas (regex tolerante) ────────────────────────────
function parseSharedStrings(xml) {
  const list = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    const text = [...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("");
    list.push(text
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, "&"));
  }
  return list;
}

function parseRows(xml) {
  const rows = new Map();
  for (const m of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const rowRef = m[1].match(/r="(\d+)"/)?.[1];
    if (!rowRef) continue;
    const cells = new Map();
    for (const c of m[2].matchAll(/<c\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const body = c[2] ?? "";
      const ref = attrs.match(/r="([A-Z]+\d+)"/)?.[1];
      if (!ref) continue;
      const col = ref.replace(/\d+$/, "");
      const type = attrs.match(/t="(\w+)"/)?.[1] ?? "n";
      const valueMatch = body.match(/<v>([\s\S]*?)<\/v>/);
      let value = valueMatch?.[1];
      if (type === "s" && value !== undefined) value = currentSharedStrings[Number(value)] ?? "";
      cells.set(col, { type, value: value ?? "" });
    }
    rows.set(Number(rowRef), cells);
  }
  return rows;
}

let currentSharedStrings = [];

// ── 3. Extração dos dois blocos ──────────────────────────────────────────────
const zip = unzipText(fs.readFileSync(XLSX_PATH));
const sharedXml = zip.get("xl/sharedStrings.xml");
const sheetXml = zip.get("xl/worksheets/sheet1.xml");
if (!sharedXml || !sheetXml) throw new Error("XLSX sem sharedStrings/sheet1.");

currentSharedStrings = parseSharedStrings(sharedXml);
const rows = parseRows(sheetXml);

function isoDate(dmy) {
  const [dd, mm, yyyy] = String(dmy).trim().split("/");
  if (!yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

const records2025 = [];
for (let r = 4; r <= 49; r++) {
  const cells = rows.get(r);
  if (!cells) continue;
  const date = cells.get("A")?.value ?? "";
  const number = cells.get("B")?.value ?? "";
  const client = cells.get("C")?.value ?? "";
  const total = Number(cells.get("D")?.value ?? NaN);
  if (!number || !Number.isFinite(total)) continue;
  records2025.push({ year: 2025, date: isoDate(date), number: number.trim(), client: client.trim(), total });
}
const records2026 = [];
for (let r = 4; r <= 40; r++) {
  const cells = rows.get(r);
  if (!cells) continue;
  const date = cells.get("H")?.value ?? "";
  const number = cells.get("I")?.value ?? "";
  const client = cells.get("J")?.value ?? "";
  const total = Number(cells.get("K")?.value ?? NaN);
  if (!number || !Number.isFinite(total)) continue;
  records2026.push({ year: 2026, date: isoDate(date), number: number.trim(), client: client.trim(), total });
}

const all = [...records2025, ...records2026];
const sum2025 = records2025.reduce((a, r) => a + r.total, 0);
const sum2026 = records2026.reduce((a, r) => a + r.total, 0);

console.log(`Extração: ${records2025.length} faturas 2025 (${sum2025.toFixed(2)} €) · ${records2026.length} faturas 2026 (${sum2026.toFixed(2)} €)`);
if (process.env.DRY_RUN) {
  const clients = [...new Set(all.map((r) => r.client))].sort((a, b) => a.localeCompare(b, "pt"));
  console.log(`\nClientes únicos (${clients.length}):`);
  for (const c of clients) {
    const n = all.filter((r) => r.client === c).length;
    const total = all.filter((r) => r.client === c).reduce((a, r) => a + r.total, 0);
    console.log(`  - ${c} (${n} faturas, ${total.toFixed(2)} €)`);
  }
  console.log("\nDRY_RUN: nenhuma alteração na base de dados.");
  process.exit(0);
}
if (records2025.length !== 46 || records2026.length !== 37) {
  console.error("ERRO: contagem difere do esperado (46 em 2025 / 37 em 2026). A abortar.");
  process.exit(1);
}
if (Math.abs(sum2025 - 42883.14) > 0.5 || Math.abs(sum2026 - 28459.25) > 0.5) {
  console.error("ERRO: totais difere do esperado (42.883,14 / 28.459,25 €). A abortar.");
  process.exit(1);
}

// ── 4. Importação idempotente para a organização x-motion ────────────────────
const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const { rows: orgRows } = await client.query("SELECT id FROM organizations WHERE slug = $1", ["x-motion"]);
if (orgRows.length === 0) {
  console.error("ERRO: organização 'x-motion' não existe. Corre node scripts/seed.mjs primeiro.");
  await client.end();
  process.exit(1);
}
const orgId = orgRows[0].id;

const { rows: existingNumbers } = await client.query(
  "SELECT invoice_number FROM invoices WHERE organization_id = $1",
  [orgId]
);
const existingSet = new Set(existingNumbers.map((r) => r.invoice_number));

const { rows: existingCustomers } = await client.query(
  "SELECT id, name, legal_name FROM customers WHERE organization_id = $1",
  [orgId]
);
const normName = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const customersByName = new Map();
for (const c of existingCustomers) {
  if (c.name) customersByName.set(normName(c.name), c.id);
  if (c.legal_name) customersByName.set(normName(c.legal_name), c.id);
}

let inserted = 0;
let skipped = 0;
const round2 = (x) => Math.round(x * 100) / 100;

for (const rec of all) {
  if (existingSet.has(rec.number)) {
    skipped++;
    continue;
  }
  let customerId = customersByName.get(normName(rec.client));
  if (!customerId) {
    const { rows: created } = await client.query(
      `INSERT INTO customers
        (organization_id, type, name, email, phone, phone_normalized, preferred_channel, status, notes)
       VALUES ($1,'business',$2,'','','','whatsapp','active',$3) RETURNING id`,
      [orgId, rec.client, "Importado do histórico real (Faturacao25-26.xlsx). Contactos por completar."]
    );
    customerId = created[0].id;
    customersByName.set(normName(rec.client), customerId);
  }

  const total = round2(rec.total);
  const subtotal = round2(total / 1.23);
  const vat = round2(total - subtotal);

  await client.query(
    `INSERT INTO invoices
      (organization_id, invoice_number, work_order_id, customer_id, customer_name, customer_nif,
       vehicle_plate, vehicle_model, subtotal, vat_rate, vat_amount, total_amount,
       payment_method, payment_status, issued_at, due_at, paid_at)
     VALUES ($1,$2,NULL,$3,$4,'',$5,'',$6,23,$7,$8,'bank_transfer','paid',$9,$9,NULL)`,
    [orgId, rec.number, customerId, rec.client, "", subtotal.toFixed(2), vat.toFixed(2), total.toFixed(2), rec.date]
  );
  inserted++;
}

console.log(`Importação concluída: ${inserted} faturas inseridas, ${skipped} já existentes (ignoradas).`);
await client.end();
