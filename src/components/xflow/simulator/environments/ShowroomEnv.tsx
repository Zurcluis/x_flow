"use client";

import { Environment, Lightformer } from "@react-three/drei";

import { EnvironmentMapDisposer } from "./EnvironmentMapDisposer";

export function ShowroomEnv({ resolution }: { resolution: number }) {
  return (
    <>
      <ambientLight intensity={0.55} color="#f4f7fa" />
      <directionalLight position={[4, 6, 6]} intensity={0.9} color="#ffffff" />
      <directionalLight
        position={[-5, 3, -4]}
        intensity={0.35}
        color="#dfe8ff"
      />

      <mesh
        position={[0, -0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <circleGeometry args={[9, 96]} />
        <meshStandardMaterial
          color="#e7ebee"
          roughness={0.28}
          metalness={0.08}
          envMapIntensity={0.9}
        />
      </mesh>

      <Environment resolution={resolution}>
        <Lightformer
          intensity={2.4}
          position={[0, 6, 0]}
          rotation-x={Math.PI / 2}
          scale={[12, 12, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={1.2}
          position={[5, 3, 4]}
          rotation-y={-Math.PI / 3}
          scale={[8, 3, 1]}
          color="#ffffff"
        />
        <Lightformer
          intensity={0.9}
          position={[-5, 2.5, -3]}
          rotation-y={Math.PI / 3}
          scale={[8, 3, 1]}
          color="#eef4ff"
        />
        <Lightformer
          intensity={0.7}
          position={[0, 2, -8]}
          scale={[12, 4, 1]}
          color="#f8fbff"
        />
        <Lightformer
          intensity={0.6}
          position={[0, 2, 8]}
          rotation-y={Math.PI}
          scale={[12, 4, 1]}
          color="#f8fbff"
        />
      </Environment>
      <EnvironmentMapDisposer resolution={resolution} />
    </>
  );
}
