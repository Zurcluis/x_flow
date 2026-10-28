"use client";

import React from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

import {
  GROUND_SIZE,
  SKY_RADIUS,
  type OutdoorSceneConfig,
  environmentResolutionForWidth,
  shadowMapSizeForWidth,
  sunDirection,
} from "@/lib/outdoor-scene";
import { EnvironmentMapDisposer } from "./EnvironmentMapDisposer";

function drawSpeckles(
  ctx: CanvasRenderingContext2D,
  size: number,
  seed: number
) {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  for (let i = 0; i < 12000; i += 1) {
    const light = random() > 0.48;
    const alpha = 0.015 + random() * 0.045;
    ctx.fillStyle = light
      ? `rgba(255, 252, 244, ${alpha})`
      : `rgba(18, 20, 22, ${alpha})`;
    const dot = 0.7 + random() * 2;
    ctx.fillRect(random() * size, random() * size, dot, dot);
  }

  for (let i = 0; i < 9; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 34 + random() * 110;
    const patch = ctx.createRadialGradient(x, y, 0, x, y, radius);
    patch.addColorStop(0, "rgba(20, 22, 24, 0.1)");
    patch.addColorStop(1, "rgba(20, 22, 24, 0)");
    ctx.fillStyle = patch;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
}

function createSkyTexture(config: OutdoorSceneConfig): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!ctx) return texture;

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, config.skyTop);
  gradient.addColorStop(0.42, config.skyTop);
  gradient.addColorStop(0.5, config.skyHorizon);
  gradient.addColorStop(1, config.skyHorizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  texture.needsUpdate = true;
  return texture;
}

function createGroundTexture(config: OutdoorSceneConfig): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(config.groundRepeat, config.groundRepeat);

  if (!ctx) return texture;

  ctx.fillStyle = config.groundColor;
  ctx.fillRect(0, 0, size, size);
  drawSpeckles(ctx, size, config.id === "golden-hour" ? 20261027 : 20261026);

  texture.needsUpdate = true;
  return texture;
}

function createSunGlowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!ctx) return texture;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.12, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.32, "rgba(255, 255, 255, 0.35)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  texture.needsUpdate = true;
  return texture;
}

function applySceneFog(
  scene: THREE.Scene,
  config: OutdoorSceneConfig
): THREE.Scene["fog"] {
  const previous = scene.fog;
  scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar);
  return previous;
}

function restoreSceneFog(
  scene: THREE.Scene,
  fog: THREE.Scene["fog"]
) {
  scene.fog = fog;
}

export function OutdoorEnv({
  config,
  resolution,
  shadowMapSize,
}: {
  config: OutdoorSceneConfig;
  resolution: number;
  shadowMapSize: number;
}) {
  const { scene, size } = useThree();
  const sunLight = React.useRef<THREE.DirectionalLight | null>(null);
  const actualResolution = environmentResolutionForWidth(size.width, resolution);
  const actualShadowMapSize = shadowMapSizeForWidth(size.width, shadowMapSize);

  const direction = React.useMemo(() => sunDirection(config), [config]);
  const textures = React.useMemo(
    () => ({
      sky: createSkyTexture(config),
      ground: createGroundTexture(config),
      sunGlow: createSunGlowTexture(),
    }),
    [config]
  );

  React.useEffect(() => {
    return () => {
      textures.sky.dispose();
      textures.ground.dispose();
      textures.sunGlow.dispose();
    };
  }, [textures]);

  React.useEffect(() => {
    const previous = applySceneFog(scene, config);
    return () => {
      restoreSceneFog(scene, previous);
    };
  }, [scene, config]);

  // O light é remontado por `key` quando o breakpoint muda (o three não
  // redimensiona um shadow map existente); aqui só se liberta o mapa antigo.
  React.useEffect(() => {
    const light = sunLight.current;
    return () => {
      light?.shadow.dispose();
    };
  }, [actualShadowMapSize]);

  const sunPosition: [number, number, number] = [
    direction[0] * config.sunDistance,
    direction[1] * config.sunDistance,
    direction[2] * config.sunDistance,
  ];
  const glowPosition: [number, number, number] = [
    direction[0] * config.sunGlowDistance,
    direction[1] * config.sunGlowDistance,
    direction[2] * config.sunGlowDistance,
  ];
  const environmentSunPosition: [number, number, number] = [
    direction[0] * 12,
    direction[1] * 12,
    direction[2] * 12,
  ];

  return (
    <>
      <hemisphereLight
        args={[
          config.hemisphereSky,
          config.hemisphereGround,
          config.hemisphereIntensity,
        ]}
      />
      <ambientLight
        color={config.ambientColor}
        intensity={config.ambientIntensity}
      />
      <directionalLight
        key={actualShadowMapSize}
        ref={sunLight}
        position={sunPosition}
        color={config.sunColor}
        intensity={config.sunIntensity}
        castShadow
        shadow-mapSize={[actualShadowMapSize, actualShadowMapSize]}
        shadow-camera-left={-config.shadowBounds}
        shadow-camera-right={config.shadowBounds}
        shadow-camera-top={config.shadowBounds}
        shadow-camera-bottom={-config.shadowBounds}
        shadow-camera-near={0.5}
        shadow-camera-far={config.sunDistance * 3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />

      <mesh scale={[1, 1, 1]} renderOrder={-1}>
        <sphereGeometry args={[SKY_RADIUS, 32, 16]} />
        <meshBasicMaterial
          map={textures.sky}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <sprite position={glowPosition} scale={[config.sunGlowSize, config.sunGlowSize, 1]}>
        <spriteMaterial
          map={textures.sunGlow}
          color={config.sunGlowColor}
          transparent
          opacity={config.sunGlowOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
        />
      </sprite>

      <mesh
        position={[0, -0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial
          map={textures.ground}
          roughness={config.groundRoughness}
          metalness={config.groundMetalness}
          envMapIntensity={config.groundEnvMapIntensity}
        />
      </mesh>

      <Environment resolution={actualResolution}>
        <Lightformer
          intensity={0.85}
          position={[0, 14, 0]}
          rotation-x={Math.PI / 2}
          scale={[38, 38, 1]}
          color={config.skyTop}
        />
        <Lightformer
          intensity={0.5}
          position={[0, 2.5, -14]}
          scale={[38, 10, 1]}
          color={config.skyHorizon}
        />
        <Lightformer
          intensity={0.35}
          position={[0, 3, 14]}
          rotation-y={Math.PI}
          scale={[30, 8, 1]}
          color={config.skyHorizon}
        />
        <Lightformer
          intensity={config.environmentSunIntensity}
          form="circle"
          position={environmentSunPosition}
          scale={[2.6, 2.6]}
          color={config.sunColor}
        />
        <Lightformer
          intensity={0.3}
          position={[0, -3, 0]}
          rotation-x={-Math.PI / 2}
          scale={[30, 30, 1]}
          color={config.groundColor}
        />
      </Environment>
      <EnvironmentMapDisposer resolution={actualResolution} />
    </>
  );
}
