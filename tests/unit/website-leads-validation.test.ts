import { describe, expect, it } from "vitest";

import {
  isValidIdempotencyKey,
  validateWebsiteLeadPayload,
} from "@/domains/proposals/validation";

const validPayload = {
  service: "PPF",
  vehicle: "BMW M3 2022",
  name: "Ana Silva",
  email: "ana@example.pt",
  phone: "+351912345678",
  message: "Pretendo PPF frontal.",
  consent: true,
};

describe("website lead validation", () => {
  it("accepts the site labels and normalizes them to internal codes", () => {
    const result = validateWebsiteLeadPayload(validPayload);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.service).toBe("ppf");
    expect(result.data.vehicle).toBe("BMW M3 2022");
    expect(result.data.phone).toBe("+351912345678");
  });

  it("accepts internal service codes for future clients", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      service: "color_ppf",
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.service).toBe("color_ppf");
  });

  it("trims text and omits empty optional fields", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      vehicle: "  Porsche 911  ",
      phone: "   ",
      message: "  ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.vehicle).toBe("Porsche 911");
    expect(result.data.phone).toBeUndefined();
    expect(result.data.message).toBeUndefined();
  });

  it("rejects a request without consent", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      consent: false,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.consent).toMatch(/autorizar/);
  });

  it("rejects a filled honeypot", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      website: "https://spam.example",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.website).toBeDefined();
  });

  it("rejects invalid emails and oversized fields", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      email: "ana@",
      vehicle: "x".repeat(161),
      message: "x".repeat(2001),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.email).toBeDefined();
      expect(result.errors.vehicle).toBeDefined();
      expect(result.errors.message).toBeDefined();
    }
  });

  it("rejects an unknown service", () => {
    const result = validateWebsiteLeadPayload({
      ...validPayload,
      service: "Outro serviço",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.service).toBeDefined();
  });
});

describe("website lead idempotency keys", () => {
  it("accepts UUIDs and the browser fallback format", () => {
    expect(isValidIdempotencyKey("4f84f5c0-1f3d-4ab3-9204-7cf2d0f57b4d")).toBe(true);
    expect(isValidIdempotencyKey("1761400000000-k3j5h2g1")).toBe(true);
  });

  it("rejects empty, oversized or unsafe keys", () => {
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("x".repeat(101))).toBe(false);
    expect(isValidIdempotencyKey("chave com espaços")).toBe(false);
    expect(isValidIdempotencyKey("chave\nquebrada")).toBe(false);
  });
});
