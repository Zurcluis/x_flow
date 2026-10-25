// Aplica migrações estruturais pendentes (idempotente por deteção de colunas)
// Uso: node scripts/migrate.mjs
import pg from "pg";
import fs from "node:fs";
import { hashPassword, verifyPassword, DEMO_PASSWORD } from "./auth-crypto.mjs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const client = new pg.Client({ connectionString: url });
await client.connect();

const migration13 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000013_employees_absences.sql", import.meta.url),
  "utf8"
);

const migration14 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000014_checkin_photos_damages.sql", import.meta.url),
  "utf8"
);

const migration15 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000015_films_delivery_belongings.sql", import.meta.url),
  "utf8"
);

const migration16 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000016_auth_sessions.sql", import.meta.url),
  "utf8"
);

const migration17 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000017_rls_policies_all.sql", import.meta.url),
  "utf8"
);

const hasColumn = async (table, column) => {
  const r = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return r.rows[0].n > 0;
};

const hasTable = async (table) => {
  const r = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return r.rows[0].n > 0;
};

const hasPolicy = async (table, policy) => {
  const r = await client.query(
    `SELECT count(*)::int AS n FROM pg_policies WHERE schemaname='public' AND tablename=$1 AND policyname=$2`,
    [table, policy]
  );
  return r.rows[0].n > 0;
};

// 000013 — employees.email/phone + employee_absences
if (!(await hasColumn("employees", "email")) || !(await hasTable("employee_absences"))) {
  await client.query(migration13);
  console.log("OK: 20260828000013");
} else {
  console.log("20260828000013 já aplicada.");
}

// 000014 — checkin_damages.photo_id + checkins.belongings + CHECK de angles
if (!(await hasColumn("checkin_damages", "photo_id")) || !(await hasColumn("checkins", "belongings"))) {
  await client.query(migration14);
  console.log("OK: 20260828000014");
} else {
  console.log("20260828000014 já aplicada.");
}

// 000015 — films (catálogo de películas p/ simulador) + deliveries.belongings
if (!(await hasTable("films")) || !(await hasColumn("deliveries", "belongings"))) {
  await client.query(migration15);
  console.log("OK: 20260828000015");
} else {
  console.log("20260828000015 já aplicada.");
}

// 000016 — autenticação: profiles.password_hash/last_login_at + auth_sessions
if (!(await hasTable("auth_sessions")) || !(await hasColumn("profiles", "password_hash"))) {
  await client.query(migration16);
  console.log("OK: 20260828000016");
} else {
  console.log("20260828000016 já aplicada.");
}

// 000017 — RLS em todas as tabelas + políticas org_isolation_* completas
if (!(await hasPolicy("organizations", "org_isolation_organizations"))) {
  await client.query(migration17);
  console.log("OK: 20260828000017");
} else {
  console.log("20260828000017 já aplicada.");
}

// 000018 — helper current_organization_id() null-safe (RESET deixa '' em vez de NULL)
const fnSrc = await client.query(
  `SELECT p.prosrc FROM pg_proc p
   JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public' AND p.proname = 'current_organization_id'
   LIMIT 1`
);
if (!fnSrc.rows[0]?.prosrc.includes("NULLIF")) {
  const migration18 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000018_rls_null_safe_helper.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration18);
  console.log("OK: 20260828000018");
} else {
  console.log("20260828000018 já aplicada.");
}

// 000019 — perfis da equipa visíveis aos membros da organização (joins de UI)
const profilesPolicy = await client.query(
  `SELECT pg_get_expr(polqual, polrelid) AS expr FROM pg_policy
   WHERE polname = 'profiles_self' AND polrelid = 'public.profiles'::regclass`
);
if (!profilesPolicy.rows[0]?.expr.includes("organization_memberships")) {
  const migration19 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000019_profiles_team_visibility.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration19);
  console.log("OK: 20260828000019");
} else {
  console.log("20260828000019 já aplicada.");
}

// 000020 — políticas separadas de leitura/escrita (profiles, organization_memberships)
const hasSplit =
  (await client.query(
    `SELECT count(*)::int AS n FROM pg_policy
     WHERE polrelid = 'public.organization_memberships'::regclass
       AND polname IN ('memberships_read', 'memberships_org_write')`
  )).rows[0].n === 2;
if (!hasSplit) {
  const migration20 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000020_policies_split_read_write.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration20);
  console.log("OK: 20260828000020");
} else {
  console.log("20260828000020 já aplicada.");
}

// 000021 — preços flexíveis: políticas, rubricas, fórmulas, kits, fornecedores, linhas de custo e snapshots
const pricingTables = await client.query(
  `SELECT count(*)::int AS n FROM information_schema.tables
   WHERE table_schema='public' AND table_name='pricing_policies'`
);
if (pricingTables.rows[0].n === 0) {
  const migration21 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000021_pricing_flexibility.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration21);
  console.log("OK: 20260828000021");
} else {
  console.log("20260828000021 já aplicada.");
}

// 000022 — corretiva: completa rubricas e kits de referência (guardas por nome/código)
const missingSeed = (
  await client.query(
    `SELECT count(*)::int AS n
     FROM organizations o
     WHERE o.slug = 'x-motion'
       AND NOT EXISTS (SELECT 1 FROM pricing_expense_items pei WHERE pei.organization_id = o.id AND pei.name = 'Renda do pavilhão')`
  )
).rows[0].n;
if (missingSeed > 0) {
  const migration22 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000022_correct_pricing_seeds.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration22);
  console.log("OK: 20260828000022");
} else {
  console.log("20260828000022 já aplicada.");
}

// 000023 — fases de subcontratação: chave 'subcontracted' + referência/custo real na fase
const subletPhaseColumn = await hasColumn("work_order_phases", "supplier_service_id");
if (!subletPhaseColumn) {
  const migration23 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000023_work_order_sublet_phases.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration23);
  console.log("OK: 20260828000023");
} else {
  console.log("20260828000023 já aplicada.");
}

// 000024 — núcleo de tesouraria: transactions, categorias, recorrentes e contas
if (!(await hasTable("transactions"))) {
  const migration24 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000024_finance_treasury.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration24);
  console.log("OK: 20260828000024");
} else {
  console.log("20260828000024 já aplicada.");
}

// 000025 — rotação obrigatória de password no primeiro acesso
if (!(await hasColumn("profiles", "must_change_password"))) {
  const migration25 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000025_password_rotation.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration25);
  console.log("OK: 20260828000025");
} else {
  console.log("20260828000025 já aplicada.");
}

// 000026 — backfill dos templates de checklist nas fases criadas sem itens
const phasesWithoutChecklist = (
  await client.query(
    `SELECT count(*)::int AS n
     FROM work_order_phases ph
     WHERE NOT EXISTS (
       SELECT 1 FROM work_order_checklist_items ci WHERE ci.phase_id = ph.id
     )`
  )
).rows[0].n;
if (phasesWithoutChecklist > 0) {
  const migration26 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000026_production_checklist_backfill.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration26);
  console.log(`OK: 20260828000026 (${phasesWithoutChecklist} fase(s) preenchida(s))`);
} else {
  console.log("20260828000026 já aplicada.");
}

// 000027 — índices das tabelas filhas de check-in + consistência de assinatura
const checkinIndexes = await client.query(
  `SELECT count(*)::int AS n FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_checkin_photos_checkin_angle', 'idx_checkin_damages_checkin')`
);
const signedConstraint = await client.query(
  `SELECT count(*)::int AS n FROM pg_constraint
   WHERE conname = 'checkins_signed_requires_signature'
     AND conrelid = 'public.checkins'::regclass`
);
const staleSigned = await client.query(
  `SELECT count(*)::int AS n FROM checkins
   WHERE status = 'signed' AND signature_data_url IS NULL`
);
if (
  checkinIndexes.rows[0].n < 2 ||
  signedConstraint.rows[0].n === 0 ||
  staleSigned.rows[0].n > 0
) {
  const migration27 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000027_checkin_indexes_signature_consistency.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration27);
  console.log(`OK: 20260828000027 (${staleSigned.rows[0].n} check-in(s) corrigido(s))`);
} else {
  console.log("20260828000027 já aplicada.");
}

// 000028 — índices das tabelas de QC
const qcIndexes = await client.query(
  `SELECT count(*)::int AS n FROM pg_indexes
   WHERE schemaname = 'public'
     AND indexname IN ('idx_qc_inspections_work_order', 'idx_qc_items_inspection')`
);
if (qcIndexes.rows[0].n < 2) {
  const migration28 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000028_qc_child_indexes.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration28);
  console.log("OK: 20260828000028");
} else {
  console.log("20260828000028 já aplicada.");
}

// 000029 — histórico de conversas do assistente
if (!(await hasTable("assistant_conversations"))) {
  const migration29 = fs.readFileSync(
    new URL("../supabase/migrations/20260828000029_assistant_conversations.sql", import.meta.url),
    "utf8"
  );
  await client.query(migration29);
  console.log("OK: 20260828000029");
} else {
  console.log("20260828000029 já aplicada.");
}

// Backfill de passwords demo (idempotente): só preenche password_hash IS NULL
const teamEmails = [
  "luis@xmotion.pt",
  "joao@xmotion.pt",
  "ricardo@xmotion.pt",
  "miguel@xmotion.pt",
  "patricia@xmotion.pt",
];

if (await hasColumn("profiles", "password_hash")) {
  let backfilled = 0;
  for (const email of teamEmails) {
    const r = await client.query(
      "SELECT id FROM profiles WHERE lower(email) = $1 AND password_hash IS NULL LIMIT 1",
      [email]
    );
    if (r.rows.length > 0) {
      const hash = await hashPassword(DEMO_PASSWORD);
      await client.query("UPDATE profiles SET password_hash = $1 WHERE id = $2", [
        hash,
        r.rows[0].id,
      ]);
      backfilled += 1;
    }
  }
  if (backfilled > 0) {
    console.log(`OK: password demo definida para ${backfilled} perfil(is).`);
  }
  console.log(
    "Nota: backfill demo aplicado. Define passwords individuais com scripts/set-password.mjs."
  );
}

// Rotação opcional: marca como obrigatória a troca de password nos perfis que
// ainda usam a password demo. Uso: node scripts/migrate.mjs --rotate-demo-passwords
if (process.argv.includes("--rotate-demo-passwords")) {
  let rotated = 0;
  for (const email of teamEmails) {
    const r = await client.query(
      "SELECT password_hash FROM profiles WHERE lower(email) = $1 AND password_hash IS NOT NULL LIMIT 1",
      [email]
    );
    const stored = r.rows[0]?.password_hash;
    if (stored && (await verifyPassword(DEMO_PASSWORD, stored))) {
      await client.query(
        "UPDATE profiles SET must_change_password = TRUE WHERE lower(email) = $1",
        [email]
      );
      rotated += 1;
    }
  }
  console.log(`OK: rotação obrigatória marcada para ${rotated} perfil(is) com password demo.`);
}

await client.end();
