import { describe, expect, it } from "vitest";

import {
  BODY_PANEL_DEFS,
  PART_COLOR_PRESETS,
  classifyPart,
  collectCarParts,
  humanizeMaterialName,
  panelAtPoint,
  partSwatchColor,
  resolvePanelZone,
} from "@/lib/car-parts";
import { findCarModel } from "@/lib/car-models";

const bmw = findCarModel("bmw-m4-competition");
const porsche = findCarModel("porsche-carrera-gt");
const ferrari = findCarModel("desportivo");

describe("car part classification", () => {
  it("classifies body materials from the model registry", () => {
    expect(classifyPart("Object_19", "Meshesbody151Mtl", bmw).id).toBe("paint");
    expect(classifyPart("body", "", ferrari).id).toBe("paint");
    expect(classifyPart("body:Body7a", "C1_Paint", porsche).id).toBe("paint");
  });

  it("recognises glass, wheels, calipers, lights and chrome", () => {
    expect(classifyPart("Object_21", "Mesheswindows1Mtl", bmw).id).toBe("glass");
    expect(classifyPart("Object_27", "Caliper1Mtl", bmw).id).toBe("calipers");
    expect(classifyPart("Object_28", "Meshesm8rim1Mtl", bmw).id).toBe("wheels");
    expect(classifyPart("Object_9", "Meshesheadlight51Mtl", bmw).id).toBe(
      "lights"
    );
    expect(classifyPart("Object_12", "Mesheschrome51Mtl", bmw).id).toBe(
      "chrome"
    );
    expect(classifyPart("Object_23", "Meshesled111Mtl", bmw).id).toBe(
      "lights"
    );
    expect(classifyPart("Object_7", "Meshespillars1Mtl", bmw).id).toBe(
      "pillars"
    );
  });

  it("classifies interiors, carbon and unknown materials", () => {
    expect(classifyPart("Seat", "Leather_red", bmw).id).toBe("interior");
    expect(classifyPart("Splitter", "Carbon_Fiber", bmw).id).toBe("carbon");

    const unknown = classifyPart("Object_x", "FooBarBaz", bmw);
    expect(unknown.kind).toBe("material");
    expect(unknown.id).toMatch(/^material:/);
  });

  it("humanises raw material names", () => {
    expect(humanizeMaterialName("Meshesbody151Mtl")).toBe("Meshesbody151");
    expect(humanizeMaterialName("rrghost_paint")).toBe("Rrghost paint");
    expect(humanizeMaterialName("")).toBe("Material");
  });

  it("prefers strong mesh names over generic metal materials", () => {
    expect(classifyPart("wheel", "metal_gray", ferrari).id).toBe("wheels");
    expect(classifyPart("trim", "metal_gray", ferrari).id).toBe("trim");
  });
});

describe("car part collection", () => {
  it("collects each part once and appends the six body panels", () => {
    const meshes = [
      {
        isMesh: true,
        visible: true,
        name: "body",
        material: { name: "C1_Paint" },
      },
      {
        isMesh: true,
        visible: true,
        name: "glass",
        material: { name: "Glass" },
      },
      {
        isMesh: true,
        visible: true,
        name: "rim",
        material: { name: "metal_gray" },
      },
      {
        isMesh: true,
        visible: false,
        name: "hidden",
        material: { name: "C1_Paint" },
      },
    ];
    const root = {
      traverse(callback: (object: unknown) => void) {
        for (const mesh of meshes) callback(mesh);
      },
    };

    const ids = collectCarParts(root, porsche).map((part) => part.id);

    expect(ids.filter((id) => id === "paint")).toHaveLength(1);
    expect(ids).toEqual(expect.arrayContaining(["glass", "wheels"]));
    expect(ids.filter((id) => id.startsWith("panel:"))).toHaveLength(6);
  });
});

describe("body panel zones", () => {
  const bounds = {
    min: { x: -1, y: 0, z: -2 },
    max: { x: 1, y: 1.4, z: 2 },
  };

  it("resolves a panel inside the car bounds", () => {
    const zone = resolvePanelZone("panel:hood", bounds);

    expect(zone).not.toBeNull();
    expect(zone!.minZ).toBeGreaterThan(bounds.min.z);
    expect(zone!.maxZ).toBeLessThanOrEqual(bounds.max.z);
    expect(zone!.minY).toBeGreaterThan(bounds.min.y);
    expect(zone!.minNormalY).toBeGreaterThanOrEqual(0);
  });

  it("maps front-upper clicks to the hood and rear clicks to the rear", () => {
    expect(panelAtPoint({ x: 0, y: 0.95, z: 0.9 }, bounds)).toBe(
      "panel:hood"
    );
    expect(panelAtPoint({ x: 0, y: 0.6, z: -1.6 }, bounds)).toBe("panel:rear");
  });

  it("maps side clicks to the matching lateral panel", () => {
    expect(panelAtPoint({ x: -0.9, y: 0.6, z: 0 }, bounds)).toBe("panel:left");
    expect(panelAtPoint({ x: 0.9, y: 0.6, z: 0 }, bounds)).toBe("panel:right");
  });

  it("exposes six unique panels and colour presets", () => {
    expect(new Set(BODY_PANEL_DEFS.map((panel) => panel.id)).size).toBe(6);
    expect(new Set(PART_COLOR_PRESETS.map((preset) => preset.id)).size).toBe(
      PART_COLOR_PRESETS.length
    );
    expect(PART_COLOR_PRESETS.some((preset) => preset.color === null)).toBe(
      true
    );
  });

  it("keeps the film colour for paint and null for untouched parts", () => {
    const paint = {
      id: "paint",
      label: "Carroçaria",
      category: "paint" as const,
      kind: "paint" as const,
    };
    const glass = {
      id: "glass",
      label: "Vidros",
      category: "glass" as const,
      kind: "material" as const,
    };

    expect(partSwatchColor(paint, {}, "#112233")).toBe("#112233");
    expect(partSwatchColor(glass, {}, "#112233")).toBeNull();
    expect(partSwatchColor(glass, { glass: "#445566" }, "#112233")).toBe(
      "#445566"
    );
  });
});
