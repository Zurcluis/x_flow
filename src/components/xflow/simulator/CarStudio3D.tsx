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
import {
  Camera,
  RotateCw,
  Download,
  ZoomIn,
  ZoomOut,
  ExternalLink,
} from "lucide-react";
import {
  CAR_MODELS,
  CarModelDef,
  DEFAULT_CAR_MODEL_ID,
} from "@/lib/car-models";
import {
  CarCoverage,
  CarCoverageZone,
  CAR_COVERAGE_OPTIONS,
  CarFinish,
  CAR_FINISH_OPTIONS,
  carPaintParams,
  resolveCoverageZone,
} from "@/lib/car-finish";

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
  /** Acabamento forçado pelo utilizador; sem valor respeita o GU da película */
  finishOverride?: CarFinish;
}

type CameraPreset =
  | "front"
  | "threeQuarter"
  | "left"
  | "right"
  | "rear"
  | "top";

const CAMERA_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  front: [0.4, 1.1, 6.4],
  threeQuarter: [4.4, 1.7, 4.6],
  right: [6.4, 1.2, 0.2],
  left: [-6.4, 1.2, 0.2],
  rear: [-0.4, 1.4, -6.6],
  top: [0.2, 7.4, 0.6],
};

const CAMERA_LABELS: { key: CameraPreset; label: string }[] = [
  { key: "threeQuarter", label: "3/4" },
  { key: "front", label: "Frente" },
  { key: "left", label: "Esq." },
  { key: "right", label: "Dir." },
  { key: "rear", label: "Traseira" },
  { key: "top", label: "Topo" },
];

const ORBIT_TARGET = new THREE.Vector3(0, 0.5, 0);

/** Material de pintura da película a partir dos parâmetros físicos do catálogo */
function filmPaintMaterial(film: CarStudioFilm) {
  const metallic = Math.min(1, Math.max(0, film.metallic ?? 0));
  const isChrome = /chrome/i.test(film.name) || /chrome/i.test(film.textureEffect);
  const isCarbon = /carbon/i.test(film.textureEffect) || /carbon/i.test(film.name);
  const params = carPaintParams(film.finishOverride, film.glossGu, metallic);

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(film.colorHex),
  });

  if (isChrome) {
    mat.metalness = 1;
    mat.roughness = film.finishOverride ? params.roughness : 0.07;
    mat.clearcoat = film.finishOverride ? params.clearcoat : 1;
    mat.clearcoatRoughness = film.finishOverride ? params.clearcoatRoughness : 0.04;
    mat.envMapIntensity = film.finishOverride ? params.envMapIntensity : 1.6;
    return mat;
  }

  if (isCarbon) {
    mat.color = new THREE.Color(film.colorHex).lerp(new THREE.Color("#101114"), 0.35);
    mat.metalness = 0.55;
    if (film.finishOverride) {
      mat.roughness = params.roughness;
      mat.clearcoat = params.clearcoat;
      mat.clearcoatRoughness = params.clearcoatRoughness;
      mat.envMapIntensity = params.envMapIntensity;
    } else {
      mat.roughness = 0.42;
      mat.clearcoat = 0.7;
      mat.clearcoatRoughness = 0.25;
    }
    return mat;
  }

  mat.roughness = params.roughness;
  mat.clearcoat = params.clearcoat;
  mat.clearcoatRoughness = params.clearcoatRoughness;
  mat.metalness = metallic > 0 ? 0.35 + metallic * 0.5 : 0;
  mat.envMapIntensity = params.envMapIntensity;
  return mat;
}

function meshMatches(meshName: string, patterns: string[] | undefined): boolean {
  if (!patterns || patterns.length === 0) return false;
  return patterns.some((p) => meshName === p || meshName.startsWith(p));
}

/**
 * Promove um MeshStandardMaterial a MeshPhysicalMaterial sem usar
 * MeshPhysicalMaterial.copy(source), que rebenta ao ler propriedades
 * físicas (clearcoat, sheen, anisotropia) inexistentes no material standard.
 */
function toPhysicalMaterial(m: THREE.Material): THREE.MeshPhysicalMaterial {
  const physical = new THREE.MeshPhysicalMaterial();
  const copyStandard = THREE.MeshStandardMaterial.prototype.copy as unknown as (
    this: THREE.MeshPhysicalMaterial,
    source: THREE.MeshStandardMaterial
  ) => void;
  copyStandard.call(physical, m as THREE.MeshStandardMaterial);
  physical.name = m.name;
  return physical;
}

const ZONE_VERTEX_DECL = `varying vec3 vXflowWorldPos;
varying vec3 vXflowWorldNormal;
`;

const ZONE_FRAGMENT_DECL = `varying vec3 vXflowWorldPos;
varying vec3 vXflowWorldNormal;
uniform vec3 uXflowZoneMin;
uniform vec3 uXflowZoneMax;
uniform float uXflowMinNormalY;
uniform float uXflowZoneRoughness;
uniform float uXflowZoneClearcoat;
uniform float uXflowZoneClearcoatRoughness;
uniform float uXflowOriginalClearcoat;
uniform float uXflowOriginalClearcoatRoughness;
bool xflowInZone(vec3 p, vec3 n) {
  return p.x >= uXflowZoneMin.x && p.x <= uXflowZoneMax.x
    && p.y >= uXflowZoneMin.y && p.y <= uXflowZoneMax.y
    && p.z >= uXflowZoneMin.z && p.z <= uXflowZoneMax.z
    && n.y >= uXflowMinNormalY;
}
`;

/**
 * Recorta a película à zona escolhida. Com roughness definido, o material
 * original mantém cor/textura e só o brilho é alterado dentro da zona; sem
 * roughness (película opaca), a geometria fora da zona é descartada.
 */
interface CoverageClearcoat {
  target: number;
  roughness: number;
  original: number;
  originalRoughness: number;
}

function applyCoverageMask(
  material: THREE.Material,
  zone: CarCoverageZone,
  roughness?: number,
  clearcoat?: CoverageClearcoat
) {
  material.customProgramCacheKey = () =>
    `xflow-zone-${typeof roughness === "number" ? "ppf" : "opaque"}${
      clearcoat ? "-cc" : ""
    }`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uXflowZoneMin = {
      value: new THREE.Vector3(zone.minX, zone.minY, zone.minZ),
    };
    shader.uniforms.uXflowZoneMax = {
      value: new THREE.Vector3(zone.maxX, zone.maxY, zone.maxZ),
    };
    shader.uniforms.uXflowMinNormalY = { value: zone.minNormalY };
    shader.uniforms.uXflowZoneRoughness = { value: roughness ?? 0.4 };
    shader.uniforms.uXflowZoneClearcoat = { value: clearcoat?.target ?? 0 };
    shader.uniforms.uXflowZoneClearcoatRoughness = {
      value: clearcoat?.roughness ?? 0.0525,
    };
    shader.uniforms.uXflowOriginalClearcoat = {
      value: clearcoat?.original ?? 0,
    };
    shader.uniforms.uXflowOriginalClearcoatRoughness = {
      value: clearcoat?.originalRoughness ?? 0.0525,
    };

    shader.vertexShader = ZONE_VERTEX_DECL + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vXflowWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vXflowWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
    );

    shader.fragmentShader = ZONE_FRAGMENT_DECL + shader.fragmentShader;
    if (typeof roughness === "number") {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        if (xflowInZone(vXflowWorldPos, vXflowWorldNormal)) {
          roughnessFactor = uXflowZoneRoughness;
        }`
      );
      if (clearcoat) {
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <lights_physical_fragment>",
          `#include <lights_physical_fragment>
          if (xflowInZone(vXflowWorldPos, vXflowWorldNormal)) {
            material.clearcoat = saturate(uXflowZoneClearcoat);
            material.clearcoatRoughness = clamp(uXflowZoneClearcoatRoughness, 0.0525, 1.0);
          } else {
            material.clearcoat = saturate(uXflowOriginalClearcoat);
            material.clearcoatRoughness = clamp(uXflowOriginalClearcoatRoughness, 0.0525, 1.0);
          }`
        );
      }
    } else {
      shader.fragmentShader = shader.fragmentShader.replace(
        "void main() {",
        `void main() {
        if (!xflowInZone(vXflowWorldPos, vXflowWorldNormal)) discard;`
      );
    }
  };
  material.needsUpdate = true;
}

/** Aplica os materiais da película conforme a estratégia do modelo */
function applyModelMaterials(
  root: THREE.Object3D,
  def: CarModelDef,
  film: CarStudioFilm,
  coverage: CarCoverage,
  bounds?: THREE.Box3
) {
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

  const zone =
    bounds && coverage !== "full"
      ? resolveCoverageZone(coverage, bounds)
      : null;

  // Superfícies da carroçaria que recebem a película
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
      // Nos modelos com preserveMaterials, vidros, pneus, jantes e restantes
      // elementos mantêm exatamente os materiais originais do GLB.
      if (!def.preserveMaterials) {
        if (def.paintBy === "material") {
          if (matNames.some((n) => meshMatches(n, def.paint.glass))) mesh.material = glassMat;
          else if (matNames.some((n) => meshMatches(n, def.paint.metal))) mesh.material = metalMat;
        } else {
          if (meshMatches(mesh.name, def.paint.glass)) mesh.material = glassMat;
          else if (meshMatches(mesh.name, def.paint.metal)) mesh.material = metalMat;
        }
      }
      return;
    }

    bodyTargets.push(mesh);
  });

  // PPF transparente: mantém a pintura e as riscas de fábrica do GLB.
  // Integral ajusta o brilho de toda a chapa; parcial altera só a zona.
  if (film.transparent) {
    const params = carPaintParams(film.finishOverride, film.glossGu, film.metallic ?? 0);
    for (const mesh of bodyTargets) {
      const isArray = Array.isArray(mesh.material);
      const sources: THREE.Material[] = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const cloned = sources.map((m) => {
        // Materiais standard não têm clearcoat: promove-se o clone a physical
        // para os presets de brilho/acetinado/mate continuarem a funcionar.
        const mat: THREE.Material =
          "clearcoat" in m ? m.clone() : toPhysicalMaterial(m);
        mat.userData.xflowCreated = true;
        if (zone) {
          if ("roughness" in mat) {
            const physical = mat as THREE.MeshPhysicalMaterial;
            const originalClearcoat = physical.clearcoat ?? 0;
            const originalClearcoatRoughness =
              physical.clearcoatRoughness ?? 0.0525;
            physical.clearcoat = 1;
            applyCoverageMask(mat, zone, params.roughness, {
              target: params.clearcoat,
              roughness: params.clearcoatRoughness,
              original: originalClearcoat,
              originalRoughness: originalClearcoatRoughness,
            });
          }
          return mat;
        }
        if ("roughness" in mat) (mat as THREE.MeshStandardMaterial).roughness = params.roughness;
        if ("clearcoat" in mat) {
          const physical = mat as THREE.MeshPhysicalMaterial;
          physical.clearcoat = params.clearcoat;
          physical.clearcoatRoughness = params.clearcoatRoughness;
        }
        if ("envMapIntensity" in mat) {
          (mat as THREE.MeshStandardMaterial).envMapIntensity = params.envMapIntensity;
        }
        return mat;
      });
      mesh.material = isArray ? cloned : cloned[0];
    }
    return;
  }

  // Película opaca parcial: mantém a pintura de fábrica e acrescenta uma
  // segunda camada com a cor da película, recortada pela zona escolhida.
  if (zone) {
    const overlayMat = filmPaintMaterial(film);
    overlayMat.polygonOffset = true;
    overlayMat.polygonOffsetFactor = -2;
    overlayMat.polygonOffsetUnits = -2;
    overlayMat.userData.xflowCreated = true;
    applyCoverageMask(overlayMat, zone);

    for (const mesh of bodyTargets) {
      const overlay = new THREE.Mesh(mesh.geometry, overlayMat);
      overlay.name = `${mesh.name}-xflow-film`;
      overlay.castShadow = false;
      overlay.receiveShadow = false;
      overlay.renderOrder = 1;
      mesh.add(overlay);
    }
    return;
  }

  const paintMat = filmPaintMaterial(film);
  paintMat.userData.xflowCreated = true;
  for (const mesh of bodyTargets) mesh.material = paintMat;
}

function Car({
  def,
  film,
  coverage,
}: {
  def: CarModelDef;
  film: CarStudioFilm;
  coverage: CarCoverage;
}) {
  const { scene } = useGLTF(def.url);

  const car = useMemo(() => {
    const root = scene.clone(true);

    if (coverage === "full") {
      applyModelMaterials(root, def, film, "full");
    }

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

    if (coverage !== "full") {
      const finalBox = new THREE.Box3().setFromObject(root);
      applyModelMaterials(root, def, film, coverage, finalBox);
    }

    return root;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, def, coverage, film.colorHex, film.glossGu, film.metallic, film.transparent, film.textureEffect, film.name, film.finishOverride]);

  // R3F não destrói <primitive>; liberta apenas os materiais criados aqui,
  // mantendo intactas as geometrias e texturas do GLB em cache.
  React.useEffect(() => {
    return () => {
      car.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m.userData.xflowCreated) m.dispose();
        }
      });
    };
  }, [car]);

  return <primitive object={car} />;
}

/** Anima a câmara até ao preset selecionado */
function CameraRig({
  preset,
  autoRotate,
  zoom,
}: {
  preset: CameraPreset;
  autoRotate: boolean;
  zoom: number;
}) {
  const { camera, controls } = useThree();
  const desired = useMemo(() => {
    const [x, y, z] = CAMERA_POSITIONS[preset];
    return new THREE.Vector3(x, y, z)
      .sub(ORBIT_TARGET)
      .multiplyScalar(zoom)
      .add(ORBIT_TARGET);
  }, [preset, zoom]);
  const wants = useRef(false);

  React.useEffect(() => {
    wants.current = true;
  }, [preset, zoom]);

  useFrame(() => {
    if (autoRotate) {
      wants.current = false;
      return;
    }
    if (!wants.current) return;
    camera.position.lerp(desired, 0.07);
    const c = controls as unknown as OrbitLike | null;
    if (c) {
      c.target.lerp(ORBIT_TARGET, 0.07);
      c.update();
    }
    if (camera.position.distanceTo(desired) < 0.02) wants.current = false;
  });
  return null;
}

export function CarStudio3D({ film }: { film: CarStudioFilm }) {
  const [modelId, setModelId] = useState(DEFAULT_CAR_MODEL_ID);
  const [preset, setPreset] = useState<CameraPreset>("threeQuarter");
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [coverage, setCoverage] = useState<CarCoverage>("full");
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const def = useMemo(
    () => CAR_MODELS.find((m) => m.id === modelId) ?? CAR_MODELS[0],
    [modelId]
  );
  const effectiveCoverage = def.supportsPartialWrap ? coverage : "full";
  const coverageLabel = CAR_COVERAGE_OPTIONS.find(
    (option) => option.id === effectiveCoverage
  )?.label;
  const finishLabel = film.finishOverride
    ? CAR_FINISH_OPTIONS.find((f) => f.id === film.finishOverride)?.label
    : "Película";

  const capture = () => {
    const gl = glRef.current;
    if (!gl) return;
    const source = gl.domElement;
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(source, 0, 0);

    // CC BY: a imagem exportada leva a atribuição do modelo e da película.
    const pad = Math.round(out.width * 0.012);
    const fontSize = Math.max(12, Math.round(out.width * 0.012));
    const barHeight = Math.round(fontSize * 2.2);
    ctx.fillStyle = "rgba(5,6,6,0.82)";
    ctx.fillRect(0, out.height - barHeight, out.width, barHeight);
    ctx.fillStyle = "#a9adae";
    ctx.font = `${fontSize}px ui-monospace, monospace`;
    ctx.textBaseline = "middle";
    const attribution = def.credit
      ? `${def.brand} · ${def.credit.author} · ${def.credit.license}`
      : `${def.brand} · ${def.label}`;
    const coverageText =
      coverageLabel && effectiveCoverage !== "full" ? ` · ${coverageLabel}` : "";
    ctx.fillText(
      `${film.name}${coverageText} · ${attribution}`,
      pad,
      out.height - barHeight / 2
    );

    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `xflow-3d-${film.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  const changeZoom = (delta: number) => {
    setAutoRotate(false);
    setZoom((value) => Math.min(1.6, Math.max(0.62, value + delta)));
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
          <Car key={def.id} def={def} film={film} coverage={effectiveCoverage} />

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

          <CameraRig preset={preset} autoRotate={autoRotate} zoom={zoom} />
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
      <div className="absolute top-2 inset-x-0 flex items-center justify-center gap-1 sm:gap-1.5 z-20 px-2">
        <Camera className="hidden sm:block h-3.5 w-3.5 text-[#8a9092] mr-1" />
        {CAMERA_LABELS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setAutoRotate(false);
              setZoom(1);
              setPreset(key);
            }}
            aria-pressed={preset === key && !autoRotate}
            className={`px-1.5 sm:px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer ${
              preset === key && !autoRotate
                ? "bg-[#d3a548] text-[#050606]"
                : "bg-[#050606]/80 text-[#a9adae] border border-white/[0.08] hover:border-white/25"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Zona de aplicação — só nos modelos com wrap parcial */}
      {def.supportsPartialWrap && (
        <div
          className="absolute bottom-[6.1rem] sm:bottom-[4.15rem] xl:bottom-[5.5rem] left-2 sm:left-3 right-2 sm:right-40 xl:right-auto flex items-center gap-1 z-10 overflow-x-auto [mask-image:linear-gradient(to_right,black_82%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Zona de aplicação"
        >
          <span className="hidden sm:inline shrink-0 mr-1 text-[9px] uppercase tracking-wider font-mono text-[#8a9092]">
            Zona
          </span>
          {CAR_COVERAGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCoverage(option.id)}
              aria-pressed={effectiveCoverage === option.id}
              className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer border ${
                effectiveCoverage === option.id
                  ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
                  : "bg-[#050606]/80 text-[#a9adae] border-white/[0.08] hover:border-white/25"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Seletor de modelo */}
      <div className="absolute bottom-16 sm:bottom-7 left-2 sm:left-3 right-2 sm:right-40 xl:right-auto flex flex-nowrap xl:flex-wrap gap-1.5 sm:max-w-none xl:max-w-[62%] z-10 overflow-x-auto xl:overflow-visible [mask-image:linear-gradient(to_right,black_82%,transparent)] xl:[mask-image:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CAR_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setModelId(m.id);
              setZoom(1);
            }}
            title={`${m.brand} · ${m.label}`}
            aria-pressed={modelId === m.id}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-all cursor-pointer border ${
              modelId === m.id
                ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
                : "bg-[#050606]/80 text-[#a9adae] border-white/[0.08] hover:border-white/25"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Zoom + rotação automática + captura */}
      <div className="absolute bottom-8 sm:bottom-7 right-2 sm:right-3 flex items-center gap-1.5 z-10">
        <button
          type="button"
          onClick={() => changeZoom(-0.18)}
          className="p-2 rounded-full bg-[#050606]/85 text-[#a9adae] border border-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
          title="Aproximar"
          aria-label="Aproximar"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => changeZoom(0.18)}
          className="p-2 rounded-full bg-[#050606]/85 text-[#a9adae] border border-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
          title="Afastar"
          aria-label="Afastar"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate((v) => !v)}
          className={`p-2 rounded-full border transition-all cursor-pointer ${
            autoRotate
              ? "bg-[#d3a548] text-[#050606] border-[#d3a548]"
              : "bg-[#050606]/85 text-[#a9adae] border-white/[0.1] hover:border-white/30"
          }`}
          title="Rotação automática"
          aria-label="Rotação automática"
          aria-pressed={autoRotate}
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={capture}
          className="p-2 rounded-full bg-[#050606]/85 text-[#a9adae] border border-white/[0.1] hover:border-white/30 transition-all cursor-pointer"
          title="Guardar imagem"
          aria-label="Guardar imagem"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Créditos obrigatórios do modelo + ajuda de interação */}
      <div className="absolute bottom-0 inset-x-0 z-10 px-3 pb-1.5 flex items-center justify-between gap-2 text-[9px] text-[#747a7c]">
        <span className="truncate">
          {def.brand} · {finishLabel}
          {coverageLabel && effectiveCoverage !== "full" && ` · ${coverageLabel}`}
          {def.credit && (
            <>
              {" · "}
              <a
                href={def.credit.sourceUrl}
                target="_blank"
                rel="noreferrer"
                title={`${def.credit.author} · ${def.credit.license}. ${def.credit.modifications ?? ""}`}
                className="inline-flex items-center gap-0.5 text-[#a9adae] hover:text-[#d3a548] underline decoration-white/20 underline-offset-2"
              >
                {def.credit.author} · {def.credit.license}
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </>
          )}
        </span>
        <span className="hidden sm:inline shrink-0">
          arrasta para rodar · scroll ou pinça para zoom
        </span>
      </div>
    </div>
  );
}

// O BMW é o modelo inicial: aquece a cache do GLTFLoader antes do primeiro frame.
useGLTF.preload(
  CAR_MODELS.find((m) => m.id === DEFAULT_CAR_MODEL_ID)?.url ?? CAR_MODELS[0].url
);
