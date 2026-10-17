import { describe, expect, it } from "vitest";
import {
  carPaintParams,
  filmFinishMaterial,
  presetFinishMaterial,
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
    expect(bmw.credit?.license).toBe("CC BY 4.0");
    expect(bmw.credit?.sourceUrl).toContain("sketchfab.com");
  });

  it("keeps model ids unique and every model branded", () => {
    const ids = CAR_MODELS.map((model) => model.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(CAR_MODELS.every((model) => model.brand.length > 0)).toBe(true);
  });
});
