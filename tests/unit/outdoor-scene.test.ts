import { describe, expect, it } from "vitest";

import {
  COMPACT_VIEWPORT_WIDTH,
  GROUND_SIZE,
  OUTDOOR_SCENE,
  environmentResolutionForWidth,
  isCompactViewport,
  shadowMapSizeForWidth,
  sunDirection,
} from "@/lib/outdoor-scene";

describe("outdoor scene presets", () => {
  it("keeps the sun above the horizon and in front of the car", () => {
    for (const config of Object.values(OUTDOOR_SCENE)) {
      const direction = sunDirection(config);
      const length = Math.hypot(...direction);

      expect(length).toBeCloseTo(1, 6);
      expect(direction[1]).toBeGreaterThan(0);
      expect(direction[2]).toBeGreaterThan(0);
      expect(direction[0]).toBeGreaterThan(0);
    }
  });

  it("keeps the sun to the side so the 3/4 shadow stays visible", () => {
    for (const config of Object.values(OUTDOOR_SCENE)) {
      expect(config.sunAzimuthDeg).toBeGreaterThanOrEqual(70);
      expect(config.sunAzimuthDeg).toBeLessThanOrEqual(110);
    }
  });

  it("makes golden hour warmer and lower than daylight", () => {
    const daylight = OUTDOOR_SCENE["outdoor-sun"];
    const golden = OUTDOOR_SCENE["golden-hour"];

    expect(golden.sunElevationDeg).toBeLessThan(daylight.sunElevationDeg);
    expect(golden.sunElevationDeg).toBeLessThan(15);
    expect(golden.shadowBounds).toBeGreaterThan(daylight.shadowBounds);
    expect(golden.sunColor).not.toBe(daylight.sunColor);
  });

  it("backs off resolution and shadow maps on compact viewports", () => {
    expect(isCompactViewport(COMPACT_VIEWPORT_WIDTH)).toBe(false);
    expect(isCompactViewport(COMPACT_VIEWPORT_WIDTH - 1)).toBe(true);
    expect(shadowMapSizeForWidth(390, 1024)).toBe(512);
    expect(shadowMapSizeForWidth(390, 512)).toBe(512);
    expect(shadowMapSizeForWidth(1440, 1024)).toBe(1024);
    expect(environmentResolutionForWidth(390, 256)).toBe(128);
    expect(environmentResolutionForWidth(390, 128)).toBe(128);
    expect(environmentResolutionForWidth(1440, 256)).toBe(256);
  });

  it("uses opaque capture-friendly colors and a finite fog range", () => {
    for (const config of Object.values(OUTDOOR_SCENE)) {
      expect(config.groundColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.skyTop).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.skyHorizon).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.fogColor).toBe(config.skyHorizon);
      expect(config.fogNear).toBeGreaterThan(0);
      expect(config.fogFar).toBeGreaterThan(config.fogNear);
      expect(config.fogFar).toBeLessThanOrEqual(GROUND_SIZE / 2);
      expect(config.sunGlowSize).toBeGreaterThan(0);
      expect(config.shadowBounds).toBeGreaterThan(0);
    }
  });
});
