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
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${detail ? ` (${detail})` : ""}`);
}

const env = fs.readFileSync(path.join(projectRoot, ".env.local"), "utf8");
const dbUrl = env.match(/DATABASE_URL="([^"]+)"/)?.[1];
const db = new pg.Client({ connectionString: dbUrl });
await db.connect();

const quoteRows = await db.query(
  "SELECT quote_number, public_token FROM quotes WHERE public_token IS NOT NULL LIMIT 3"
);
const checkinToken = (
  await db.query("SELECT token FROM checkins WHERE token IS NOT NULL LIMIT 1")
).rows[0]?.token;
const warranty = (
  await db.query("SELECT token, certificate_number FROM warranties LIMIT 1")
).rows[0];
const qcCert = (
  await db.query(
    "SELECT certificate_number FROM qc_inspections WHERE certificate_number IS NOT NULL LIMIT 1"
  )
).rows[0]?.certificate_number;
const customer = (await db.query("SELECT name FROM customers LIMIT 1")).rows[0]?.name;
const plate = (await db.query("SELECT plate_display FROM vehicles LIMIT 1")).rows[0]
  ?.plate_display;
const material = (await db.query("SELECT name FROM materials LIMIT 1")).rows[0]?.name;
const employee = (await db.query("SELECT name FROM employees LIMIT 1")).rows[0]?.name;
const invoice = (await db.query("SELECT invoice_number FROM invoices LIMIT 1")).rows[0]
  ?.invoice_number;
await db.end();

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
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  await page.goto(`${BASE}/login`, { timeout: 45000 });
  await page.waitForLoadState("networkidle");
  record(
    "T1 /login renderiza",
    (await page.locator("h1", { hasText: "Entrar no X-Flow" }).count()) > 0 &&
      (await page.getByRole("button", { name: /Patrícia Sousa/ }).count()) > 0
  );

  await page.getByRole("button", { name: /João Martins/ }).click();
  await page.locator("#login-password").fill("password-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForSelector("text=Credenciais inválidas.", { timeout: 20000 });
  record("T2 password errada mostra erro", true);
  await page.locator("#login-password").fill("");
  await page.locator("#login-email").fill("");

  const ghostEmail = "ghost-e2e@xmotion.pt";
  let rateLimited = false;
  for (let i = 0; i < 11; i += 1) {
    await page.locator("#login-email").fill(ghostEmail);
    await page.locator("#login-password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    try {
      await page.waitForSelector("text=Demasiadas tentativas.", { timeout: 8000 });
      rateLimited = true;
      break;
    } catch {
      await page.waitForTimeout(200);
    }
  }
  record("T3 rate limit após 10 tentativas", rateLimited);

  await page.getByRole("button", { name: /Patrícia Sousa/ }).click();
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 });
  const topbarText = await page.locator("body").innerText();
  record(
    "T4 login Patrícia → dashboard",
    topbarText.includes("Centro de Comando") && topbarText.includes("Patrícia Sousa")
  );

  const internalPages = [
    { path: "/", expect: "Centro de Comando" },
    { path: "/customers", expect: customer },
    { path: "/vehicles", expect: plate },
    { path: "/quotes", expect: "Q-2026-" },
    { path: "/production", expect: "WO-2026-" },
    { path: "/calendar", expect: null },
    { path: "/stock", expect: material },
    { path: "/invoices", expect: invoice },
    { path: "/deliveries", expect: null },
    { path: "/warranties", expect: null },
    { path: "/team", expect: employee },
    { path: "/tools", expect: null },
    { path: "/time-book", expect: null },
    { path: "/b2b", expect: null },
    { path: "/my-day", expect: null },
    { path: "/reports", expect: null },
    { path: "/settings", expect: null },
    { path: "/design-system", expect: null },
    { path: "/shop-floor", expect: null },
    { path: "/simulator", expect: null },
  ];
  for (const { path: p, expect: expected } of internalPages) {
    const response = await page.goto(`${BASE}${p}`, { timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    const status = response?.status() ?? 0;
    const text = await page.locator("body").innerText().catch(() => "");
    const ok = status === 200 && text.length > 200 && (expected == null || text.includes(expected));
    record(
      `T5 ${p} com RLS (xflow_app)`,
      ok,
      `status ${status}${expected && !text.includes(expected) ? ` — sem "${expected}"` : ""}`
    );
  }

  const openProfileMenu = async () => {
    await page.getByRole("button", { name: /Patrícia Sousa/ }).first().click();
  };
  await openProfileMenu();
  await page.getByRole("button", { name: "Terminar sessão" }).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  record("T6 logout → /login", page.url().includes("/login"));

  await page.goto(`${BASE}/login?next=%2Fcustomers`, { timeout: 30000 });
  await page.getByRole("button", { name: /Patrícia Sousa/ }).click();
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/customers/, { timeout: 30000 });
  record("T7 next=%2Fcustomers respeitado", page.url().startsWith(`${BASE}/customers`));

  await openProfileMenu();
  await page.getByRole("button", { name: "Terminar sessão" }).click();
  await page.waitForURL(/\/login/, { timeout: 15000 });
  await page.goto(`${BASE}/login?next=${encodeURIComponent("https://evil.example")}`, {
    timeout: 30000,
  });
  await page.getByRole("button", { name: /Patrícia Sousa/ }).click();
  await page.locator("#login-password").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(`${BASE}/`, { timeout: 30000 });
  record(
    "T8 open redirect bloqueado",
    page.url().startsWith(BASE) && !page.url().includes("evil.example")
  );

  await context.clearCookies();
  await context.addCookies([
    { name: "xflow_session", value: "cookie-forjado-e2e", domain: "localhost", path: "/" },
  ]);
  await page.goto(`${BASE}/`, { timeout: 30000 });
  await page.waitForURL(/\/login/, { timeout: 15000 });
  record("T9a cookie forjado → redirect /login", page.url().includes("/login"));
  await page.goto(`${BASE}/login`, { timeout: 30000 });
  await page.waitForSelector("h1:has-text('Entrar no X-Flow')", { timeout: 15000 });
  record("T9b /login com cookie forjado renderiza form (sem loop)", true);

  await context.clearCookies();
  const publicRoutes = [
    { url: `${BASE}/portal/${quoteRows.rows[0].public_token}`, expect: quoteRows.rows[0].quote_number },
    {
      url: `${BASE}/quotes/public/${quoteRows.rows[1].public_token}`,
      expect: quoteRows.rows[1].quote_number,
    },
    { url: `${BASE}/checkins/report/${checkinToken}`, expect: null },
    {
      url: `${BASE}/warranties/certificate/${warranty?.token}`,
      expect: null,
    },
    { url: `${BASE}/qc/certificate/${qcCert}`, expect: null },
  ];
  for (const { url, expect: expected } of publicRoutes) {
    const response = await page.goto(url, { timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    const status = response?.status() ?? 0;
    const text = await page.locator("body").innerText().catch(() => "");
    record(
      `T10 ${url.replace(BASE, "")} pública sem sessão`,
      status === 200 && (expected == null || text.includes(expected)),
      `status ${status}`
    );
  }

  const invalid = await page.goto(`${BASE}/portal/token-invalido-xyz`, { timeout: 30000 });
  record("T10 invalid token → 404", invalid?.status() === 404, `status ${invalid?.status()}`);
} catch (err) {
  record("EXCEÇÃO INESPERADA", false, String(err).slice(0, 300));
} finally {
  await browser.close();
}

const failures = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failures.length}/${results.length} checks PASS ===`);
if (failures.length > 0) {
  console.log("Falhas:");
  for (const f of failures) console.log(`- ${f.name} ${f.detail}`);
  process.exit(1);
}
