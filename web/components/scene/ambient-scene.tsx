"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function ParticleField() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 600;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 6 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.025;
    ref.current.rotation.x = t * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d97757"
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

function Wireframe() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.04;
    meshRef.current.rotation.y = t * 0.05;
  });
  return (
    <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.2}>
      <mesh ref={meshRef} scale={3.4}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#d97757"
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>
    </Float>
  );
}

export function AmbientScene() {
  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 7], fov: 50 }}
      >
        <ambientLight intensity={0.3} />
        <Wireframe />
        <ParticleField />
        <Environment preset="night" />
      </Canvas>
      {/* Bottom fade so the scene melts into the page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, transparent 55%, var(--bg) 100%)",
        }}
      />
    </div>
  );
}
