"use client";

// Estúdio 3D de acabamentos — configurador WebGL em tempo real (estilo Car
// Visualizer da Avery Dennison/Wrapstock): viatura rodável com material de
// pintura física (clearcoat, rugosidade por GU, metálicos), luz de estúdio,
// presets de câmara e vários modelos de viatura.

import React, { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { Camera, RotateCw, Download } from "lucide-react";
import { CAR_MODELS, CarModelDef } from "@/lib/car-models";

interface OrbitLike {
  target: { lerp(v: THREE.Vector3, alpha: number): void };
  update(): void;
}

export interface CarStudioFilm {
  name: string;
  colorHex: string;
  /** Acabamento declarado no catálogo */
  textureEffect: string;
  glossGu?: number;
  metallic?: number;
  flakeScale?: number;
  /** PPF transparente — preserva a cor de origem e aplica só brilho */
  transparent?: boolean;
}

type CameraPreset = "front" | "threeQuarter" | "side" | "rear" | "top";

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  front: [0.4, 1.1, 6.4],
  threeQuarter: [4.4, 1.7, 4.6],
  side: [6.4, 1.2, 0.2],
  rear: [-0.4, 1.4, -6.6],
  top: [0.2, 7.4, 0.6],
};

const CAMERA_LABELS: { key: CameraPreset; label: string }[] = [
  { key: "threeQuarter", label: "3/4" },
  { key: "front", label: "Frente" },
  { key: "side", label: "Perfil" },
  { key: "rear", label: "Traseira" },
  { key: "top", label: "Topo" },
];

/** Material de pintura da película a partir dos parâmetros físicos do catálogo */
function filmPaintMaterial(film: CarStudioFilm, originalColor: THREE.Color) {
  const gloss = Math.min(1, Math.max(0, (film.glossGu ?? 85) / 100));
  const metallic = Math.min(1, Math.max(0, film.metallic ?? 0));
  const isChrome = /chrome/i.test(film.name) || /chrome/i.test(film.textureEffect);
  const isCarbon = /carbon/i.test(film.textureEffect) || /carbon/i.test(film.name);

  const mat = new THREE.MeshPhysicalMaterial({
    color: film.transparent ? originalColor : new THREE.Color(film.colorHex),
  });

  if (film.transparent) {
    mat.roughness = 0.1 + (1 - gloss) * 0.55;
    mat.clearcoat = gloss >= 0.5 ? 1 : 0;
    mat.clearcoatRoughness = 0.08;
    mat.envMapIntensity = 1.1;
    return mat;
  }

  if (isChrome) {
    mat.metalness = 1;
    mat.roughness = 0.07;
    mat.clearcoat = 1;
    mat.clearcoatRoughness = 0.04;
    mat.envMapIntensity = 1.6;
    return mat;
  }

  if (isCarbon) {
    mat.color = new THREE.Color(film.colorHex).lerp(new THREE.Color("#101114"), 0.35);
    mat.metalness = 0.55;
    mat.roughness = 0.42;
    mat.clearcoat = 0.7;
    mat.clearcoatRoughness = 0.25;
    return mat;
  }

  const roughness = 0.1 + (1 - gloss) * 0.65;
  mat.roughness = Math.max(0.07, roughness - metallic * 0.04);
  mat.clearcoat = gloss >= 0.45 ? 1 : gloss * 1.6;
  mat.clearcoatRoughness = 0.06 + (1 - gloss) * 0.45;
  mat.metalness = metallic > 0 ? 0.35 + metallic * 0.5 : 0;
  mat.envMapIntensity = 1 + metallic * 0.4;
  return mat;
}

function meshMatches(meshName: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => meshName === p || meshName.startsWith(p));
}

/** Aplica os materiais da película conforme a estratégia do modelo */
function applyModelMaterials(root: THREE.Object3D, def: CarModelDef, film: CarStudioFilm) {
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#0e141a"),
    metalness: 0.9,
    roughness: 0.06,
    envMapIntensity: 1.4,
  });
  const metalMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#23262a"),
    metalness: 0.9,
    roughness: 0.32,
    envMapIntensity: 1.1,
  });

  // Cor de origem para PPF transparente: média dos materiais originais de chapa
  let originalColor = new THREE.Color("#a5342c");
  const bodyTargets: THREE.Mesh[] = [];

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (def.hide && def.hide.includes(mesh.name)) {
      mesh.visible = false;
      return;
    }
    mesh.castShadow = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const matNames = mats.map((m) => (m && "name" in m ? m.name : ""));
    const isBody =
      def.paintBy === "mesh"
        ? meshMatches(mesh.name, def.paint.body)
        : matNames.some((n) => meshMatches(n, def.paint.body));
    if (!isBody) {
      if (def.paintBy === "material") {
        if (matNames.some((n) => meshMatches(n, def.paint.glass))) mesh.material = glassMat;
        else if (matNames.some((n) => meshMatches(n, def.paint.metal))) mesh.material = metalMat;
      } else {
        if (meshMatches(mesh.name, def.paint.glass)) mesh.material = glassMat;
        else if (meshMatches(mesh.name, def.paint.metal)) mesh.material = metalMat;
      }
      return;
    }

    bodyTargets.push(mesh);
    if (film.transparent) {
      const src = mats[0];
      if (src && "color" in src) {
        const c = (src as THREE.MeshStandardMaterial).color.clone();
        if (src && "map" in src && (src as THREE.MeshStandardMaterial).map) {
          // Material com textura: usa cor média da textura via multiply implícito
          c.multiply(new THREE.Color("#cfcfcf"));
        }
        originalColor = c;
      }
    }
  });

  const paintMat = filmPaintMaterial(film, originalColor);
  for (const mesh of bodyTargets) mesh.material = paintMat;
}

function Car({ def, film }: { def: CarModelDef; film: CarStudioFilm }) {
  const { scene } = useGLTF(def.url);

  const car = useMemo(() => {
    const root = scene.clone(true);

    applyModelMaterials(root, def, film);

    // Normaliza dimensão e assenta no chão
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    root.scale.setScalar(def.length / maxDim);
    const after = new THREE.Box3().setFromObject(root);
    const center = after.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.z -= center.z;
    root.position.y -= after.min.y;

    return root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, def.id, film.colorHex, film.glossGu, film.metallic, film.transparent, film.textureEffect, film.name]);

  return <primitive object={car} />;
}

/** Anima a câmara até ao preset selecionado */
function CameraRig({
  preset,
  autoRotate,
}: {
  preset: CameraPreset;
  autoRotate: boolean;
}) {
  const { camera, controls } = useThree();
  const desired = useMemo(
    () => new THREE.Vector3(...CAMERA_POSITIONS[preset]),
    [preset]
  );
  const wants = useRef(false);

  React.useEffect(() => {
    wants.current = true;
  }, [preset]);

  useFrame(() => {
    if (autoRotate) {
      wants.current = false;
      return;
    }
    if (!wants.current) return;
    camera.position.lerp(desired, 0.07);
    const c = controls as unknown as OrbitLike | null;
    if (c) {
      c.target.lerp(new THREE.Vector3(0, 0.5, 0), 0.07);
      c.update();
    }
    if (camera.position.distanceTo(desired) < 0.02) wants.current = false;
  });
  return null;
}

export function CarStudio3D({ film }: { film: CarStudioFilm }) {
  const [modelId, setModelId] = useState(CAR_MODELS[0].id);
  const [preset, setPreset] = useState<CameraPreset>("threeQuarter");
  const [autoRotate, setAutoRotate] = useState(true);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const def = useMemo(() => CAR_MODELS.find((m) => m.id === modelId) ?? CAR_MODELS[0], [modelId]);

  const capture = () => {
    const gl = glRef.current;
    if (!gl) return;
    const url = gl.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `xflow-3d-${film.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows={false}
        dpr={[1, 2]}
        camera={{ position: CAMERA_POSITIONS.threeQuarter, fov: 38, near: 0.1, far: 100 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          glRef.current = gl;
        }}
      >
        <Suspense
          fallback={
            <Html center>
              <span className="text-xs text-[#a9adae] font-mono">a preparar estúdio 3D…</span>
            </Html>
          }
        >
          <Car key={def.id} def={def} film={film} />

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.55}
            scale={16}
            blur={2.4}
            far={2.4}
            resolution={512}
            color="#000000"
          />

          {/* Luz de estúdio: softboxes via Lightformers (sem HDR externo) */}
          <Environment resolution={256}>
            <Lightformer intensity={2.2} position={[0, 5, 0]} rotation-x={Math.PI / 2} scale={[9, 9, 1]} color="#ffffff" />
            <Lightformer intensity={1.4} position={[4, 2.2, 2]} rotation-y={-Math.PI / 3} scale={[6, 2.4, 1]} color="#ffffff" />
            <Lightformer intensity={1.1} position={[-4.5, 2, -1.5]} rotation-y={Math.PI / 2.4} scale={[7, 2.2, 1]} color="#e8f0ff" />
            <Lightformer intensity={0.9} position={[0, 1.6, -6]} scale={[8, 2, 1]} color="#fff4e0" />
            <Lightformer intensity={0.7} position={[0, 1.4, 6]} rotation-y={Math.PI} scale={[8, 2, 1]} color="#dfe8ff" />
          </Environment>

          <CameraRig preset={preset} autoRotate={autoRotate} />
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={2.6}
            maxDistance={12}
            minPolarAngle={0.12}
            maxPolarAngle={Math.PI / 2 - 0.04}
            autoRotate={autoRotate}
            autoRotateSpeed={0.7}
            target={[0, 0.5, 0]}
          />
        </Suspense>
      </Canvas>

      {/* Presets de câmara */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        <Camera className="h-3.5 w-3.5 text-[#8a9092] mr-1" />
        {CAMERA_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAutoRotate(false);
              setPreset(key);
            }}
            className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
              preset === key && !autoRotate
                ? "bg-[#d3a548] text-[#050606]"
                : "bg-[#050606]/80 text-[#a9adae] border border-white/[0.08] hover:border-white/25"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Seletor de modelo */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[60%] z-10">
        {CAR_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModelId(m.id)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${
              modelId === m.id
                ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
                : "bg-[#050606]/80 text-[#a9adae] border-white/[0.08] hover:border-white/25"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Rotação automática + captura */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          className={`p-2 rounded-full border transition-all cursor-pointer ${
            autoRotate
              ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
              : "bg-[#050606]/85 text-[#a9adae] border-white/[0.1] hover:border-white/30"
          }`}
          title="Rotação automática"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={capture}
          className="p-2 rounded-full bg-[#050606]/85 text-[#a9adae] border border-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
          title="Guardar imagem"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
