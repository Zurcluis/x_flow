import { build } from "esbuild";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "xmotion-site-test-"));
try {
  const files = (await readdir("tests")).filter((name) => name.endsWith(".test.ts"));
  await build({
    entryPoints: files.map((name) => `tests/${name}`),
    outdir: dir,
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
  });
  const result = spawnSync(
    process.execPath,
    ["--test", ...files.map((name) => join(dir, name.replace(/\.ts$/, ".mjs")))],
    { stdio: "inherit" },
  );
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
