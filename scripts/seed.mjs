// Seed Neon: organização + clientes + viaturas de demonstração.
// Idempotente: se a organização 'x-motion' existir, não faz nada.
// Uso: node scripts/seed.mjs
import pg from "pg";

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

import fs from "node:fs";

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

const { rows: orgRows } = await client.query(
  `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
  ["X-Motion Performance Detailing Center", "x-motion"]
);
const orgId = orgRows[0].id;

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
}

const vehicles = [
  { plate: "AB-12-CD", make: "BMW", model: "M4 Competition", year: 2023, body: "coupe", color: "Preto Safira", family: "black", owner: "João Martins" },
  { plate: "EF-34-GH", make: "Porsche", model: "911 Carrera", year: 2022, body: "coupe", color: "Prata GT", family: "silver", owner: "AutoStand Prime Barcelos" },
  { plate: "IJ-56-KL", make: "Audi", model: "RS6 Avant", year: 2024, body: "wagon", color: "Cinzo Nardo", family: "grey", owner: "Pedro Santos" },
  { plate: "MN-78-OP", make: "Mercedes", model: "GLC 300", year: 2023, body: "suv", color: "Branco Polar", family: "white", owner: "AutoStand Prime Barcelos" },
  { plate: "QR-90-ST", make: "Tesla", model: "Model 3", year: 2024, body: "sedan", color: "Vermelho Multicamadas", family: "red", owner: "Ana Ferreira" },
  { plate: "UV-12-WX", make: "Ferrari", model: "296 GTB", year: 2023, body: "coupe", color: "Rosso Corsa", family: "red", owner: "Apex Track & Club" },
];

for (const v of vehicles) {
  const { rows } = await client.query(
    `INSERT INTO vehicles
      (organization_id, plate_display, plate_normalized, make, model, generation_year,
       body_type, original_color_name, original_color_family)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [orgId, v.plate, v.plate.replace(/-/g, ""), v.make, v.model, v.year, v.body, v.color, v.family]
  );
  await client.query(
    `INSERT INTO vehicle_customer_links (organization_id, vehicle_id, customer_id, relationship_type, is_current)
     VALUES ($1,$2,$3,'owner',TRUE)`,
    [orgId, rows[0].id, customerIds[v.owner]]
  );
}

console.log(`Seed concluído: 1 organização, ${customers.length} clientes, ${vehicles.length} viaturas.`);
await client.end();
