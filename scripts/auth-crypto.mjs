import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;
const SALT_BYTES = 16;

const scrypt = promisify(scryptCb);

export const DEMO_PASSWORD = "xflow-demo-2026";

export function parsePasswordHash(stored) {
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

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const parsed = parsePasswordHash(stored);
  if (!parsed) return false;
  try {
    const hash = await scrypt(
      password.normalize("NFKC"),
      Buffer.from(parsed.saltHex, "hex"),
      parsed.hashHex.length / 2,
      { N: parsed.N, r: parsed.r, p: parsed.p }
    );
    const expected = Buffer.from(parsed.hashHex, "hex");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}
