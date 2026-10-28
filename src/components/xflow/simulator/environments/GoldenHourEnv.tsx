"use client";

import { OUTDOOR_SCENE } from "@/lib/outdoor-scene";
import { OutdoorEnv } from "./OutdoorEnv";

export function GoldenHourEnv({
  resolution,
  shadowMapSize,
}: {
  resolution: number;
  shadowMapSize: number;
}) {
  return (
    <OutdoorEnv
      config={OUTDOOR_SCENE["golden-hour"]}
      resolution={resolution}
      shadowMapSize={shadowMapSize}
    />
  );
}
