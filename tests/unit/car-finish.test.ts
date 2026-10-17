import { describe, expect, it } from "vitest";
import {
  CAR_COVERAGE_OPTIONS,
  carPaintParams,
  filmFinishMaterial,
  presetFinishMaterial,
  resolveCoverageZone,
} from "@/lib/car-finish";
import {
  CAR_MODELS,
  DEFAULT_CAR_MODEL_ID,
  findCarModel,
} from "@/lib/car-models";

describe("car finish presets", () => {
  it("orders gloss, satin and matte by increasing roughness", () => {
    const gloss = presetFinishMaterial("gloss");
    const satin = presetFinishMaterial("satin");
    const matte = presetFinishMaterial("matte");

    expect(gloss.roughness).toBeLessThan(satin.roughness);
    expect(satin.roughness).toBeLessThan(matte.roughness);
    expect(gloss.clearcoat).toBe(1);
    expect(matte.clearcoat).toBeLessThan(satin.clearcoat);
  });

  it("keeps the catalogue GU when no finish override is selected", () => {
    const glossy = carPaintParams("film", 95, 0);
    const matte = carPaintParams(undefined, 15, 0);

    expect(glossy.roughness).toBeLessThan(matte.roughness);
    expect(glossy.clearcoat).toBe(1);
  });

  it("explicit finish overrides the catalogue GU", () => {
    const overridden = carPaintParams("matte", 95, 0);
    const catalogue = filmFinishMaterial(95, 0);

    expect(overridden.roughness).toBeGreaterThan(catalogue.roughness);
  });

  it("reduces roughness and increases reflections for metallic films", () => {
    const flat = presetFinishMaterial("satin", 0);
    const metallic = presetFinishMaterial("satin", 0.8);

    expect(metallic.roughness).toBeLessThan(flat.roughness);
    expect(metallic.envMapIntensity).toBeGreaterThan(flat.envMapIntensity);
  });
});

describe("car coverage zones", () => {
  const bounds = {
    min: { x: -1, y: 0, z: -2 },
    max: { x: 1, y: 1.4, z: 2 },
  };

  it("keeps the full car for integral coverage", () => {
    expect(resolveCoverageZone("full", bounds)).toBeNull();
  });

  it("limits front coverage to the front of the car", () => {
    const zone = resolveCoverageZone("front", bounds);

    expect(zone).not.toBeNull();
    expect(zone!.minZ).toBeCloseTo(0.6);
    expect(zone!.maxZ).toBeCloseTo(2);
    expect(zone!.minNormalY).toBe(-1);
  });

  it("targets the hood and roof on upward-facing panels", () => {
    const hood = resolveCoverageZone("hood", bounds)!;
    const roof = resolveCoverageZone("roof", bounds)!;

    expect(hood.minZ).toBeCloseTo(0.72);
    expect(hood.maxZ).toBeCloseTo(1.88);
    expect(hood.minY).toBeCloseTo(0.77);
    expect(hood.minNormalY).toBe(0.25);
    expect(roof.minZ).toBeLessThan(hood.minZ);
    expect(roof.minY).toBeCloseTo(0.91);
    expect(roof.minNormalY).toBe(0.2);
  });

  it("limits rear coverage to the back of the car", () => {
    const zone = resolveCoverageZone("rear", bounds)!;

    expect(zone.minZ).toBeCloseTo(-2);
    expect(zone.maxZ).toBeCloseTo(-0.6);
  });

  it("offers each coverage choice once", () => {
    expect(CAR_COVERAGE_OPTIONS.map((option) => option.id)).toEqual([
      "full",
      "front",
      "hood",
      "roof",
      "rear",
    ]);
  });
});

describe("car model registry", () => {
  it("uses the BMW M4 as the default model", () => {
    expect(findCarModel(DEFAULT_CAR_MODEL_ID).label).toBe("BMW M4 Competition");
  });

  it("keeps the BMW GLB organized and attributed", () => {
    const bmw = findCarModel("bmw-m4-competition");

    expect(bmw.brand).toBe("BMW");
    expect(bmw.url).toBe(
      "/models/cars/bmw-m4-competition/bmw-m4-competition.web.glb"
    );
    expect(bmw.paintBy).toBe("material");
    expect(bmw.paint.body).toEqual([
      "Meshesbody151Mtl",
      "Mesheslivery1Mtl",
      "Mesheswhite41Mtl",
      "Mesheszx1Mtl",
    ]);
    expect(bmw.preserveMaterials).toBe(true);
    expect(bmw.supportsPartialWrap).toBe(true);
    expect(bmw.credit?.license).toBe("CC BY 4.0");
    expect(bmw.credit?.sourceUrl).toContain("sketchfab.com");
  });

  it("keeps model ids unique and every model branded", () => {
    const ids = CAR_MODELS.map((model) => model.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(CAR_MODELS.every((model) => model.brand.length > 0)).toBe(true);
  });
});
