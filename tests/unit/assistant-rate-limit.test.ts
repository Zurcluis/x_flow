import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeAiRateLimit,
  resetAiRateLimits,
} from "@/server/ai/rate-limit";

describe("consumeAiRateLimit", () => {
  beforeEach(() => {
    resetAiRateLimits();
  });

  it("allows requests up to the limit and blocks the next one", () => {
    expect(consumeAiRateLimit("ask:1", 2, 60_000, 1000).ok).toBe(true);
    expect(consumeAiRateLimit("ask:1", 2, 60_000, 1001).ok).toBe(true);

    const blocked = consumeAiRateLimit("ask:1", 2, 60_000, 1002);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("keeps separate buckets per user", () => {
    expect(consumeAiRateLimit("ask:1", 1, 60_000, 1000).ok).toBe(true);
    expect(consumeAiRateLimit("ask:2", 1, 60_000, 1000).ok).toBe(true);
    expect(consumeAiRateLimit("ask:1", 1, 60_000, 1001).ok).toBe(false);
  });

  it("resets after the window", () => {
    expect(consumeAiRateLimit("ask:1", 1, 60_000, 1000).ok).toBe(true);
    expect(consumeAiRateLimit("ask:1", 1, 60_000, 61_001).ok).toBe(true);
  });
});
