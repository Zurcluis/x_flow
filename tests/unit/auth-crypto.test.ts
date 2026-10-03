import { describe, it, expect } from "vitest";
import { scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  hashPassword,
  verifyPassword,
  DEMO_PASSWORD,
} from "../../scripts/auth-crypto.mjs";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number }
) => Promise<Buffer>;

interface ParsedPasswordHash {
  N: number;
  r: number;
  p: number;
  saltHex: string;
  hashHex: string;
}

function parsePasswordHash(stored: string): ParsedPasswordHash | null {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [, n, r, p, saltHex, hashHex] = parts;
  const N = Number(n);
  const rr = Number(r);
  const pp = Number(p);
  if (!Number.isInteger(N) || !Number.isInteger(rr) || !Number.isInteger(pp)) return null;
  if (!saltHex || !/^[0-9a-f]+$/i.test(saltHex)) return null;
  if (!hashHex || !/^[0-9a-f]+$/i.test(hashHex)) return null;
  return { N, r: rr, p: pp, saltHex, hashHex };
}

describe("auth-crypto password hashing", () => {
  it("round-trips a password through hashPassword/verifyPassword", async () => {
    const stored = await hashPassword("S3nh@Secr3ta!");
    expect(await verifyPassword("S3nh@Secr3ta!", stored)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("password-certa");
    expect(await verifyPassword("password-errada", stored)).toBe(false);
  });

  it("produces the scrypt:N:r:p:salt:hash format with expected parameters", async () => {
    const stored = await hashPassword("formato");
    const parsed = parsePasswordHash(stored);
    expect(parsed).not.toBeNull();
    expect(parsed!.N).toBe(16384);
    expect(parsed!.r).toBe(8);
    expect(parsed!.p).toBe(1);
    expect(parsed!.saltHex).toHaveLength(32);
    expect(parsed!.hashHex).toHaveLength(128);
    expect(stored.startsWith(`scrypt:16384:8:1:${parsed!.saltHex}:`)).toBe(true);
  });

  it("stored hash re-derives the same scrypt digest from salt and params", async () => {
    const stored = await hashPassword("derivação");
    const parsed = parsePasswordHash(stored);
    expect(parsed).not.toBeNull();
    const derived = await scrypt(
      "derivação".normalize("NFKC"),
      Buffer.from(parsed!.saltHex, "hex"),
      parsed!.hashHex.length / 2,
      { N: parsed!.N, r: parsed!.r, p: parsed!.p }
    );
    const expected = Buffer.from(parsed!.hashHex, "hex");
    expect(derived.length).toBe(expected.length);
    expect(timingSafeEqual(derived, expected)).toBe(true);
  });

  it("verifies DEMO_PASSWORD against a freshly generated hash", async () => {
    const stored = await hashPassword(DEMO_PASSWORD);
    expect(await verifyPassword(DEMO_PASSWORD, stored)).toBe(true);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("qualquer", "not-a-hash")).toBe(false);
    expect(await verifyPassword("qualquer", "scrypt:x:y:1:zz:zz")).toBe(false);
  });

  it("normalizes NFKC before hashing", async () => {
    const a = await hashPassword("café");
    const composed = "cafe\u0301";
    expect(await verifyPassword(composed, a)).toBe(true);
  });
});
