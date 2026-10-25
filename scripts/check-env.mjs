import fs from "node:fs";

const envFile = new URL("../.env.local", import.meta.url);
const envText = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";

function read(name) {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const match = envText.match(
    new RegExp(`^\\s*${name}\\s*=\\s*"?([^"\\r\\n]+)"?\\s*$`, "m")
  );
  return match?.[1]?.trim() ?? "";
}

const problems = [];
const databaseUrl = read("DATABASE_URL");
const appUrl = read("DATABASE_URL_APP");
const publicUrl = read("NEXT_PUBLIC_APP_URL");

if (!databaseUrl) {
  problems.push("DATABASE_URL em falta.");
}
if (!appUrl) {
  problems.push(
    "DATABASE_URL_APP em falta. Cria a role não-owner com: node scripts/create-db-role.mjs"
  );
}
if (appUrl) {
  try {
    const host = new URL(appUrl).hostname;
    if (host.includes("-pooler.")) {
      problems.push(
        "DATABASE_URL_APP usa o pooler. A RLS precisa de ligação direta (sem pooler)."
      );
    }
  } catch {
    problems.push("DATABASE_URL_APP não é um URL válido.");
  }
}
if (process.env.NODE_ENV === "production" && !publicUrl) {
  problems.push("NEXT_PUBLIC_APP_URL em falta em produção.");
}

const aiProvider = (read("AI_PROVIDER") || "gemini").toLowerCase();
const geminiKey = read("GEMINI_API_KEY");
if (aiProvider !== "none" && aiProvider !== "disabled" && !geminiKey) {
  console.warn(
    "AVISO: GEMINI_API_KEY em falta. O assistente usa respostas determinísticas e voz do navegador."
  );
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`ERRO: ${problem}`);
  process.exit(1);
}

console.log("OK: variáveis de ambiente essenciais presentes.");
