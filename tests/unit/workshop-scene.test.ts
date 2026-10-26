import { describe, expect, it } from "vitest";

import {
  WORKSHOP_SCENE,
  shouldShowWorkshopCeiling,
  shouldShowWorkshopWall,
} from "@/lib/workshop-scene";

describe("workshop scene occlusion", () => {
  it("keeps the wall visible from the front and hides it behind the camera threshold", () => {
    expect(shouldShowWorkshopWall(WORKSHOP_SCENE.wallHideBelowZ)).toBe(true);
    expect(shouldShowWorkshopWall(0)).toBe(true);
    expect(shouldShowWorkshopWall(-6.6)).toBe(false);
    expect(shouldShowWorkshopWall(WORKSHOP_SCENE.wallHideBelowZ - 0.01)).toBe(
      false
    );
  });

  it("keeps the ceiling visible from normal cameras and hides it for the top view", () => {
    expect(shouldShowWorkshopCeiling(1.7)).toBe(true);
    expect(shouldShowWorkshopCeiling(WORKSHOP_SCENE.ceilingHideAboveY)).toBe(
      true
    );
    expect(shouldShowWorkshopCeiling(7.4)).toBe(false);
    expect(shouldShowWorkshopCeiling(WORKSHOP_SCENE.ceilingHideAboveY + 0.01)).toBe(
      false
    );
  });

  it("places the wall behind the rear hide threshold and keeps the floor below the car", () => {
    expect(WORKSHOP_SCENE.wallZ).toBeLessThan(WORKSHOP_SCENE.wallHideBelowZ);
    expect(WORKSHOP_SCENE.floorY).toBeLessThan(0);
    expect(WORKSHOP_SCENE.neonZ).toBeGreaterThan(WORKSHOP_SCENE.wallZ);
    expect(WORKSHOP_SCENE.neonMarkY).toBeGreaterThan(WORKSHOP_SCENE.neonTextY);
    expect(new Set(WORKSHOP_SCENE.ceilingRowsX).size).toBe(
      WORKSHOP_SCENE.ceilingRowsX.length
    );
  });
});
