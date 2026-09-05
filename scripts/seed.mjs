// Seed X-Flow: organização, equipa, clientes, viaturas, materiais, orçamentos,
// agenda, check-ins, ordens de trabalho, QC, faturas e garantias — coerentes entre si.
// Idempotente: se a organização 'x-motion' existir, não faz nada.
// Uso: node scripts/seed.mjs
import pg from "pg";
import fs from "node:fs";

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

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const org = await client.query("SELECT id FROM organizations WHERE slug = $1", ["x-motion"]);
if (org.rows.length > 0) {
  console.log("Seed ignorado: organização 'x-motion' já existe.");
  await client.end();
  process.exit(0);
}

const now = new Date();
const h = (n) => new Date(now.getTime() + n * 3600 * 1000);
const d = (n) => new Date(now.getTime() + n * 24 * 3600 * 1000);

// ── 1. Organização �───────────────────────────────────────────────────────────
const { rows: orgRows } = await client.query(
  `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
  ["X-Motion Performance Detailing Center", "x-motion"]
);
const orgId = orgRows[0].id;

// ── 2. Equipa (profiles) ────────────────────────────────────────────────────
const profiles = {};
for (const p of [
  { name: "Luís Gonçalves", email: "luis@xmotion.pt", phone: "910000001" },
  { name: "João Martins", email: "joao@xmotion.pt", phone: "910000002" },
  { name: "Ricardo Almeida", email: "ricardo@xmotion.pt", phone: "910000003" },
  { name: "Miguel Costa", email: "miguel@xmotion.pt", phone: "910000004" },
  { name: "Patrícia Sousa", email: "patricia@xmotion.pt", phone: "910000005" },
]) {
  const { rows } = await client.query(
    `INSERT INTO profiles (name, email, phone) VALUES ($1,$2,$3) RETURNING id`,
    [p.name, p.email, p.phone]
  );
  profiles[p.name] = rows[0].id;
}
for (const [name, role] of [
  ["Luís Gonçalves", "admin"],
  ["Patrícia Sousa", "workshop_manager"],
  ["João Martins", "technician"],
  ["Ricardo Almeida", "technician"],
  ["Miguel Costa", "technician"],
]) {
  await client.query(
    `INSERT INTO organization_memberships (organization_id, profile_id, role, status) VALUES ($1,$2,$3,'active')`,
    [orgId, profiles[name], role]
  );
}

// ── 3. Baias ────────────────────────────────────────────────────────────────
const bays = {};
for (const b of [
  { name: "Baia 1 — PPF", code: "PPF-1", type: "ppf", tech: "João Martins" },
  { name: "Baia 2 — Wrap", code: "WRAP-2", type: "wrap", tech: "Ricardo Almeida" },
  { name: "Baia 3 — Detailing", code: "DET-3", type: "detailing", tech: "Miguel Costa" },
]) {
  const { rows } = await client.query(
    `INSERT INTO bays (organization_id, name, code, service_type, default_technician_id) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [orgId, b.name, b.code, b.type, profiles[b.tech]]
  );
  bays[b.code] = rows[0].id;
}

// ── 4. Catálogo de serviços �─────────────────────────────────────────────────
const services = {};
for (const [cat, list] of [
  ["PPF", [["Full PPF", "PPF-FULL", 60], ["PPF Frontal", "PPF-FRONT", 60], ["PPF de Óticas", "PPF-OPT", 12]]],
  ["Wrap", [["Wrap Completo", "WRAP-FULL", 24], ["Chrome Delete", "CHROME-DEL", 24]]],
  ["Detailing", [["Detailing Interior", "DET-INT", 12]]],
]) {
  const { rows: catRows } = await client.query(
    `INSERT INTO service_categories (organization_id, name, slug) VALUES ($1,$2,$3) RETURNING id`,
    [orgId, cat, cat.toLowerCase().replace(/\s/g, "-")]
  );
  for (const [name, code, warranty] of list) {
    const { rows } = await client.query(
      `INSERT INTO services (organization_id, category_id, name, code, default_warranty_months) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [orgId, catRows[0].id, name, code, warranty]
    );
    services[name] = rows[0].id;
  }
}

// ── 5. Clientes �─────────────────────────────────────────────────────────────
const customers = [
  {
    type: "business", name: "AutoStand Prime Barcelos", legalName: "Prime Automotive Lda",
    nif: "509123456", email: "comercial@autostandprime.pt", phone: "912345678",
    preferredChannel: "whatsapp", status: "active",
    notes: "Parceiro B2B prioritário. Encaminha viaturas premium para PPF integral.",
    b2b: { discountRate: 12, paymentTermsDays: 30, priorityLevel: "vip",
      commercialNotes: "Desconto de 12% em pacotes Full PPF para frotas > 3 viaturas/mês." },
    contacts: [
      { name: "Carlos Viana", role: "Diretor Comercial", email: "carlos@autostandprime.pt",
        phone: "912345678", isPrimary: true, canApproveQuotes: true },
      { name: "Sofia Mendes", role: "Gestora de Entregas", email: "sofia@autostandprime.pt",
        phone: "912345679", isPrimary: false, canApproveQuotes: false },
    ],
  },
  {
    type: "business", name: "Apex Track & Club", legalName: "Apex Performance Club Lda",
    nif: "510987654", email: "gestao@apexclub.pt", phone: "918765432",
    preferredChannel: "email", status: "active",
    notes: "Clube de proprietários de superdesportivos e trackdays.",
    b2b: { discountRate: 8, paymentTermsDays: 15, priorityLevel: "high",
      commercialNotes: "Faturação mensal consolidada." },
    contacts: [
      { name: "Miguel Torres", role: "Club Manager", email: "miguel@apexclub.pt",
        phone: "918765432", isPrimary: true, canApproveQuotes: true },
    ],
  },
  {
    type: "individual", name: "João Martins", email: "joao.martins@gmail.com",
    phone: "914567890", preferredChannel: "whatsapp", status: "active",
    notes: "Proprietário do BMW M4. Muito exigente com acabamentos.",
  },
  {
    type: "individual", name: "Ana Ferreira", email: "ana.ferreira@outlook.com",
    phone: "915678123", preferredChannel: "phone", status: "active",
    notes: "Tesla Model 3 — pacote Chrome Delete + interior.",
  },
  {
    type: "individual", name: "Pedro Santos", email: "pedro.santos@gmail.com",
    phone: "916789234", preferredChannel: "whatsapp", status: "lead",
    notes: "Lead via Instagram. Interessado em PPF frontal para o Audi RS6.",
  },
];

const customerIds = {};
for (const c of customers) {
  const { rows } = await client.query(
    `INSERT INTO customers
      (organization_id, type, name, legal_name, nif, email, phone, phone_normalized,
       preferred_channel, notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [orgId, c.type, c.name, c.legalName ?? null, c.nif ?? null, c.email, c.phone,
     c.phone, c.preferredChannel, c.notes ?? null, c.status]
  );
  const customerId = rows[0].id;
  customerIds[c.name] = customerId;

  if (c.b2b) {
    await client.query(
      `INSERT INTO b2b_accounts (customer_id, discount_rate, payment_terms_days, priority_level, commercial_notes)
       VALUES ($1,$2,$3,$4,$5)`,
      [customerId, c.b2b.discountRate, c.b2b.paymentTermsDays, c.b2b.priorityLevel, c.b2b.commercialNotes]
    );
  }
  for (const ct of c.contacts ?? []) {
    await client.query(
      `INSERT INTO customer_contacts (customer_id, name, role, email, phone, is_primary, can_approve_quotes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [customerId, ct.name, ct.role, ct.email, ct.phone, ct.isPrimary, ct.canApproveQuotes]
    );
  }
  await client.query(
    `INSERT INTO customer_communications (customer_id, type, direction, summary, created_at)
     VALUES ($1,'whatsapp','outbound',$2,$3)`,
    [customerId, "Confirmado agendamento e preparação da viatura.", h(-48)]
  );
}

// ── 6. Viaturas + posse ─────────────────────────────────────────────────────
const vehicles = {};
for (const v of [
  { plate: "AB-12-CD", make: "BMW", model: "M4 Competition", year: 2023, body: "coupe", color: "Preto Safira", family: "black", km: 24500, owner: "João Martins" },
  { plate: "EF-34-GH", make: "Porsche", model: "911 Carrera", year: 2022, body: "coupe", color: "Prata GT", family: "silver", km: 38200, owner: "AutoStand Prime Barcelos" },
  { plate: "IJ-56-KL", make: "Audi", model: "RS6 Avant", year: 2024, body: "wagon", color: "Cinza Nardo", family: "grey", km: 8900, owner: "Pedro Santos" },
  { plate: "MN-78-OP", make: "Mercedes", model: "GLC 300", year: 2023, body: "suv", color: "Branco Polar", family: "white", owner: "AutoStand Prime Barcelos", km: 41000 },
  { plate: "QR-90-ST", make: "Tesla", model: "Model 3", year: 2024, body: "sedan", color: "Vermelho Multicamadas", family: "red", km: 15400, owner: "Ana Ferreira" },
  { plate: "UV-12-WX", make: "Ferrari", model: "296 GTB", year: 2023, body: "coupe", color: "Rosso Corsa", family: "red", km: 7200, owner: "Apex Track & Club" },
]) {
  const { rows } = await client.query(
    `INSERT INTO vehicles
      (organization_id, plate_display, plate_normalized, make, model, generation_year,
       body_type, original_color_name, original_color_family, current_mileage)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
    [orgId, v.plate, v.plate.replace(/-/g, ""), v.make, v.model, v.year, v.body,
     v.color, v.family, v.km]
  );
  vehicles[v.plate] = rows[0].id;
  await client.query(
    `INSERT INTO vehicle_customer_links (organization_id, vehicle_id, customer_id, relationship_type, is_current)
     VALUES ($1,$2,$3,'owner',TRUE)`,
    [orgId, rows[0].id, customerIds[v.owner]]
  );
}

// ── 7. Materiais e lotes �────────────────────────────────────────────────────
const materials = {};
for (const m of [
  { brand: "STEK", name: "DYNOshield PPF Gloss", type: "ppf_gloss", finish: "gloss", cost: 380, price: 650, stock: 42, min: 15, supplier: "STEK Iberia" },
  { brand: "XPEL", name: "Ultimate Plus PPF", type: "ppf_gloss", finish: "gloss", cost: 410, price: 700, stock: 12, min: 15, supplier: "XPEL Portugal" },
  { brand: "3M", name: "2080 Gloss Black", type: "cast_vinyl", finish: "gloss", cost: 95, price: 180, stock: 28, min: 10, supplier: "3M Portugal" },
  { brand: "Avery", name: "SW900 Satin Grey", type: "cast_vinyl", finish: "satin", cost: 88, price: 170, stock: 6.5, min: 10, supplier: "Avery Dennison" },
  { brand: "STEK", name: "DYNOcloud Óticas", type: "ppf_gloss", finish: "gloss", cost: 60, price: 120, stock: 3, min: 5, supplier: "STEK Iberia" },
  { brand: "Gtechniq", name: "Crystal Serum Ultra", type: "ceramic", finish: "gloss", cost: 70, price: 150, stock: 8, min: 3, supplier: "Gtechniq Iberia", unit: "bottle" },
]) {
  const status = m.stock <= 0 ? "out_of_stock" : m.stock < m.min ? "low_stock" : "available";
  const { rows } = await client.query(
    `INSERT INTO materials
      (organization_id, brand, name, type, finish, cost_per_meter, price_per_meter,
       current_stock_meters, minimum_stock_alert_meters, status, supplier_name, unit)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [orgId, m.brand, m.name, m.type, m.finish, m.cost, m.price, m.stock, m.min, status, m.supplier, m.unit ?? "meter"]
  );
  materials[m.name] = rows[0].id;
  await client.query(
    `INSERT INTO material_batches (organization_id, material_id, batch_number, supplier_name, initial_meters, remaining_meters)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [orgId, rows[0].id, `LOTE-2026-${String(Object.keys(materials).length).padStart(2, "0")}`,
     m.supplier, m.stock + 20, m.stock]
  );
}

// ── 8. Orçamentos �───────────────────────────────────────────────────────────
async function createQuote(q) {
  const token = `${q.vehicle}-${q.status}-${Math.random().toString(36).slice(2, 10)}`;
  const { rows } = await client.query(
    `INSERT INTO quotes
      (organization_id, quote_number, vehicle_id, customer_id, status, public_token, expires_at, created_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [orgId, q.number, vehicles[q.vehicle], customerIds[q.customer], q.status, token,
     d(30), profiles["Luís Gonçalves"], h(q.createdHoursAgo)]
  );
  const quoteId = rows[0].id;

  for (const o of q.options ?? []) {
    const subtotal = o.hours * 33 + o.materialCost;
    const discount = o.tier === "premium" ? subtotal * 0.05 : 0;
    const base = subtotal - discount;
    const vat = base * 0.23;
    const { rows: optRows } = await client.query(
      `INSERT INTO quote_options
        (quote_id, tier, name, description, is_recommended, warranty_years, subtotal, discount_rate,
         discount_amount, taxable_base, vat_rate, vat_amount, total_with_vat, estimated_cost,
         estimated_margin_amount, estimated_margin_percentage, estimated_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id`,
      [quoteId, o.tier, o.name, o.description, o.tier === "recommended", o.warrantyYears ?? 5,
       subtotal, o.tier === "premium" ? 5 : 0, discount, base, 0.23, vat, base + vat,
       o.materialCost + o.hours * 33, subtotal - (o.materialCost + o.hours * 33),
       ((subtotal - (o.materialCost + o.hours * 33)) / subtotal) * 100, o.hours]
    );
    const optionId = optRows[0].id;
    for (const item of o.items) {
      await client.query(
        `INSERT INTO quote_option_items
          (quote_option_id, service_name, body_part_code, body_part_name, material_name, area_m2, labor_hours, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [optionId, item.service, item.partCode, item.partName, item.material, item.area,
         item.hours, item.unitPrice, item.totalPrice]
      );
    }
    if (o.tier === "recommended") {
      await client.query(`UPDATE quotes SET selected_option_id = $1 WHERE id = $2`, [optionId, quoteId]);
    }
  }

  await client.query(
    `INSERT INTO quote_events (quote_id, event_type, description, author_name, created_at)
     VALUES ($1,'created',$2,'Luís Gonçalves',$3)`,
    [quoteId, `Orçamento criado para ${q.service}.`, h(q.createdHoursAgo)]
  );
  if (["sent", "viewed", "approved"].includes(q.status)) {
    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name, created_at)
       VALUES ($1,'sent_email',$2,'Luís Gonçalves',$3)`,
      [quoteId, "Orçamento enviado por email.", h(q.createdHoursAgo + 1)]
    );
  }
  if (q.status === "approved") {
    await client.query(
      `UPDATE quotes SET approved_at = $1, approved_by_name = $2 WHERE id = $3`,
      [h(q.createdHoursAgo + 20), q.customer, quoteId]
    );
    await client.query(
      `INSERT INTO quote_events (quote_id, event_type, description, author_name, created_at)
       VALUES ($1,'approved',$2,$3,$4)`,
      [quoteId, "Orçamento aprovado pelo cliente.", q.customer, h(q.createdHoursAgo + 20)]
    );
  }
  return quoteId;
}

// Helpers para opções padrão
const opt = (tier, name, description, hours, materialCost, warrantyYears = 5) => ({
  tier, name, description, hours, materialCost, warrantyYears,
  items: [
    { service: name, partCode: "full", partName: "Viatura completa", material: name.includes("Wrap") ? "3M 2080 Gloss Black" : "STEK DYNOshield PPF Gloss", area: 12, hours, unitPrice: materialCost, totalPrice: materialCost + hours * 33 },
  ],
});

const quoteDefs = [
  { number: "Q-2026-014", vehicle: "AB-12-CD", customer: "João Martins", service: "Full PPF", status: "approved", createdHoursAgo: 96,
    options: [opt("essential", "PPF Frontal", "Capô, para-choques e guarda-lamas.", 14, 520), opt("recommended", "Full PPF", "Proteção integral com STEK DYNOshield.", 36, 1050), opt("premium", "Full PPF + Cerâmico", "Proteção integral com acabamento cerâmico Gtechniq.", 40, 1180)] },
  { number: "Q-2026-015", vehicle: "IJ-56-KL", customer: "Pedro Santos", service: "PPF Frontal", status: "sent", createdHoursAgo: 122,
    options: [opt("essential", "PPF Frontal", "Proteção frontal essencial.", 14, 520), opt("recommended", "PPF Frontal + Óticas", "Inclui proteção de óticas.", 16, 640), opt("premium", "Full PPF", "Proteção integral.", 36, 1050)] },
  { number: "Q-2026-016", vehicle: "QR-90-ST", customer: "Ana Ferreira", service: "Chrome Delete", status: "sent", createdHoursAgo: 80,
    options: [opt("essential", "Chrome Delete Gloss", "Acabamento gloss preto.", 4, 60), opt("recommended", "Chrome Delete Satin", "Acabamento satinado premium.", 4.5, 70, 24), opt("premium", "Chrome Delete + Interior", "Inclui detailing interior.", 8, 110)] },
  { number: "Q-2026-017", vehicle: "EF-34-GH", customer: "AutoStand Prime Barcelos", service: "Wrap Completo", status: "viewed", createdHoursAgo: 150,
    options: [opt("essential", "Wrap Cobertura Exterior", "Superfícies exteriores.", 32, 480), opt("recommended", "Wrap Cobertura Estendida", "Desmontagem seletiva.", 36, 520), opt("premium", "Conversão Integral", "Inclui interiores selecionados.", 42, 640)] },
  { number: "Q-2026-018", vehicle: "UV-12-WX", customer: "Apex Track & Club", service: "Full PPF", status: "draft", createdHoursAgo: 8,
    options: [opt("recommended", "Full PPF Track", "Proteção integral para uso em pista.", 38, 1100)] },
];

const quoteIds = {};
for (const q of quoteDefs) quoteIds[q.number] = await createQuote(q);

// ── 9. Check-ins �────────────────────────────────────────────────────────────
async function createCheckin(c) {
  const { rows } = await client.query(
    `INSERT INTO checkins
      (organization_id, quote_id, vehicle_id, customer_id, type, mileage, fuel_level,
       has_roof_photo, cleanliness_status, status, technician_id, signed_by_name, token, created_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
    [orgId, c.quoteId ?? null, vehicles[c.vehicle], customerIds[c.customer], c.type, c.mileage,
     c.fuel ?? "half", true, "clean", c.status ?? "completed", profiles[c.technician ?? "João Martins"],
     c.signedBy ?? null, `chk-${Math.random().toString(36).slice(2, 12)}`, h(c.atHoursAgo), h(c.atHoursAgo + 0.5)]
  );
  return rows[0].id;
}

const checkinBmw = await createCheckin({ vehicle: "AB-12-CD", customer: "João Martins", type: "entry", mileage: 24500, status: "signed", technician: "João Martins", signedBy: "João Martins", quoteId: quoteIds["Q-2026-014"], atHoursAgo: 30 });
const checkinPorsche = await createCheckin({ vehicle: "EF-34-GH", customer: "AutoStand Prime Barcelos", type: "entry", mileage: 38200, status: "signed", technician: "Ricardo Almeida", signedBy: "Carlos Viana", atHoursAgo: 26 });
const checkinMercedes = await createCheckin({ vehicle: "MN-78-OP", customer: "AutoStand Prime Barcelos", type: "entry", mileage: 41000, status: "completed", technician: "Miguel Costa", atHoursAgo: 20 });
const checkinFerrariExit = await createCheckin({ vehicle: "UV-12-WX", customer: "Apex Track & Club", type: "exit", mileage: 7200, status: "signed", technician: "João Martins", signedBy: "Miguel Torres", atHoursAgo: 72 });

for (const [checkinId, part, type, severity, x, y] of [
  [checkinBmw, "para-choques dianteiro", "stone_chip", "minor", 30, 62],
  [checkinPorsche, "porta condutor", "scratch", "moderate", 55, 40],
]) {
  await client.query(
    `INSERT INTO checkin_damages (checkin_id, pos_x, pos_y, body_part, damage_type, severity, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [checkinId, x, y, part, type, severity, "Registada na inspeção de entrada."]
  );
}

// ── 10. Ordens de trabalho �──────────────────────────────────────────────────
const PHASES = [
  ["prep_decontamination", "Preparação e Descontaminação", 2],
  ["disassembly", "Desmontagem", 2.5],
  ["film_cutting", "Corte de Filme", 4],
  ["application", "Aplicação", 18],
  ["assembly", "Montagem", 2.5],
  ["thermal_cure", "Cura Térmica", 1.5],
  ["detailing_finish", "Detalhes e Acabamento", 1.5],
  ["quality_control", "Controlo de Qualidade", 1],
];

async function createWorkOrder(w) {
  const { rows } = await client.query(
    `INSERT INTO work_orders
      (organization_id, work_order_number, vehicle_id, customer_id, checkin_id, status,
       service_title, primary_technician_id, progress_percentage, estimated_hours,
       actual_hours_spent, started_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [orgId, w.number, vehicles[w.vehicle], customerIds[w.customer], w.checkinId ?? null,
     w.status, w.service, profiles[w.technician], w.progress, w.estimatedHours,
     w.actualHours, h(w.startedHoursAgo), w.completedHoursAgo !== undefined ? h(w.completedHoursAgo) : null]
  );
  const woId = rows[0].id;

  let idx = 0;
  for (const [key, name, estHours] of PHASES) {
    const phaseStatus = idx < w.phasesDone ? "completed" : idx === w.phasesDone && w.status === "in_progress" ? "in_progress" : "pending";
    await client.query(
      `INSERT INTO work_order_phases
        (work_order_id, phase_key, name, status, order_index, started_at, completed_at, estimated_hours, actual_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [woId, key, name, phaseStatus, idx,
       phaseStatus !== "pending" ? h(w.startedHoursAgo + idx * 5) : null,
       phaseStatus === "completed" ? h(w.startedHoursAgo + (idx + 1) * 5) : null,
       estHours, phaseStatus === "completed" ? estHours * (0.9 + Math.random() * 0.2) : 0]
    );
    if (phaseStatus !== "pending") {
      await client.query(
        `INSERT INTO work_order_time_entries (work_order_id, phase_key, technician_name, hours_spent, notes)
         VALUES ($1,$2,$3,$4,$5)`,
        [woId, key, w.technician, estHours * (0.9 + Math.random() * 0.2), "Registo automático do cronómetro."]
      );
    }
    idx++;
  }

  await client.query(
    `INSERT INTO work_order_material_usages (work_order_id, material_id, material_name, batch_number, estimated_meters, actual_meters, scrap_percentage)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [woId, materials[w.material ?? "DYNOshield PPF Gloss"], w.material ?? "DYNOshield PPF Gloss",
     "LOTE-2026-01", w.estimatedHours, w.estimatedHours * 0.82, 8.5]
  );
  return woId;
}

const woBmw = await createWorkOrder({ number: "WO-2026-101", vehicle: "AB-12-CD", customer: "João Martins", service: "Full PPF — STEK DYNOshield", status: "in_progress", technician: "João Martins", progress: 65, estimatedHours: 36, actualHours: 23.5, startedHoursAgo: 30, phasesDone: 3, checkinId: checkinBmw });
void woPorsche; const woPorsche = await createWorkOrder({ number: "WO-2026-102", vehicle: "EF-34-GH", customer: "AutoStand Prime Barcelos", service: "Wrap Completo — 3M 2080", status: "in_progress", technician: "Ricardo Almeida", progress: 40, estimatedHours: 38, actualHours: 15, startedHoursAgo: 26, phasesDone: 2, checkinId: checkinPorsche });
void woMercedes; const woMercedes = await createWorkOrder({ number: "WO-2026-103", vehicle: "MN-78-OP", customer: "AutoStand Prime Barcelos", service: "PPF Frontal", status: "waiting_parts", technician: "Miguel Costa", progress: 20, estimatedHours: 14, actualHours: 3, startedHoursAgo: 20, phasesDone: 1, checkinId: checkinMercedes, material: "Ultimate Plus PPF" });
const woFerrari = await createWorkOrder({ number: "WO-2026-098", vehicle: "UV-12-WX", customer: "Apex Track & Club", service: "Full PPF — STEK DYNOshield", status: "completed", technician: "João Martins", progress: 100, estimatedHours: 40, actualHours: 41.5, startedHoursAgo: 240, completedHoursAgo: 96, phasesDone: 8, checkinId: checkinFerrariExit });

// ── 11. QC �──────────────────────────────────────────────────────────────────
await client.query(
  `INSERT INTO qc_inspections (work_order_id, inspector_name, status, overall_notes, approved_at, certificate_number)
   VALUES ($1,'Patrícia Sousa','passed','QC aprovado sem observações.', $2, $3)`,
  [woFerrari, h(95), "QC-2026-44TX88-PASS"]
);
await client.query(
  `INSERT INTO qc_inspections (work_order_id, inspector_name, status, overall_notes)
   VALUES ($1,'Patrícia Sousa','in_rework','Deteção de partícula sob o filme no capô. Em correção.')`,
  [woBmw]
);
await client.query(
  `INSERT INTO qc_items (inspection_id, criterion_name, category, status)
   SELECT id, 'Alinhamento de cortes', 'alignment', 'pass' FROM qc_inspections WHERE work_order_id = $1`,
  [woFerrari]
);

// ── 12. Agenda (appointments) �───────────────────────────────────────────────
const appointments = [
  { vehicle: "AB-12-CD", customer: "João Martins", bay: "PPF-1", tech: "João Martins", start: h(1), hours: 6, status: "in_progress", quote: quoteIds["Q-2026-014"] },
  { vehicle: "EF-34-GH", customer: "AutoStand Prime Barcelos", bay: "WRAP-2", tech: "Ricardo Almeida", start: h(-2), hours: 8, status: "in_progress", quote: null },
  { vehicle: "QR-90-ST", customer: "Ana Ferreira", bay: "DET-3", tech: "Miguel Costa", start: h(4), hours: 5, status: "scheduled", quote: quoteIds["Q-2026-016"] },
  { vehicle: "IJ-56-KL", customer: "Pedro Santos", bay: "PPF-1", tech: "João Martins", start: h(30), hours: 8, status: "scheduled", quote: quoteIds["Q-2026-015"] },
  { vehicle: "MN-78-OP", customer: "AutoStand Prime Barcelos", bay: "WRAP-2", tech: "Ricardo Almeida", start: h(34), hours: 4, status: "scheduled", quote: null },
];
for (const a of appointments) {
  await client.query(
    `INSERT INTO appointments
      (organization_id, quote_id, vehicle_id, customer_id, bay_id, technician_id, start_time, end_time, estimated_hours, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [orgId, a.quote, vehicles[a.vehicle], customerIds[a.customer], bays[a.bay], profiles[a.tech],
     a.start, h(a.start.getUTCHours() + a.hours), a.hours, a.status, "Marcação criada na agenda."]
  );
}

// ── 13. Faturas �─────────────────────────────────────────────────────────────
const invoices = [
  { number: "FT-2026/041", vehicle: "UV-12-WX", customer: "Apex Track & Club", wo: woFerrari, subtotal: 4300, status: "paid", daysAgo: 3 },
  { number: "FT-2026/040", vehicle: "QR-90-ST", customer: "Ana Ferreira", wo: null, subtotal: 450, status: "paid", daysAgo: 8 },
  { number: "FT-2026/039", vehicle: "EF-34-GH", customer: "AutoStand Prime Barcelos", wo: null, subtotal: 1950, status: "pending", daysAgo: 5 },
];
for (const inv of invoices) {
  const vat = inv.subtotal * 0.23;
  await client.query(
    `INSERT INTO invoices
      (organization_id, invoice_number, work_order_id, customer_id, customer_name, customer_nif,
       vehicle_plate, vehicle_model, subtotal, vat_rate, vat_amount, total_amount, payment_status, issued_at, due_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [orgId, inv.number, inv.wo, customerIds[inv.customer], inv.customer, "509123456",
     inv.vehicle, inv.vehicle, inv.subtotal, 23, vat, inv.subtotal + vat, inv.status,
     d(-inv.daysAgo), d(-inv.daysAgo + 30)]
  );
}

// ── 14. Garantias �───────────────────────────────────────────────────────────
await client.query(
  `INSERT INTO warranties (organization_id, work_order_id, customer_id, vehicle_id, material_name, batch_number, warranty_years, certificate_number, qc_certificate_number, terms_text, starts_at, expires_at, token)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
  [orgId, woFerrari, customerIds["Apex Track & Club"], vehicles["UV-12-WX"], "STEK DYNOshield PPF Gloss",
   "LOTE-2026-01", 5, "CERT-2026-XM-0098", "QC-2026-44TX88-PASS",
   "Garantia de 5 anos contra defeitos de material e aplicação. Revisão anual gratuita.",
   d(-1), d(1825), "wty-2026-001"]
);
await client.query(
  `INSERT INTO deliveries (organization_id, work_order_id, vehicle_id, customer_id, delivered_by_name, receiver_name, notes, delivered_at, token)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
  [orgId, woFerrari, vehicles["UV-12-WX"], customerIds["Apex Track & Club"], "João Martins",
   "Miguel Torres", "Entrega concluída com checklist e assinatura.", h(72), "dlv-2026-001"]
);

console.log("Seed concluído: org, 5 perfis, 3 baias, catálogo, 6 materiais, 5 clientes, 6 viaturas, 5 orçamentos, 4 ordens de trabalho, QC, agenda, faturas e garantia.");
await client.end();
