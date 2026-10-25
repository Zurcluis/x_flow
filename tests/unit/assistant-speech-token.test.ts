import { describe, expect, it } from "vitest";
import {
  signSpeechToken,
  verifySpeechToken,
} from "@/server/ai/speech-token";

const SECRET = "session-token-value";
const PROFILE = "profile-1";

describe("speech token", () => {
  it("signs and verifies an answer for the same profile", () => {
    const token = signSpeechToken("Bom dia, Luís.", PROFILE, SECRET, 60_000, 1000);

    expect(verifySpeechToken(token, PROFILE, SECRET, 2000)).toBe("Bom dia, Luís.");
  });

  it("rejects a different session secret", () => {
    const token = signSpeechToken("Bom dia.", PROFILE, SECRET, 60_000, 1000);

    expect(verifySpeechToken(token, PROFILE, "other-secret", 2000)).toBeNull();
  });

  it("rejects a token issued for another profile", () => {
    const token = signSpeechToken("Bom dia.", PROFILE, SECRET, 60_000, 1000);

    expect(verifySpeechToken(token, "profile-2", SECRET, 2000)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = signSpeechToken("Bom dia.", PROFILE, SECRET, 1000, 1000);

    expect(verifySpeechToken(token, PROFILE, SECRET, 3000)).toBeNull();
  });

  it("rejects tampered payloads", () => {
    const token = signSpeechToken("Bom dia.", PROFILE, SECRET, 60_000, 1000);
    const [payload, signature] = token.split(".");
    const tampered = `${payload.slice(0, -1)}A.${signature}`;

    expect(verifySpeechToken(tampered, PROFILE, SECRET, 2000)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(verifySpeechToken("", PROFILE, SECRET, 2000)).toBeNull();
    expect(verifySpeechToken("only-one-part", PROFILE, SECRET, 2000)).toBeNull();
    expect(verifySpeechToken("a.b.c", PROFILE, SECRET, 2000)).toBeNull();
  });
});
