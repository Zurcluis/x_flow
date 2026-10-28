"use client";

import React from "react";
import * as THREE from "three";
import { Environment, Lightformer } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";

import {
  WORKSHOP_SCENE,
  shouldShowWorkshopCeiling,
  shouldShowWorkshopWall,
} from "@/lib/workshop-scene";
import { EnvironmentMapDisposer } from "./EnvironmentMapDisposer";

interface NeonTube {
  key: string;
  color: string;
  geometry: THREE.TubeGeometry;
}

function neonPoint(x: number, y: number) {
  return new THREE.Vector3(
    (x - 436.5) * WORKSHOP_SCENE.neonMarkScale,
    (391 - y) * WORKSHOP_SCENE.neonMarkScale,
    0
  );
}

function createNeonTubes(): NeonTube[] {
  const paths = [
    {
      key: "chevron-white",
      color: WORKSHOP_SCENE.neonWhite,
      curve: new THREE.CatmullRomCurve3([
        neonPoint(201, 492),
        neonPoint(438, 284),
        neonPoint(672, 492),
      ]),
    },
    {
      key: "chevron-amber",
      color: WORKSHOP_SCENE.neonAmber,
      curve: new THREE.CatmullRomCurve3([
        neonPoint(201, 291),
        neonPoint(438, 498),
        neonPoint(672, 291),
      ]),
    },
    {
      key: "diagonal-white",
      color: WORKSHOP_SCENE.neonWhite,
      curve: new THREE.LineCurve3(
        neonPoint(505, 337),
        neonPoint(605, 430)
      ),
    },
  ];

  return paths.map(({ key, color, curve }) => ({
    key,
    color,
    geometry: new THREE.TubeGeometry(curve, 36, 0.034, 7, false),
  }));
}

function createLetteringTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!ctx) return texture;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  let fontSize = 182;
  do {
    ctx.font = `700 ${fontSize}px "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    fontSize -= 4;
  } while (ctx.measureText("xmotion").width > 900 && fontSize > 120);

  const xWidth = ctx.measureText("x").width;
  const totalWidth = ctx.measureText("xmotion").width;
  const startX = (canvas.width - totalWidth) / 2;
  const baseline = 132;

  const stroke = (
    text: string,
    x: number,
    color: string,
    blur: number,
    width: number
  ) => {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeText(text, x, baseline);
  };

  stroke("x", startX, WORKSHOP_SCENE.neonAmber, 38, 24);
  stroke("x", startX, "#ffb066", 14, 12);
  stroke("x", startX, "#ffe2bd", 4, 5);

  const motionX = startX + xWidth;
  stroke("motion", motionX, WORKSHOP_SCENE.neonWhite, 34, 22);
  stroke("motion", motionX, "#f4f8ff", 12, 10);
  stroke("motion", motionX, WORKSHOP_SCENE.neonWhite, 3, 4);

  texture.needsUpdate = true;
  return texture;
}

function createGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  if (!ctx) return texture;

  const gradient = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  gradient.addColorStop(0, "rgba(255, 150, 50, 0.55)");
  gradient.addColorStop(0.45, "rgba(255, 122, 0, 0.2)");
  gradient.addColorStop(1, "rgba(255, 122, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  texture.needsUpdate = true;
  return texture;
}

function createConcreteTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);

  if (!ctx) return texture;

  ctx.fillStyle = WORKSHOP_SCENE.floorColor;
  ctx.fillRect(0, 0, size, size);

  let seed = 20261026;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 9000; i += 1) {
    const shade = random() > 0.52 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.012 + random() * 0.035})`;
    const dot = 0.8 + random() * 1.8;
    ctx.fillRect(random() * size, random() * size, dot, dot);
  }

  for (let i = 0; i < 7; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const radius = 40 + random() * 100;
    const stain = ctx.createRadialGradient(x, y, 0, x, y, radius);
    stain.addColorStop(0, "rgba(20, 24, 26, 0.12)");
    stain.addColorStop(1, "rgba(20, 24, 26, 0)");
    ctx.fillStyle = stain;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  texture.needsUpdate = true;
  return texture;
}

function updateWorkshopOccluders(
  wall: THREE.Group | null,
  ceiling: THREE.Group | null,
  camera: THREE.Camera
) {
  if (wall) wall.visible = shouldShowWorkshopWall(camera.position.z);
  if (ceiling) ceiling.visible = shouldShowWorkshopCeiling(camera.position.y);
}

export function XMotionWorkshopEnv({ resolution }: { resolution: number }) {
  const { camera } = useThree();
  const wallRef = React.useRef<THREE.Group>(null);
  const ceilingRef = React.useRef<THREE.Group>(null);

  const neonTubes = React.useMemo(() => createNeonTubes(), []);
  const textures = React.useMemo(
    () => ({
      lettering: createLetteringTexture(),
      glow: createGlowTexture(),
      concrete: createConcreteTexture(),
    }),
    []
  );

  React.useEffect(() => {
    return () => {
      for (const tube of neonTubes) tube.geometry.dispose();
      textures.lettering.dispose();
      textures.glow.dispose();
      textures.concrete.dispose();
    };
  }, [neonTubes, textures]);

  useFrame(() => {
    updateWorkshopOccluders(wallRef.current, ceilingRef.current, camera);
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#dce6f2" />
      <directionalLight position={[4, 6, 7]} intensity={0.6} color="#eef4ff" />

      {/* Parede e néon: escondidos quando a câmara passa para trás da parede. */}
      <group ref={wallRef}>
        <mesh position={[0, WORKSHOP_SCENE.wallCenterY, WORKSHOP_SCENE.wallZ]}>
          <planeGeometry
            args={[WORKSHOP_SCENE.wallWidth, WORKSHOP_SCENE.wallHeight]}
          />
          <meshStandardMaterial
            color={WORKSHOP_SCENE.wallColor}
            roughness={0.95}
            metalness={0.02}
          />
        </mesh>

        <mesh
          position={[
            0,
            WORKSHOP_SCENE.neonMarkY,
            WORKSHOP_SCENE.wallZ + 0.02,
          ]}
          renderOrder={1}
        >
          <planeGeometry args={[3.8, 2.2]} />
          <meshBasicMaterial
            map={textures.glow}
            transparent
            opacity={0.75}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>

        <group
          position={[0, WORKSHOP_SCENE.neonMarkY, WORKSHOP_SCENE.neonZ]}
        >
          {neonTubes.map((tube) => (
            <mesh key={tube.key} geometry={tube.geometry}>
              <meshBasicMaterial
                color={tube.color}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>

        <mesh
          position={[
            0,
            WORKSHOP_SCENE.neonTextY,
            WORKSHOP_SCENE.neonZ + 0.01,
          ]}
          renderOrder={2}
        >
          <planeGeometry args={[3.8, 0.95]} />
          <meshBasicMaterial
            map={textures.lettering}
            transparent
            opacity={0.95}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Luz local do néon: mantém-se fora do grupo para não apagar com a parede. */}
      <pointLight
        position={[0, 3, -4]}
        color={WORKSHOP_SCENE.neonAmber}
        intensity={7}
        distance={6}
        decay={2}
      />
      <pointLight
        position={[0, 2, -4]}
        color={WORKSHOP_SCENE.neonWhite}
        intensity={3.5}
        distance={5}
        decay={2}
      />

      {/* Calhas de teto: sem plano sólido, escondidas na vista de topo. */}
      <group ref={ceilingRef}>
        {WORKSHOP_SCENE.ceilingRowsX.map((x) => (
          <group key={x} position={[x, WORKSHOP_SCENE.ceilingY, 0.2]}>
            <mesh position={[0, 0.055, 0]}>
              <boxGeometry
                args={[
                  WORKSHOP_SCENE.ceilingBarWidth + 0.09,
                  0.08,
                  WORKSHOP_SCENE.ceilingBarLength + 0.18,
                ]}
              />
              <meshStandardMaterial color="#171b1d" roughness={0.75} />
            </mesh>
            <mesh>
              <boxGeometry
                args={[
                  WORKSHOP_SCENE.ceilingBarWidth,
                  0.045,
                  WORKSHOP_SCENE.ceilingBarLength,
                ]}
              />
              <meshBasicMaterial
                color={WORKSHOP_SCENE.ceilingColor}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Piso de betão afagado; o ContactShadows fica ligeiramente acima. */}
      <mesh
        position={[0, WORKSHOP_SCENE.floorY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[WORKSHOP_SCENE.floorSize, WORKSHOP_SCENE.floorSize]}
        />
        <meshStandardMaterial
          map={textures.concrete}
          roughness={0.44}
          metalness={0.05}
          envMapIntensity={0.65}
        />
      </mesh>

      <Environment resolution={resolution}>
        {WORKSHOP_SCENE.ceilingRowsX.map((x) => (
          <Lightformer
            key={x}
            intensity={2.1}
            position={[x, WORKSHOP_SCENE.ceilingY, 0.2]}
            rotation-x={Math.PI / 2}
            scale={[0.18, WORKSHOP_SCENE.ceilingBarLength, 1]}
            color={WORKSHOP_SCENE.ceilingColor}
          />
        ))}
        <Lightformer
          intensity={0.75}
          position={[0, WORKSHOP_SCENE.neonMarkY, WORKSHOP_SCENE.neonZ + 0.05]}
          scale={[2.4, 1.2, 1]}
          color={WORKSHOP_SCENE.neonAmber}
        />
        <Lightformer
          intensity={0.5}
          position={[0, WORKSHOP_SCENE.neonTextY, WORKSHOP_SCENE.neonZ + 0.05]}
          scale={[3.8, 1, 1]}
          color={WORKSHOP_SCENE.neonWhite}
        />
        <Lightformer
          intensity={0.5}
          position={[0, 2.5, 7]}
          scale={[10, 3.5, 1]}
          color="#e8f0ff"
        />
        <Lightformer
          intensity={0.25}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[10, 10, 1]}
          color="#dbe9ff"
        />
      </Environment>
      <EnvironmentMapDisposer resolution={resolution} />
    </>
  );
}
