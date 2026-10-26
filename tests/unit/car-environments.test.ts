import { describe, expect, it } from "vitest";

import {
  CAR_ENVIRONMENTS,
  DEFAULT_ENVIRONMENT_ID,
  ENVIRONMENT_IDS,
  availableEnvironments,
  findEnvironment,
} from "@/lib/car-environments";

describe("car environments presets", () => {
  it("exposes four unique environments in the planned order", () => {
    expect(CAR_ENVIRONMENTS.map((environment) => environment.id)).toEqual([
      "dark-studio",
      "xmotion-workshop",
      "outdoor-sun",
      "golden-hour",
    ]);
    expect(new Set(ENVIRONMENT_IDS).size).toBe(ENVIRONMENT_IDS.length);
  });

  it("keeps dark-studio as the default available preset", () => {
    const environment = findEnvironment(DEFAULT_ENVIRONMENT_ID);

    expect(environment.id).toBe("dark-studio");
    expect(environment.availability).toBe("available");
    expect(environment.background).toBeNull();
    expect(environment.exposure).toBe(1);
    expect(environment.quality).toMatchObject({
      environmentResolution: 256,
      dprMax: 2,
      shadows: false,
    });
    expect(environment.contactShadows).toMatchObject({
      enabled: true,
      opacity: 0.55,
      scale: 16,
      blur: 2.4,
      far: 2.4,
      resolution: 512,
      positionY: 0,
    });
  });

  it("makes the X-Motion workshop available without changing the default", () => {
    const workshop = findEnvironment("xmotion-workshop");

    expect(DEFAULT_ENVIRONMENT_ID).toBe("dark-studio");
    expect(workshop.availability).toBe("available");
    expect(workshop.background).toBe("#0b0d0e");
    expect(workshop.captureBackground).toBe("#0b0d0e");
    expect(workshop.exposure).toBeGreaterThan(0);
    expect(workshop.contactShadows.enabled).toBe(true);
    expect(workshop.quality).toMatchObject({
      environmentResolution: 256,
      dprMax: 1.75,
      shadows: false,
    });
  });

  it("marks the remaining scenarios as planned until their phases land", () => {
    expect(availableEnvironments().map((environment) => environment.id)).toEqual([
      "dark-studio",
      "xmotion-workshop",
    ]);
    expect(
      CAR_ENVIRONMENTS.filter(
        (environment) => environment.availability === "planned"
      ).map((environment) => environment.id)
    ).toEqual(["outdoor-sun", "golden-hour"]);
  });

  it("provides an opaque capture background for every scenario", () => {
    for (const environment of CAR_ENVIRONMENTS) {
      expect(environment.captureBackground).toMatch(/^#[0-9a-f]{6}$/i);
      if (environment.background) {
        expect(environment.background).toMatch(/^#[0-9a-f]{6}$/i);
      }
      expect(environment.exposure).toBeGreaterThan(0);
      expect(environment.quality.environmentResolution).toBeGreaterThan(0);
      expect(environment.quality.dprMax).toBeGreaterThanOrEqual(1);
    }
  });

  it("falls back to the default preset for an unknown id", () => {
    expect(findEnvironment("unknown").id).toBe(DEFAULT_ENVIRONMENT_ID);
  });
});
