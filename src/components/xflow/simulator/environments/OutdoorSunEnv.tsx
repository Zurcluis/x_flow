"use client";

import { OUTDOOR_SCENE } from "@/lib/outdoor-scene";
import { OutdoorEnv } from "./OutdoorEnv";

export function OutdoorSunEnv({
  resolution,
  shadowMapSize,
}: {
  resolution: number;
  shadowMapSize: number;
}) {
  return (
    <OutdoorEnv
      config={OUTDOOR_SCENE["outdoor-sun"]}
      resolution={resolution}
      shadowMapSize={shadowMapSize}
    />
  );
}
