"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function SlowGeometry() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.06;
    meshRef.current.rotation.y = t * 0.08;
  });

  return (
    <Float speed={0.6} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} scale={2.4}>
        <icosahedronGeometry args={[1, 1]} />
        <MeshTransmissionMaterial
          color="#d4a24c"
          thickness={1.4}
          chromaticAberration={0.06}
          anisotropy={0.5}
          distortion={0.3}
          distortionScale={0.4}
          temporalDistortion={0.04}
          ior={1.4}
          backside
          roughness={0.35}
          metalness={0.1}
        />
      </mesh>
    </Float>
  );
}

export function AmbientScene() {
  return (
    <div className="absolute inset-0 -z-10 opacity-50 pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[3, 4, 5]}
          intensity={1.4}
          color="#e8b65a"
        />
        <directionalLight
          position={[-4, -2, 3]}
          intensity={0.6}
          color="#8a6a2e"
        />
        <SlowGeometry />
        <Environment preset="warehouse" />
      </Canvas>
      {/* Heavy gaussian blur over the whole scene to keep it ambient */}
      <div
        className="absolute inset-0 backdrop-blur-3xl"
        style={{ background: "linear-gradient(180deg, transparent, rgba(10,9,8,0.55))" }}
      />
    </div>
  );
}
