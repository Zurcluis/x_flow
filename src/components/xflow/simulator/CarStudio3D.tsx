"use client";

// Estúdio 3D de acabamentos — configurador WebGL em tempo real (estilo Car
// Visualizer da Avery Dennison/Wrapstock): viatura rodável com material de
// pintura física (clearcoat, rugosidade por GU, metálicos), luz de estúdio,
// presets de câmara e vários modelos de viatura.

import React, { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import {
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  Eraser,
  Palette,
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
  BODY_PANEL_DEFS,
  CarPartDef,
  PART_COLOR_PRESETS,
  classifyPart,
  collectCarParts,
  panelAtPoint,
  partSwatchColor,
  resolvePanelZone,
} from "@/lib/car-parts";
import {
  DEFAULT_ENVIRONMENT_ID,
  findEnvironment,
  type EnvironmentId,
} from "@/lib/car-environments";
import { COMPACT_VIEWPORT_WIDTH } from "@/lib/outdoor-scene";
import { EnvironmentSelector } from "@/components/xflow/simulator/EnvironmentSelector";
import { EnvironmentStage } from "@/components/xflow/simulator/environments/EnvironmentStage";
import {
  CarCoverage,
  CarCoverageBounds,
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
const MOBILE_CAMERA_FIT = 1.36;
const MOBILE_CAMERA_REFERENCE_WIDTH = 360;
const MOBILE_CAMERA_MAX_FIT = 1.9;

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;

  let end = text.length;
  while (end > 1 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) {
    end -= 1;
  }
  return `${text.slice(0, end)}…`;
}

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

function solidPaintFilm(film: CarStudioFilm, colorHex: string): CarStudioFilm {
  return {
    ...film,
    name: "Personalizado",
    colorHex,
    textureEffect: "paint",
    metallic: 0,
    transparent: false,
  };
}

function recolorPartMaterial(material: THREE.Material, colorHex: string) {
  if (!("color" in material)) return;
  (material as THREE.MeshStandardMaterial).color = new THREE.Color(colorHex);
}

function markHighlighted(material: THREE.Material) {
  if (!("emissive" in material)) return;
  const lit = material as THREE.MeshStandardMaterial;
  lit.emissive = new THREE.Color("#d3a548");
  lit.emissiveIntensity = 0.2;
}

function clonePartMaterial(
  material: THREE.Material,
  colorHex: string | null,
  highlighted: boolean
) {
  const clone = material.clone();
  clone.userData.xflowCreated = true;
  if (colorHex) recolorPartMaterial(clone, colorHex);
  if (highlighted) markHighlighted(clone);
  return clone;
}

function carBounds(box: THREE.Box3): CarCoverageBounds {
  return { min: box.min, max: box.max };
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

function applyHighlightMask(material: THREE.Material, zone: CarCoverageZone) {
  material.customProgramCacheKey = () => "xflow-highlight-zone";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uXflowZoneMin = {
      value: new THREE.Vector3(zone.minX, zone.minY, zone.minZ),
    };
    shader.uniforms.uXflowZoneMax = {
      value: new THREE.Vector3(zone.maxX, zone.maxY, zone.maxZ),
    };
    shader.uniforms.uXflowMinNormalY = { value: zone.minNormalY };

    shader.vertexShader = ZONE_VERTEX_DECL + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      vXflowWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      vXflowWorldNormal = normalize(mat3(modelMatrix) * normal);`
    );

    shader.fragmentShader = ZONE_FRAGMENT_DECL + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `void main() {
      if (!xflowInZone(vXflowWorldPos, vXflowWorldNormal)) discard;`
    );
  };
  material.needsUpdate = true;
}

function createHighlightMaterial(zone: CarCoverageZone | null) {
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color("#d3a548"),
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  material.userData.xflowCreated = true;
  if (zone) applyHighlightMask(material, zone);
  return material;
}

function addOverlay(
  target: THREE.Mesh,
  material: THREE.Material,
  partId: string,
  renderOrder: number
) {
  const overlay = new THREE.Mesh(target.geometry, material);
  overlay.name = `${target.name}-${partId}`;
  overlay.userData.xflowPartId = partId;
  overlay.userData.xflowPartIds = [partId];
  overlay.castShadow = false;
  overlay.receiveShadow = false;
  overlay.renderOrder = renderOrder;
  target.add(overlay);
  return overlay;
}

/** Aplica os materiais da película conforme a estratégia do modelo */
function applyModelMaterials(
  root: THREE.Object3D,
  def: CarModelDef,
  film: CarStudioFilm,
  coverage: CarCoverage,
  partColors: Record<string, string>,
  selectedPart: string | null,
  bounds: THREE.Box3
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

  const boundsData = carBounds(bounds);
  const coverageZone =
    coverage !== "full" ? resolveCoverageZone(coverage, boundsData) : null;

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
    mesh.receiveShadow = true;

    const isArray = Array.isArray(mesh.material);
    const sources: THREE.Material[] = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const partIds = sources.map(
      (material) => classifyPart(mesh.name, material?.name ?? "", def).id
    );
    mesh.userData.xflowPartIds = partIds;
    mesh.userData.xflowPartId = partIds[0];

    if (partIds.includes("paint")) {
      bodyTargets.push(mesh);
      return;
    }

    const finalMaterials = sources.map((source, index) => {
      const partId = partIds[index];
      const partColor = partColors[partId];
      const highlighted = selectedPart === partId;
      let base = source;
      if (!def.preserveMaterials) {
        if (partId === "glass") base = glassMat;
        else if (partId === "trim" || partId === "wheels") base = metalMat;
      }
      if (!partColor && !highlighted) return base;
      return clonePartMaterial(base, partColor ?? null, highlighted && !partColor);
    });

    mesh.material = isArray ? finalMaterials : finalMaterials[0];
  });

  const bodyFilm = partColors.paint
    ? solidPaintFilm(film, partColors.paint)
    : film;

  // PPF transparente: mantém a pintura e as riscas de fábrica do GLB.
  // Integral ajusta o brilho de toda a chapa; parcial altera só a zona.
  if (bodyFilm.transparent) {
    const params = carPaintParams(
      bodyFilm.finishOverride,
      bodyFilm.glossGu,
      bodyFilm.metallic ?? 0
    );
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
        if (coverageZone) {
          if ("roughness" in mat) {
            const physical = mat as THREE.MeshPhysicalMaterial;
            const originalClearcoat = physical.clearcoat ?? 0;
            const originalClearcoatRoughness =
              physical.clearcoatRoughness ?? 0.0525;
            physical.clearcoat = 1;
            applyCoverageMask(mat, coverageZone, params.roughness, {
              target: params.clearcoat,
              roughness: params.clearcoatRoughness,
              original: originalClearcoat,
              originalRoughness: originalClearcoatRoughness,
            });
          }
          return mat;
        }
        if ("roughness" in mat)
          (mat as THREE.MeshStandardMaterial).roughness = params.roughness;
        if ("clearcoat" in mat) {
          const physical = mat as THREE.MeshPhysicalMaterial;
          physical.clearcoat = params.clearcoat;
          physical.clearcoatRoughness = params.clearcoatRoughness;
        }
        if ("envMapIntensity" in mat) {
          (mat as THREE.MeshStandardMaterial).envMapIntensity =
            params.envMapIntensity;
        }
        return mat;
      });
      mesh.material = isArray ? cloned : cloned[0];
    }
  } else if (coverageZone) {
    // Película opaca parcial: mantém a pintura de fábrica e acrescenta uma
    // segunda camada com a cor da película, recortada pela zona escolhida.
    const overlayMat = filmPaintMaterial(bodyFilm);
    overlayMat.polygonOffset = true;
    overlayMat.polygonOffsetFactor = -2;
    overlayMat.polygonOffsetUnits = -2;
    overlayMat.userData.xflowCreated = true;
    applyCoverageMask(overlayMat, coverageZone);

    for (const mesh of bodyTargets) {
      addOverlay(mesh, overlayMat, "paint", 1);
    }
  } else {
    const paintMat = filmPaintMaterial(bodyFilm);
    paintMat.userData.xflowCreated = true;
    for (const mesh of bodyTargets) mesh.material = paintMat;
  }

  BODY_PANEL_DEFS.forEach((panel, index) => {
    const color = partColors[panel.id];
    const highlighted = selectedPart === panel.id;
    if (!color && !highlighted) return;
    const zone = resolvePanelZone(panel.id, boundsData);
    if (!zone) return;

    let material: THREE.Material;
    if (color) {
      material = filmPaintMaterial(solidPaintFilm(film, color));
      material.userData.xflowCreated = true;
      applyCoverageMask(material, zone);
    } else {
      material = createHighlightMaterial(zone);
    }
    material.polygonOffset = true;
    material.polygonOffsetFactor = -(2 + index);
    material.polygonOffsetUnits = -(2 + index);

    for (const mesh of bodyTargets) {
      addOverlay(mesh, material, panel.id, 1 + index);
    }
  });

  if (selectedPart === "paint" && !partColors.paint) {
    const material = createHighlightMaterial(null);
    for (const mesh of bodyTargets) {
      addOverlay(mesh, material, "paint", 20);
    }
  }
}

function Car({
  def,
  film,
  coverage,
  partColors,
  selectedPart,
  onSelectPart,
  onParts,
}: {
  def: CarModelDef;
  film: CarStudioFilm;
  coverage: CarCoverage;
  partColors: Record<string, string>;
  selectedPart: string | null;
  onSelectPart: (partId: string) => void;
  onParts: (parts: CarPartDef[]) => void;
}) {
  const { scene } = useGLTF(def.url);

  const car = useMemo(() => {
    const root = scene.clone(true);

    if (def.rotation) root.rotation.set(...def.rotation);

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

    const finalBox = new THREE.Box3().setFromObject(root);
    const parts = collectCarParts(root, def);
    applyModelMaterials(
      root,
      def,
      film,
      coverage,
      partColors,
      selectedPart,
      finalBox
    );

    return { root, box: finalBox, parts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, def, coverage, film.colorHex, film.glossGu, film.metallic, film.transparent, film.textureEffect, film.name, film.finishOverride, partColors, selectedPart]);

  React.useEffect(() => {
    onParts(car.parts);
  }, [car.parts, onParts]);

  // R3F não destrói <primitive>; liberta apenas os materiais criados aqui,
  // mantendo intactas as geometrias e texturas do GLB em cache.
  React.useEffect(() => {
    return () => {
      car.root.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m.userData.xflowCreated) m.dispose();
        }
      });
    };
  }, [car.root]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    const delta = (event as unknown as { delta?: number }).delta ?? 0;
    if (delta > 6) return;

    const mesh = event.object as THREE.Mesh;
    const materialIndex = event.face?.materialIndex ?? 0;
    const partIds = mesh.userData.xflowPartIds as string[] | undefined;
    let partId =
      partIds?.[materialIndex] ??
      (mesh.userData.xflowPartId as string | undefined);
    if (!partId) return;

    if (partId === "paint") {
      const panel = panelAtPoint(event.point, carBounds(car.box));
      if (panel) partId = panel;
    }

    event.stopPropagation();
    onSelectPart(partId);
  };

  return <primitive object={car.root} onClick={handleClick} />;
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
  const { camera, controls, size } = useThree();
  const fit =
    size.width < COMPACT_VIEWPORT_WIDTH
      ? Math.min(
          MOBILE_CAMERA_MAX_FIT,
          Math.max(
            MOBILE_CAMERA_FIT,
            (MOBILE_CAMERA_FIT * MOBILE_CAMERA_REFERENCE_WIDTH) /
              Math.max(size.width, 1)
          )
        )
      : 1;
  const desired = useMemo(() => {
    const [x, y, z] = CAMERA_POSITIONS[preset];
    return new THREE.Vector3(x, y, z)
      .sub(ORBIT_TARGET)
      .multiplyScalar(zoom * fit)
      .add(ORBIT_TARGET);
  }, [preset, zoom, fit]);
  const wants = useRef(false);

  React.useEffect(() => {
    wants.current = true;
  }, [preset, zoom, fit]);

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

function PartRow({
  part,
  active,
  swatch,
  onSelect,
}: {
  part: CarPartDef;
  active: boolean;
  swatch: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      title={part.label}
      className={`flex w-full items-center gap-1.5 rounded border px-1.5 py-1 text-left transition-colors cursor-pointer ${
        active
          ? "border-[#d3a548]/70 bg-[#d3a548]/15"
          : "border-transparent hover:border-white/15 hover:bg-white/[0.04]"
      }`}
    >
      <span
        className={`h-3 w-3 shrink-0 rounded-full border ${
          swatch ? "border-white/25" : "border-dashed border-white/30"
        }`}
        style={swatch ? { backgroundColor: swatch } : undefined}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-[#d7dbdc]">
        {part.label}
      </span>
    </button>
  );
}

export function CarStudio3D({ film }: { film: CarStudioFilm }) {
  const [modelId, setModelId] = useState(DEFAULT_CAR_MODEL_ID);
  const [preset, setPreset] = useState<CameraPreset>("threeQuarter");
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [coverage, setCoverage] = useState<CarCoverage>("full");
  const [partColors, setPartColors] = useState<Record<string, string>>({});
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [parts, setParts] = useState<CarPartDef[]>([]);
  const [partsOpen, setPartsOpen] = useState(true);
  const [environmentId, setEnvironmentId] = useState(DEFAULT_ENVIRONMENT_ID);
  const [renderedEnvironmentId, setRenderedEnvironmentId] =
    useState<EnvironmentId>(DEFAULT_ENVIRONMENT_ID);
  const [environmentChanging, setEnvironmentChanging] = useState(false);
  const environmentTimer = useRef<number | null>(null);
  const environment = findEnvironment(renderedEnvironmentId);
  const dprRange = useMemo<[number, number]>(
    () => [1, environment.quality.dprMax],
    [environment.quality.dprMax]
  );
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRailRef = useRef<HTMLDivElement | null>(null);
  const [modelRailEdges, setModelRailEdges] = useState({
    start: true,
    end: false,
  });
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
  const selectedPartDef =
    parts.find((part) => part.id === selectedPart) ?? null;
  const currentPartColor = selectedPart ? partColors[selectedPart] : undefined;
  const selectedColorValue =
    currentPartColor ??
    (selectedPartDef &&
    (selectedPartDef.id === "paint" || selectedPartDef.kind === "panel")
      ? film.colorHex
      : "#d3a548");
  const componentParts = parts.filter((part) => part.kind !== "panel");
  const panelParts = parts.filter((part) => part.kind === "panel");

  const handleSelectPart = React.useCallback((partId: string) => {
    setAutoRotate(false);
    setSelectedPart(partId);
  }, []);

  const applyPartColor = (color: string | null) => {
    if (!selectedPart) return;
    setPartColors((colors) => {
      const next = { ...colors };
      if (color) next[selectedPart] = color;
      else delete next[selectedPart];
      return next;
    });
  };

  const updateModelRailEdges = React.useCallback(() => {
    const rail = modelRailRef.current;
    if (!rail) return;
    const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setModelRailEdges({
      start: rail.scrollLeft <= 2,
      end: rail.scrollLeft >= max - 2,
    });
  }, []);

  React.useEffect(() => {
    const rail = modelRailRef.current;
    if (!rail) return;
    updateModelRailEdges();
    const observer = new ResizeObserver(updateModelRailEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [updateModelRailEdges]);

  React.useEffect(() => {
    updateModelRailEdges();
  }, [modelId, updateModelRailEdges]);

  React.useEffect(() => {
    return () => {
      if (environmentTimer.current !== null) {
        window.clearTimeout(environmentTimer.current);
      }
    };
  }, []);

  const changeEnvironment = (id: EnvironmentId) => {
    if (id === environmentId) return;

    // Voltar ao cenário já renderizado enquanto outro bake está pendente não
    // deve escurecer o palco sem qualquer mudança visual.
    if (id === renderedEnvironmentId) {
      if (environmentTimer.current !== null) {
        window.clearTimeout(environmentTimer.current);
        environmentTimer.current = null;
      }
      setEnvironmentId(id);
      setEnvironmentChanging(false);
      return;
    }

    setEnvironmentId(id);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (environmentTimer.current !== null) {
        window.clearTimeout(environmentTimer.current);
        environmentTimer.current = null;
      }
      setRenderedEnvironmentId(id);
      setEnvironmentChanging(false);
      return;
    }

    setEnvironmentChanging(true);
    if (environmentTimer.current !== null) {
      window.clearTimeout(environmentTimer.current);
    }
    // O bake do novo environment map acontece sob o overlay para não haver flash.
    environmentTimer.current = window.setTimeout(() => {
      setRenderedEnvironmentId(id);
      setEnvironmentChanging(false);
      environmentTimer.current = null;
    }, 150);
  };

  const scrollModels = (direction: -1 | 1) => {
    const rail = modelRailRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.max(140, rail.clientWidth * 0.8),
    });
    updateModelRailEdges();
  };

  const capture = () => {
    const gl = glRef.current;
    if (!gl) return;
    const source = gl.domElement;
    const out = document.createElement("canvas");
    out.width = source.width;
    out.height = source.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = environment.captureBackground;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0);

    // CC BY: a imagem exportada leva a atribuição do modelo e da película.
    const pad = Math.round(out.width * 0.012);
    const fontSize = Math.max(12, Math.round(out.width * 0.012));
    const lineHeight = Math.round(fontSize * 1.35);
    const barHeight = Math.round(fontSize * 2.2 + lineHeight);
    ctx.fillStyle = "rgba(5,6,6,0.88)";
    ctx.fillRect(0, out.height - barHeight, out.width, barHeight);
    ctx.font = `${fontSize}px ui-monospace, monospace`;
    ctx.textBaseline = "middle";
    const maxWidth = out.width - pad * 2;
    const attribution = def.credit
      ? `${def.brand} · ${def.credit.author} · ${def.credit.license}`
      : `${def.brand} · ${def.label}`;
    const coverageText = coverageLabel ? ` · ${coverageLabel}` : "";
    const vehicleName = def.label.startsWith(def.brand)
      ? def.label
      : `${def.brand} ${def.label}`;
    const vehicleLine = `${vehicleName} · ${film.name}${coverageText}`;
    const contextLine = `${environment.name} · ${attribution}`;
    const firstBaseline = out.height - barHeight + fontSize * 1.1;

    ctx.fillStyle = "#d7dbdc";
    ctx.fillText(fitText(ctx, vehicleLine, maxWidth), pad, firstBaseline);
    ctx.fillStyle = "#a9adae";
    ctx.fillText(
      fitText(ctx, contextLine, maxWidth),
      pad,
      firstBaseline + lineHeight
    );

    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `xflow-3d-${environment.id}-${film.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.png`;
    a.click();
  };

  const changeZoom = (delta: number) => {
    setAutoRotate(false);
    setZoom((value) => Math.min(1.6, Math.max(0.62, value + delta)));
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows={environment.quality.shadows ? "percentage" : false}
        dpr={dprRange}
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
          <Car
            key={def.id}
            def={def}
            film={film}
            coverage={effectiveCoverage}
            partColors={partColors}
            selectedPart={selectedPart}
            onSelectPart={handleSelectPart}
            onParts={setParts}
          />

          <EnvironmentStage key={environment.id} environment={environment} />

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

      <div
        aria-hidden="true"
        style={{
          backgroundColor: findEnvironment(environmentId).captureBackground,
        }}
        className={`pointer-events-none absolute inset-0 z-30 transition-opacity duration-150 motion-reduce:transition-none ${
          environmentChanging ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="absolute top-2 left-2 z-20 flex w-[10.5rem] flex-col gap-1.5">
        <label className="relative flex w-full items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#050606]/85 py-1.5 pl-2.5 pr-7 backdrop-blur-md">
          <Camera
            className="h-3 w-3 shrink-0 text-[#d3a548]"
            aria-hidden="true"
          />
          <span className="sr-only">Câmara</span>
          <select
            value={preset}
            onChange={(event) => {
              setAutoRotate(false);
              setZoom(1);
              setPreset(event.target.value as CameraPreset);
            }}
            aria-label="Câmara"
            title={
              CAMERA_LABELS.find(({ key }) => key === preset)?.label ?? "Câmara"
            }
            className="min-w-0 flex-1 appearance-none truncate bg-transparent text-[10px] font-bold uppercase tracking-wide text-[#d7dbdc] outline-none focus-visible:ring-2 focus-visible:ring-[#d3a548]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050606]"
          >
            {CAMERA_LABELS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 h-3 w-3 text-[#8a9092]"
            aria-hidden="true"
          />
        </label>

        <EnvironmentSelector
          value={environmentId}
          onChange={changeEnvironment}
          busy={environmentChanging}
        />

        <button
          type="button"
          onClick={() => setPartsOpen((value) => !value)}
          aria-pressed={partsOpen}
          title="Pintura por peça"
          className={`flex w-full items-center gap-1.5 rounded-md border py-1.5 pl-2.5 pr-2 text-left backdrop-blur-md transition-colors cursor-pointer ${
            partsOpen
              ? "border-[#d3a548]/70 bg-[#d3a548]/15 text-[#f1ede5]"
              : "border-white/[0.08] bg-[#050606]/85 text-[#d7dbdc] hover:border-white/25"
          }`}
        >
          <Palette
            className="h-3 w-3 shrink-0 text-[#d3a548]"
            aria-hidden="true"
          />
          <span className="flex-1 text-[10px] font-bold uppercase tracking-wide">
            Peças
          </span>
          <span className="font-mono text-[9px] text-[#8a9092]">
            {parts.length}
          </span>
        </button>
      </div>

      {partsOpen && (
        <div
          className="absolute right-2 top-2 z-20 flex h-[calc(100%-1rem)] w-[13rem] flex-col overflow-hidden rounded-md border border-white/[0.08] bg-[#050606]/90 backdrop-blur-md"
          role="group"
          aria-label="Pintura por peça"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-2.5 py-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#d7dbdc]">
              Peças
            </span>
            <span className="font-mono text-[9px] text-[#8a9092]">
              {parts.length}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5 [scrollbar-width:thin]">
            <p className="px-1 pb-1 text-[9px] font-mono uppercase tracking-wider text-[#747a7c]">
              Clicar no carro
            </p>
            <div className="flex flex-col gap-0.5">
              {componentParts.map((part) => (
                <PartRow
                  key={part.id}
                  part={part}
                  active={selectedPart === part.id}
                  swatch={partSwatchColor(part, partColors, film.colorHex)}
                  onSelect={() => handleSelectPart(part.id)}
                />
              ))}
            </div>

            {panelParts.length > 0 && (
              <>
                <p className="px-1 pb-1 pt-2 text-[9px] font-mono uppercase tracking-wider text-[#747a7c]">
                  Painéis
                </p>
                <div className="flex flex-col gap-0.5">
                  {panelParts.map((part) => (
                    <PartRow
                      key={part.id}
                      part={part}
                      active={selectedPart === part.id}
                      swatch={partSwatchColor(part, partColors, film.colorHex)}
                      onSelect={() => handleSelectPart(part.id)}
                    />
                  ))}
                </div>
              </>
            )}

            {parts.length === 0 && (
              <p className="px-1 py-2 text-[10px] text-[#8a9092]">
                a carregar peças…
              </p>
            )}
          </div>

          {selectedPartDef && selectedPart && (
            <div className="shrink-0 border-t border-white/[0.06] p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[10px] font-bold text-[#f1ede5]">
                  {selectedPartDef.label}
                </span>
                <button
                  type="button"
                  onClick={() => applyPartColor(null)}
                  className="shrink-0 rounded p-1 text-[#a9adae] transition-colors cursor-pointer hover:text-[#d3a548]"
                  title="Repor original"
                  aria-label={`Repor ${selectedPartDef.label}`}
                >
                  <Eraser className="h-3 w-3" />
                </button>
              </div>

              <label className="mt-1.5 flex items-center gap-2 rounded border border-white/[0.08] bg-black/30 px-1.5 py-1">
                <Palette
                  className="h-3 w-3 text-[#d3a548]"
                  aria-hidden="true"
                />
                <span className="text-[9px] uppercase tracking-wider text-[#8a9092]">
                  Cor
                </span>
                <input
                  type="color"
                  value={selectedColorValue}
                  onChange={(event) => applyPartColor(event.target.value)}
                  aria-label={`Cor de ${selectedPartDef.label}`}
                  className="ml-auto h-5 w-8 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                />
              </label>

              <div className="mt-1.5 flex flex-wrap gap-1">
                {PART_COLOR_PRESETS.map((preset) => {
                  const active = preset.color
                    ? currentPartColor?.toLowerCase() === preset.color.toLowerCase()
                    : !currentPartColor;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPartColor(preset.color)}
                      aria-pressed={active}
                      title={preset.label}
                      aria-label={preset.label}
                      className={`flex h-5 w-5 items-center justify-center rounded-full border transition-transform cursor-pointer hover:scale-110 ${
                        active
                          ? "border-[#d3a548] ring-1 ring-[#d3a548]"
                          : "border-white/20"
                      }`}
                      style={
                        preset.color
                          ? { backgroundColor: preset.color }
                          : {
                              background:
                                "linear-gradient(135deg, #d3a548 0%, #121416 100%)",
                            }
                      }
                    >
                      {!preset.color && (
                        <Eraser className="h-2.5 w-2.5 text-[#050606]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zona de aplicação — só nos modelos com wrap parcial */}
      {def.supportsPartialWrap && (
        <div
          className="absolute bottom-[6.1rem] sm:bottom-[6.5rem] xl:bottom-[5.5rem] left-2 sm:left-3 right-2 sm:right-40 xl:right-auto flex items-center gap-1 z-10 overflow-x-auto [mask-image:linear-gradient(to_right,black_82%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

      {/* Seletor de modelo — carril horizontal com setas para não sobrepor nem esconder opções */}
      <div className="absolute bottom-[4.25rem] left-2 right-2 sm:left-3 xl:bottom-7 xl:right-40 flex items-center gap-1 z-10">
        <button
          type="button"
          onClick={() => scrollModels(-1)}
          disabled={modelRailEdges.start}
          className="shrink-0 rounded-full border border-white/[0.08] bg-[#050606]/85 p-1.5 text-[#a9adae] transition-all cursor-pointer hover:border-white/25 disabled:opacity-30 disabled:cursor-default"
          title="Modelos anteriores"
          aria-label="Modelos anteriores"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <div
          ref={modelRailRef}
          onScroll={updateModelRailEdges}
          className="flex min-w-0 flex-1 flex-nowrap gap-1.5 overflow-x-auto [mask-image:linear-gradient(to_right,black_88%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Modelos de viatura"
        >
          {CAR_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setModelId(m.id);
                setZoom(1);
                setPartColors({});
                setSelectedPart(null);
                setParts([]);
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
        <button
          type="button"
          onClick={() => scrollModels(1)}
          disabled={modelRailEdges.end}
          className="shrink-0 rounded-full border border-white/[0.08] bg-[#050606]/85 p-1.5 text-[#a9adae] transition-all cursor-pointer hover:border-white/25 disabled:opacity-30 disabled:cursor-default"
          title="Modelos seguintes"
          aria-label="Modelos seguintes"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
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
