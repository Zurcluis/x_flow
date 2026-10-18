import { describe, expect, it } from "vitest";
import { CHECKLIST_TEMPLATES } from "@/domains/production/checklist-templates";
import type { PhaseKey } from "@/domains/production/types";

const PHASE_KEYS: PhaseKey[] = [
  "prep_decontamination",
  "disassembly",
  "film_cutting",
  "application",
  "assembly",
  "thermal_cure",
  "detailing_finish",
  "quality_control",
  "subcontracted",
];

describe("production checklist templates", () => {
  it("covers every phase key", () => {
    for (const key of PHASE_KEYS) {
      expect(CHECKLIST_TEMPLATES[key], key).toBeDefined();
      expect(CHECKLIST_TEMPLATES[key].length, key).toBeGreaterThan(0);
    }
  });

  it("has non-empty, unique labels within the 255 char limit", () => {
    for (const key of PHASE_KEYS) {
      const labels = CHECKLIST_TEMPLATES[key];
      expect(new Set(labels).size, key).toBe(labels.length);
      for (const label of labels) {
        expect(label.trim().length, `${key}: "${label}"`).toBeGreaterThan(0);
        expect(label.length, `${key}: "${label}"`).toBeLessThanOrEqual(255);
      }
    }
  });
});
