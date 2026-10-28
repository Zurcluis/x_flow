"use client";

import React from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";

import type { CarEnvironment } from "@/lib/car-environments";
import { StudioDarkEnv } from "./StudioDarkEnv";
import { XMotionWorkshopEnv } from "./XMotionWorkshopEnv";
import { OutdoorSunEnv } from "./OutdoorSunEnv";
import { GoldenHourEnv } from "./GoldenHourEnv";

type SceneBackground = THREE.Scene["background"];

function applyEnvironmentWorld(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  environment: CarEnvironment
) {
  gl.toneMappingExposure = environment.exposure;
  scene.background = environment.background
    ? new THREE.Color(environment.background)
    : null;
}

function restoreEnvironmentWorld(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  exposure: number,
  background: SceneBackground
) {
  gl.toneMappingExposure = exposure;
  scene.background = background;
}

function EnvironmentWorld({ environment }: { environment: CarEnvironment }) {
  const { gl, scene } = useThree();

  React.useEffect(() => {
    const previousExposure = gl.toneMappingExposure;
    const previousBackground = scene.background;
    applyEnvironmentWorld(gl, scene, environment);
    return () => {
      restoreEnvironmentWorld(gl, scene, previousExposure, previousBackground);
    };
  }, [gl, scene, environment]);

  return null;
}

export function EnvironmentStage({
  environment,
}: {
  environment: CarEnvironment;
}) {
  return (
    <>
      <EnvironmentWorld environment={environment} />

      {environment.contactShadows.enabled ? (
        <ContactShadows
          position={[0, environment.contactShadows.positionY, 0]}
          opacity={environment.contactShadows.opacity}
          scale={environment.contactShadows.scale}
          blur={environment.contactShadows.blur}
          far={environment.contactShadows.far}
          resolution={environment.contactShadows.resolution}
          color={environment.contactShadows.color}
        />
      ) : null}

      {environment.id === "dark-studio" ? (
        <StudioDarkEnv
          resolution={environment.quality.environmentResolution}
        />
      ) : null}

      {environment.id === "xmotion-workshop" ? (
        <XMotionWorkshopEnv
          resolution={environment.quality.environmentResolution}
        />
      ) : null}

      {environment.id === "outdoor-sun" ? (
        <OutdoorSunEnv
          resolution={environment.quality.environmentResolution}
          shadowMapSize={environment.quality.shadowMapSize}
        />
      ) : null}

      {environment.id === "golden-hour" ? (
        <GoldenHourEnv
          resolution={environment.quality.environmentResolution}
          shadowMapSize={environment.quality.shadowMapSize}
        />
      ) : null}
    </>
  );
}
