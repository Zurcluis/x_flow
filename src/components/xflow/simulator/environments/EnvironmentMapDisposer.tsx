"use client";

import React from "react";
import type { Texture } from "three";
import { useThree } from "@react-three/fiber";

/**
 * O `<Environment>` do drei liberta o render target do cubemap, mas não a
 * textura PMREM gerada pelo three. Sem este dispose, cada troca de cenário
 * deixa um PMREM na GPU. Montar depois do `<Environment>` garante que a
 * textura capturada já é a nova; `resolution` acompanha o re-bake.
 */
export function EnvironmentMapDisposer({
  resolution,
}: {
  resolution: number;
}) {
  const { scene } = useThree();

  React.useEffect(() => {
    const texture: Texture | null = scene.environment;
    return () => {
      texture?.dispose();
    };
  }, [scene, resolution]);

  return null;
}
