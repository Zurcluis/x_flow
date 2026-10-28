"use client";

import { Environment, Lightformer } from "@react-three/drei";

import { EnvironmentMapDisposer } from "./EnvironmentMapDisposer";

export function StudioDarkEnv({ resolution }: { resolution: number }) {
  return (
    <>
      <Environment resolution={resolution}>
        <Lightformer
          intensity={2.2}
          position={[0, 5, 0]}
          rotation-x={Math.PI / 2}
          scale={[9, 9, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.4}
          position={[4, 2.2, 2]}
          rotation-y={-Math.PI / 3}
          scale={[6, 2.4, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.1}
          position={[-4.5, 2, -1.5]}
          rotation-y={Math.PI / 2.4}
          scale={[7, 2.2, 1]}
          color="#e8f0ff"
        />
        <Lightformer
          intensity={0.9}
          position={[0, 1.6, -6]}
          scale={[8, 2, 1]}
          color="#fff4e0"
        />
        <Lightformer
          intensity={0.7}
          position={[0, 1.4, 6]}
          rotation-y={Math.PI}
          scale={[8, 2, 1]}
          color="#dfe8ff"
        />
      </Environment>
      <EnvironmentMapDisposer resolution={resolution} />
    </>
  );
}
