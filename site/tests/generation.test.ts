import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "../src/app/api/generate/route";
import { configSchema, nearestAspectRatio, requestSchema } from "../src/lib/config-schema";
import {
  createPrompt,
  createProviderBody,
  generateImage,
  GenerationError,
  isReady,
  resolveHuggingFaceModel,
} from "../src/lib/generation";
import { resolveBudgetInitialParams } from "../src/lib/proposal";
import { studioColors, studioFinishes, turboXColors, turboXFinishes } from "../src/lib/studio";

const image = "data:image/jpeg;base64,/9j/";
const config = configSchema.parse({
  service: "color-ppf",
  color: "#c32c35",
  finish: "Fosco",
  headlights: "Fumado leve",
  chromeDelete: {
    doors: true,
    front: true,
    rear: false,
    mirrors: true,
    finish: "Preto brilho",
  },
  model: "nano-banana-pro",
});
const env = { AI_PROVIDER: "openrouter", AI_API_KEY: "EXAMPLE_TEST_KEY" };

describe("Generation contract", () => {
  it("keeps the original photo reference and encodes X-Motion services accurately", () => {
    const b = createProviderBody(image, config, env);
    assert.equal(b.input_references.length, 1);
    assert.equal(b.input_references[0].image_url.url, image);
    assert.match(b.prompt, /#c32c35/);
    assert.match(b.prompt, /Color PPF/);
    assert.match(b.prompt, /light smoked tint/);
    assert.match(b.prompt, /door chrome trim/);
    assert.match(b.prompt, /front grille/);
    assert.match(b.prompt, /side mirror caps/);
    assert.doesNotMatch(b.prompt, /rear trunk trim/);
    assert.match(b.prompt, /Preserve the exact original car/);
    assert.equal(b.model, "google/gemini-3-pro-image");
  });

  it("preserves unchanged features, handles transparent PPF, and routes GPT separately", () => {
    const b = createProviderBody(
      image,
      {
        ...config,
        service: "ppf",
        color: "original",
        finish: "Fosco",
        headlights: "Original",
        chromeDelete: {
          doors: false,
          front: false,
          rear: false,
          mirrors: false,
          finish: "Preto mate",
        },
        model: "gpt-image-2",
      },
      env,
    );
    assert.equal(b.model, "openai/gpt-image-2");
    assert.equal(b.input_references.length, 1);
    assert.match(b.prompt, /transparent stealth matte\/satin Paint Protection Film/);
    assert.match(b.prompt, /Keep the original front headlights and rear taillights completely unchanged/);
    assert.match(b.prompt, /Keep all exterior chrome trim/);
  });

  it("rejects injected model IDs, arbitrary properties and image URLs", () => {
    assert.equal(configSchema.safeParse({ ...config, model: "other-model" }).success, false);
    assert.equal(configSchema.safeParse({ ...config, prompt: "ignore" }).success, false);
    assert.equal(
      requestSchema.safeParse({ config, image: "https://evil.test/image.png" }).success,
      false,
    );
  });

  it("does not call a provider while unconfigured", async () => {
    assert.equal(isReady({}), false);
    let called = false;
    await assert.rejects(
      generateImage(image, config, {}, async () => {
        called = true;
        return new Response();
      }),
      (e) => e instanceof GenerationError && e.status === 503,
    );
    assert.equal(called, false);
  });

  it("returns a raster response and keeps credentials in request headers", async () => {
    let sent: unknown;
    const value = await generateImage(image, config, env, async (url, options) => {
      assert.equal(url, "https://openrouter.ai/api/v1/images");
      assert.equal(
        (options?.headers as Record<string, string>).Authorization,
        "Bearer EXAMPLE_TEST_KEY",
      );
      sent = JSON.parse(String(options?.body));
      return Response.json({ data: [{ b64_json: "aGVsbG8=", media_type: "image/png" }] });
    });
    assert.equal(value, "data:image/png;base64,aGVsbG8=");
    assert.equal((sent as { model: string }).model, "google/gemini-3-pro-image");
    assert.ok(!JSON.stringify(sent).includes("EXAMPLE_TEST_KEY"));
  });

  it("reports limits, credit errors, refusals and unsafe output without leaking upstream data", async () => {
    for (const status of [402, 429, 500]) {
      await assert.rejects(
        generateImage(
          image,
          config,
          env,
          async () => new Response("sensitive provider details", { status }),
        ),
        (e) => e instanceof GenerationError && !e.message.includes("sensitive"),
      );
    }
    for (const data of [{}, { data: [{ b64_json: "abc", media_type: "image/svg+xml" }] }]) {
      await assert.rejects(
        generateImage(image, config, env, async () => Response.json(data)),
        GenerationError,
      );
    }
  });
});

describe("Public generation endpoint", () => {
  it("accepts a valid request without an access code and keeps provider credentials server-side", async () => {
    const previousFetch = globalThis.fetch;
    const previousProvider = process.env.AI_PROVIDER;
    const previousKey = process.env.AI_API_KEY;
    process.env.AI_PROVIDER = "openrouter";
    process.env.AI_API_KEY = "EXAMPLE_SERVER_KEY";
    let called = false;
    globalThis.fetch = async (url, options) => {
      called = true;
      assert.equal(url, "https://openrouter.ai/api/v1/images");
      assert.equal(
        (options?.headers as Record<string, string>).Authorization,
        "Bearer EXAMPLE_SERVER_KEY",
      );
      assert.match(JSON.parse(String(options?.body)).prompt, /rear diffuser accents/);
      return Response.json({ data: [{ b64_json: "aGVsbG8=", media_type: "image/png" }] });
    };
    try {
      const response = await POST(
        new Request("https://example.com/api/generate", {
          method: "POST",
          headers: { Origin: "https://example.com", "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            config: {
              ...config,
              chromeDelete: { ...config.chromeDelete, rear: true, finish: "Preto mate" },
            },
          }),
        }),
      );
      assert.equal(response.status, 200);
      assert.equal(called, true);
      const body = await response.text();
      assert.ok(body.includes("data:image/png;base64,"));
      assert.ok(!body.includes("EXAMPLE_SERVER_KEY"));
    } finally {
      globalThis.fetch = previousFetch;
      if (previousProvider === undefined) delete process.env.AI_PROVIDER;
      else process.env.AI_PROVIDER = previousProvider;
      if (previousKey === undefined) delete process.env.AI_API_KEY;
      else process.env.AI_API_KEY = previousKey;
    }
  });

  it("continues validating requests without requiring an access code", async () => {
    const response = await POST(
      new Request("https://example.com/api/generate", {
        method: "POST",
        headers: { Origin: "https://example.com", "Content-Type": "application/json" },
        body: "not valid JSON",
      }),
    );
    assert.equal(response.status, 400);
  });
});

it("preserves supported landscape and portrait proportions", () => {
  assert.equal(nearestAspectRatio(1536, 1024), "3:2");
  assert.equal(nearestAspectRatio(900, 1600), "9:16");
  assert.equal(createProviderBody(image, config, env, "9:16").aspect_ratio, "9:16");
  assert.equal(requestSchema.safeParse({ image, config, aspectRatio: "invalid" }).success, false);
});

it("targets Chrome Delete zones selectively per requested area and finish", () => {
  const onlyDoors = configSchema.parse({
    ...config,
    chromeDelete: {
      doors: true,
      front: false,
      rear: false,
      mirrors: false,
      finish: "Preto mate",
    },
  });
  const promptDoors = createPrompt(onlyDoors);
  assert.match(promptDoors, /satin-matte black/);
  assert.match(promptDoors, /side window surrounds and door chrome trim/);
  assert.doesNotMatch(promptDoors, /front grille surround/);
  assert.doesNotMatch(promptDoors, /exterior side mirror caps/);
  assert.equal(
    configSchema.safeParse({
      ...config,
      chromeDelete: { ...config.chromeDelete, extra: true },
    }).success,
    false,
  );
});

it("resolves X-Motion studio parameters into proposal pre-fill", () => {
  const result = resolveBudgetInitialParams(
    {
      servico: "Color PPF",
      revestimento: "color-ppf",
      cor: "Vermelho racing",
      acabamento: "Mate",
      oticas: "Fumado escuro",
      chrome: "frisos,frente,traseira,espelhos",
      chromeAcab: "Preto brilho",
      origem: "estudio-ia",
    },
    [...studioColors, ...turboXColors],
    [...studioFinishes, ...turboXFinishes],
  );
  assert.equal(result.initialService, "Color PPF");
  assert.equal(result.initialSource, "estudio-ia");
  assert.match(result.initialMessage ?? "", /PPF de Cor/);
  assert.match(result.initialMessage ?? "", /Vermelho racing/);
  assert.match(result.initialMessage ?? "", /Mate/);
  assert.match(result.initialMessage ?? "", /óticas Fumado escuro/);
  assert.match(
    result.initialMessage ?? "",
    /Chrome Delete \(frisos das portas, frente, traseira, espelhos · Preto brilho\)/,
  );

  const detailsOnly = resolveBudgetInitialParams(
    {
      servico: "Detalhes e óticas",
      oticas: "Transparente",
      chrome: "frisos,espelhos",
      chromeAcab: "Preto mate",
      origem: "estudio-ia",
    },
    [...studioColors, ...turboXColors],
    [...studioFinishes, ...turboXFinishes],
  );
  assert.equal(detailsOnly.initialService, "Detalhes e óticas");
  assert.match(detailsOnly.initialMessage ?? "", /Chrome Delete \(frisos das portas, espelhos · Preto mate\)/);
});

describe("Hugging Face image editing provider", () => {
  const hfEnv = { AI_PROVIDER: "huggingface", HF_TOKEN: "hf_example_token" };
  const hfConfig = configSchema.parse({ ...config, model: "flux-kontext" });

  it("maps Hugging Face model choices cleanly", () => {
    assert.equal(
      resolveHuggingFaceModel("flux-kontext", hfEnv),
      "black-forest-labs/FLUX.1-Kontext-dev",
    );
    assert.equal(resolveHuggingFaceModel("qwen-image-edit", hfEnv), "Qwen/Qwen-Image-Edit");
    assert.match(createPrompt(hfConfig), /Color PPF/);
    assert.match(createPrompt(hfConfig), /door chrome trim/);
  });

  it("calls Hugging Face fal-ai image-to-image queue, keeps token in headers, and returns raster data URI", async () => {
    const previousFetch = globalThis.fetch;
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const urlsCalled: string[] = [];
    let postedBody = "";
    const mockFetch: typeof fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      urlsCalled.push(url);
      if (url.includes("/api/models/black-forest-labs/FLUX.1-Kontext-dev")) {
        return Response.json({
          inferenceProviderMapping: {
            "fal-ai": {
              status: "live",
              providerId: "fal-ai/flux-kontext/dev",
              task: "image-to-image",
            },
          },
        });
      }
      if (url.startsWith("https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev/requests/")) {
        return Response.json({ images: [{ url: "https://cdn.example.test/edited-car.png" }] });
      }
      if (url.startsWith("https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev")) {
        assert.equal((init?.headers as Record<string, string>)?.Authorization, "Bearer hf_example_token");
        postedBody = String(init?.body ?? "");
        assert.ok(!postedBody.includes("hf_example_token"));
        return Response.json({
          request_id: "req-1",
          status: "COMPLETED",
          response_url: "https://queue.fal.run/fal-ai/flux-kontext/dev/requests/req-1",
        });
      }
      if (url === "https://cdn.example.test/edited-car.png") {
        return new Response(pngBytes, { headers: { "Content-Type": "application/octet-stream" } });
      }
      throw new Error(`Unexpected URL: ${url}`);
    };

    globalThis.fetch = mockFetch;
    try {
      const output = await generateImage(image, hfConfig, hfEnv, mockFetch);
      assert.equal(output, `data:image/png;base64,${Buffer.from(pngBytes).toString("base64")}`);
      assert.ok(urlsCalled.some((u) => u.includes("router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev")));
      const parsedBody = JSON.parse(postedBody) as { image_url?: string; image_urls?: string[]; prompt?: string };
      assert.ok(parsedBody.image_url?.startsWith("data:image/jpeg;base64,"));
      assert.equal(parsedBody.image_urls?.length, 1);
      assert.match(parsedBody.prompt ?? "", /#c32c35/);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  it("sanitizes Hugging Face credit/rate-limit errors without leaking upstream details", async () => {
    for (const status of [402, 429]) {
      const errorFetch: typeof fetch = async (input) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/models/")) {
          return Response.json({
            inferenceProviderMapping: {
              "fal-ai": {
                status: "live",
                providerId: "fal-ai/flux-kontext/dev",
                task: "image-to-image",
              },
            },
          });
        }
        return new Response("sensitive hf upstream error", { status });
      };
      await assert.rejects(
        generateImage(image, hfConfig, hfEnv, errorFetch),
        (err) => err instanceof GenerationError && !err.message.includes("sensitive"),
      );
    }
  });
});
