import assert from "node:assert/strict";
import { it } from "node:test";
import { POST } from "../src/app/api/generate/route";
import { GET } from "../src/app/api/status/route";
import { isReady } from "../src/lib/ai-provider";
import { isSameOrigin } from "../src/lib/request-origin";

it("unconfigured app never calls a provider and gives setup instructions", async () => {
  const saved = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
  };
  const savedFetch = globalThis.fetch;
  let calls = 0;
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  delete process.env.HF_TOKEN;
  globalThis.fetch = async () => {
    calls++;
    throw new Error("Unexpected network");
  };
  try {
    assert.equal(isReady({ AI_PROVIDER: "openrouter", AI_API_KEY: "   " }), false);
    assert.equal(isReady({ AI_PROVIDER: "huggingface", HF_TOKEN: "   " }), false);
    assert.equal(isReady({ AI_PROVIDER: "huggingface", HF_TOKEN: "hf_example_token" }), true);
    const status = await GET();
    assert.deepEqual(await status.json(), {
      ready: false,
      provider: null,
      accessRequired: false,
    });
    const result = await POST(
      new Request("https://example.com/api/generate", {
        method: "POST",
        headers: { Origin: "https://example.com", "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "data:image/jpeg;base64,/9j/",
          config: {
            service: "vinil",
            color: "original",
            finish: "Brilhante",
            headlights: "Original",
            chromeDelete: {
              doors: false,
              front: false,
              rear: false,
              mirrors: false,
              finish: "Preto brilho",
            },
            model: "nano-banana-pro",
          },
        }),
      }),
    );
    assert.equal(result.status, 503);
    assert.match(((await result.json()) as { error: string }).error, /CONFIGURACAO\.md/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = savedFetch;
    for (const name of ["AI_PROVIDER", "AI_API_KEY", "HF_TOKEN"] as const) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
});

it("checks browser origin against the requested host when Next normalizes its internal URL", () => {
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3000/api/status", {
        headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      new Request("https://example.com/api/status", {
        headers: { host: "example.com", origin: "https://other.example.com" },
      }),
    ),
    false,
  );
  assert.equal(
    isSameOrigin(
      new Request("https://example.com/api/status", {
        headers: { host: "example.com", origin: "null" },
      }),
    ),
    false,
  );
  assert.equal(isSameOrigin(new Request("https://example.com/api/status")), false);
});
