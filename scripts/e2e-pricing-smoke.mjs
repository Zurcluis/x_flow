import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cbBase =
  "C:/Users/User/AppData/Local/Programs/CulturaBuilder/lib/cultura-builder/0.1.44/node_modules";
const cbRequire = createRequire(path.join(cbBase, "anchor.js"));
const { chromium } = cbRequire("playwright");
const pg = createRequire(path.join(projectRoot, "package.json"))("pg");

const BASE = process.env.XFLOW_BASE_URL ?? "http://localhost:3000";
const DEMO_PASSWORD = "xflow-demo-2026";

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

const norm = (s) => s.replace(/[\u00a0\u202f]/g, " ");

const env = fs.readFileSync(path.join(projectRoot, ".env.local"), "utf8");
const dbUrl = env.match(/DATABASE_URL="([^"]+)"/)?.[1];
const db = new pg.Client({ connectionString: dbUrl });
await db.connect();

// ===== Verificações na base de dados =====
const rubricas = (
  await db.query(
    `SELECT pei.name, pei.amount, pei.category, pei.kind
     FROM pricing_expense_items pei
     JOIN organizations o ON o.id = pei.organization_id
     WHERE o.slug = 'x-motion'`
  )
).rows;
const expectedRubricas = [
  ["Remuneração e encargos", 1328.25, "operational", "expense"],
  ["Renda do pavilhão", 630.74, "operational", "expense"],
  ["Água e eletricidade", 200, "operational", "expense"],
  ["Contabilidade", 75, "operational", "expense"],
  ["Telefone, internet e software", 60, "operational", "expense"],
  ["Seguros e saúde no trabalho", 120, "operational", "expense"],
  ["Manutenção e ferramentas", 200, "operational", "reserve"],
  ["Marketing e divulgação", 150, "operational", "expense"],
  ["Alimentação e pequenas despesas", 250, "operational", "provision"],
  ["Prestação ao Fábio (aquisição)", 833.33, "acquisition", "cash_recovery"],
];
const rubricasByName = new Map(rubricas.map((r) => [r.name, r]));
const rubricasOk =
  rubricas.length === 10 &&
  expectedRubricas.every(
    ([name, amount, category, kind]) => {
      const r = rubricasByName.get(name);
      return (
        r &&
        Math.abs(Number(r.amount) - amount) < 0.01 &&
        r.category === category &&
        r.kind === kind
      );
    }
  );
record(
  "D1 10 rubricas semeadas com valores corretos",
  rubricasOk,
  rubricasOk ? "" : JSON.stringify(rubricas)
);

const kits = (
  await db.query(
    `SELECT ck.code, ck.price FROM consumable_kits ck
     JOIN organizations o ON o.id = ck.organization_id
     WHERE o.slug = 'x-motion' ORDER BY ck.code`
  )
).rows;
const kitsOk =
  kits.length === 3 &&
  kits[0].code === "kit-ppf-front" &&
  Math.abs(Number(kits[0].price) - 20) < 0.01 &&
  kits[1].code === "kit-spot" &&
  Math.abs(Number(kits[1].price) - 8) < 0.01 &&
  kits[2].code === "kit-wrap" &&
  Math.abs(Number(kits[2].price) - 40) < 0.01;
record("D2 3 kits semeados (spot 8, ppf_front 20, wrap_full 40)", kitsOk, kitsOk ? "" : JSON.stringify(kits));

const formulas = (
  await db.query(
    `SELECT pf.code, COUNT(pfv.id)::int AS versoes
     FROM pricing_formulas pf
     JOIN organizations o ON o.id = pf.organization_id
     LEFT JOIN pricing_formula_versions pfv ON pfv.formula_id = pf.id AND pfv.status = 'published'
     WHERE o.slug = 'x-motion'
     GROUP BY pf.code ORDER BY pf.code`
  )
).rows;
record(
  "D3 fórmulas complete/spot com versão publicada",
  formulas.length === 2 && formulas.every((f) => f.versoes >= 1),
  formulasOkDetail(formulas)
);
function formulasOkDetail(rows) {
  return rows.map((r) => `${r.code}:${r.versoes}`).join(", ");
}

const policy = (
  await db.query(
    `SELECT pp.method, pp.manual_daily_expenses, pp.daily_capacity_hours, pp.profit_daily_target,
            pp.spot_surcharge_per_hour, pp.sublet_fee_percent, pp.waste_rate_percent, pp.vat_rate
     FROM pricing_policies pp
     JOIN organizations o ON o.id = pp.organization_id
     WHERE o.slug = 'x-motion' AND pp.status = 'active'
     ORDER BY pp.version DESC LIMIT 1`
  )
).rows[0];
const policyOk =
  policy &&
  policy.method === "manual" &&
  Math.abs(Number(policy.manual_daily_expenses) - 172) < 0.01 &&
  Math.abs(Number(policy.daily_capacity_hours) - 8) < 0.01 &&
  Math.abs(Number(policy.profit_daily_target) - 200) < 0.01 &&
  Math.abs(Number(policy.spot_surcharge_per_hour) - 25) < 0.01 &&
  Math.abs(Number(policy.sublet_fee_percent) - 15) < 0.01 &&
  Math.abs(Number(policy.waste_rate_percent) - 15) < 0.01 &&
  Math.abs(Number(policy.vat_rate) - 23) < 0.01;
record("D4 política v1 ativa (manual, 172/8h/200/25/15/15/23)", policyOk, policyOk ? "" : JSON.stringify(policy));

// ===== Verificações na interface (headless) =====
let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch {
  try {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
  } catch {
    browser = await chromium.launch({ headless: true, channel: "msedge" });
  }
}
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(`${BASE}/login`, { timeout: 45000 });
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /Patrícia Sousa/ }).click();
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 });
  record("U1 login Patrícia (admin)", true);

  // --- Definições de preços: separadores ---
  await page.goto(`${BASE}/settings/pricing`, { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  let text = norm(await page.locator("body").innerText());
  record(
    "U2 ecrã de preços com 4 separadores",
    text.includes("Despesas e reservas") &&
      text.includes("Base financeira") &&
      text.includes("Fórmulas") &&
      text.includes("Kits e fornecedores")
  );
  record(
    "U3 separador de despesas: rubricas e totais",
    text.includes("Remuneração e encargos") &&
      text.includes("Renda do pavilhão") &&
      text.includes("3013,99") &&
      text.includes("833,33") &&
      text.includes("3847,32"),
    text.includes("3013,99") && text.includes("3847,32") ? "" : "totais ausentes"
  );
  record(
    "U4 rubricas de aquisição visíveis na lista",
    text.includes("Aquisição — recuperação de caixa") &&
      text.includes("Prestação ao Fábio (aquisição)")
  );

  await page.getByRole("button", { name: /Base financeira/ }).first().click();
  await page.waitForTimeout(600);
  text = norm(await page.locator("body").innerText());
  record(
    "U5 base financeira: tarifas calculadas",
    text.includes("46,50") && text.includes("71,50") && text.includes("21,50"),
    ""
  );

  await page.getByRole("button", { name: /Fórmulas/ }).first().click();
  await page.waitForTimeout(600);
  text = norm(await page.locator("body").innerText());
  record(
    "U6 fórmulas: cartões e componentes",
    text.includes("Serviço completo") &&
      text.includes("Serviço pontual") &&
      text.includes("Despesas e reservas atribuídas") &&
      text.includes("Acréscimo pontual por hora")
  );

  await page.getByRole("button", { name: /Kits e fornecedores/ }).first().click();
  await page.waitForTimeout(600);
  text = norm(await page.locator("body").innerText());
  record(
    "U7 kits: 3 kits listados",
    text.includes("Kit de consumíveis — serviço pontual") &&
      text.includes("Kit de consumíveis — PPF frente") &&
      text.includes("Kit de consumíveis — wrap integral")
  );

  // --- Novo orçamento em modo Serviço direto ---
  await page.goto(`${BASE}/quotes/new`, { timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  text = norm(await page.locator("body").innerText());
  record(
    "U8 novo orçamento: modo Serviço direto ativo",
    text.includes("Serviço direto") && text.includes("Configurador de peças (PPF)")
  );

  const hoursInput = page.locator('input[type="number"][placeholder="0"]').first();
  await hoursInput.fill("3");
  await page.waitForTimeout(800);
  text = norm(await page.locator("body").innerText());
  record(
    "U9 sugestão calculada (3h × 46,50 = 139,50 €)",
    text.includes("139,5"),
    ""
  );
  record("U10 IVA de 23% no resumo", text.includes("23%"));

  const finalInput = page.locator('input[type="number"][step="0.01"]').first();
  await finalInput.fill("160");
  await page.waitForTimeout(400);
  text = norm(await page.locator("body").innerText());
  record(
    "U11 diferença face à sugestão calculada (+20,50)",
    text.includes("20,5"),
    ""
  );

  // --- U12: emitir orçamento flexível pela UI ---
  await page
    .locator('input[placeholder="ex.: Aplicação de PPF frontal"]')
    .fill("Teste E2E preços flexíveis");
  await finalInput.fill("");
  await page.waitForTimeout(500);

  let u12Navigated = false;
  let u12NavError = "";
  try {
    await page
      .getByRole("button", { name: /Emitir e gerar link seguro/i })
      .click({ timeout: 10000 });
    await page.waitForURL(/\/quotes\/[0-9a-f-]+/, { timeout: 45000 });
    u12Navigated = true;
  } catch (err) {
    u12NavError = String(err).slice(0, 200);
  }
  const emittedQuoteId = page.url().match(/\/quotes\/([0-9a-f-]+)/)?.[1] ?? null;

  await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
  text = norm(await page.locator("body").innerText());
  const u12Missing = [
    !text.includes("139,5") && "139,5 (preço sem IVA)",
    !text.includes("171,59") && "171,59 (total com IVA)",
  ].filter(Boolean);
  const u12Detail = !u12Navigated
    ? `sem redirecionamento (${u12NavError}); URL atual: ${page.url()}`
    : u12Missing.length > 0
    ? `URL ${page.url()} — faltam: ${u12Missing.join(", ")} — linhas com números: ${text
        .split("\n")
        .filter((l) => /[0-9]/.test(l) && l.includes(","))
        .slice(0, 40)
        .join(" | ")
        .slice(0, 800)}`
    : "";
  record(
    "U12 emitir orçamento flexível (→ /quotes/[id] com 139,5 e 171,59)",
    u12Navigated && u12Missing.length === 0,
    u12Detail
  );

  // --- D5: snapshot na base de dados (browser ainda aberto; U13/U14 usam o token) ---
  let publicToken = null;
  if (emittedQuoteId) {
    let snap = null;
    let snapError = "";
    try {
      snap =
        (
          await db.query(
            `SELECT q.quote_number, q.status, q.public_token,
                    s.revision, s.suggested_price, s.price_before_vat, s.vat_rate,
                    s.vat_amount, s.total_with_vat, s.adjust_kind,
                    s.payload->>'kind' AS payload_kind, s.payload
             FROM quotes q
             JOIN quote_pricing_snapshots s ON s.quote_id = q.id
             JOIN organizations o ON o.id = q.organization_id
             WHERE o.slug = 'x-motion' AND q.id = $1
             ORDER BY q.created_at DESC LIMIT 1`,
            [emittedQuoteId]
          )
        ).rows[0] ?? null;
    } catch (err) {
      snapError = String(err).slice(0, 200);
    }
    if (snap) {
      const d5Failed = [
        ["status=sent", snap.status === "sent"],
        ["public_token presente", Boolean(snap.public_token)],
        ["revision=1", Number(snap.revision) === 1],
        ["suggested_price=139.50", Math.abs(Number(snap.suggested_price) - 139.5) < 0.005],
        ["price_before_vat=139.50", Math.abs(Number(snap.price_before_vat) - 139.5) < 0.005],
        ["vat_rate=23 (percentagem)", Math.abs(Number(snap.vat_rate) - 23) < 0.005],
        ["vat_amount=32.09", Math.abs(Number(snap.vat_amount) - 32.09) < 0.005],
        ["total_with_vat=171.59", Math.abs(Number(snap.total_with_vat) - 171.59) < 0.005],
        ["adjust_kind=none", snap.adjust_kind === "none"],
        ["payload kind=flexible", snap.payload_kind === "flexible"],
      ]
        .filter(([, ok]) => !ok)
        .map(([n]) => n);
      record(
        "D5 snapshot na BD (status sent, revision 1, valores e kind flexible)",
        d5Failed.length === 0,
        d5Failed.length > 0
          ? `${d5Failed.join("; ")} — payload keys: ${Object.keys(snap.payload ?? {}).join(", ")}`
          : ""
      );
      if (snap.public_token) publicToken = snap.public_token;
    } else {
      record(
        "D5 snapshot na BD (status sent, revision 1, valores e kind flexible)",
        false,
        snapError || "nenhum snapshot para o orçamento emitido"
      );
    }
  } else {
    record(
      "D5 snapshot na BD (status sent, revision 1, valores e kind flexible)",
      false,
      "sem id de orçamento (U12 não emitiu)"
    );
  }

  // --- U13: vista pública /quotes/public/[token] ---
  if (publicToken) {
    const resp = await page.goto(`${BASE}/quotes/public/${publicToken}`, {
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    text = norm(await page.locator("body").innerText());
    const u13Missing = [
      !text.includes("Teste E2E preços flexíveis") && "nome do serviço",
      !text.includes("171,59") && "171,59",
      !text.includes("23%") && "23%",
      !text.includes("Válido") && "Válido",
    ].filter(Boolean);
    record(
      "U13 vista pública /quotes/public/[token]",
      resp?.status() === 200 && u13Missing.length === 0,
      u13Missing.length > 0
        ? `status ${resp?.status()} — faltam: ${u13Missing.join(", ")}`
        : ""
    );
  } else {
    record("U13 vista pública /quotes/public/[token]", false, "token indisponível (D5 falhou)");
  }

  // --- U14: vista portal /portal/[token] ---
  if (publicToken) {
    const resp = await page.goto(`${BASE}/portal/${publicToken}`, {
      timeout: 60000,
    });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    text = norm(await page.locator("body").innerText());
    const u14Missing = [
      !text.includes("171,59") && "171,59",
      !text.includes("Teste E2E preços flexíveis") && "nome do serviço",
    ].filter(Boolean);
    record(
      "U14 vista portal /portal/[token]",
      resp?.status() === 200 && u14Missing.length === 0,
      u14Missing.length > 0
        ? `status ${resp?.status()} — faltam: ${u14Missing.join(", ")}`
        : ""
    );
  } else {
    record("U14 vista portal /portal/[token]", false, "token indisponível (D5 falhou)");
  }
} catch (err) {
  record("EXCEÇÃO INESPERADA", false, String(err).slice(0, 300));
} finally {
  await browser.close();
}

await db.end();

const failed = results.filter((r) => !r.pass);
console.log(
  `\n${results.length - failed.length}/${results.length} verificações OK`
);
process.exit(failed.length > 0 ? 1 : 0);
