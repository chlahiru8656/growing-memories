import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Wind-animated branches ─────────────────────────────────────────────
export function WindEffect({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle swaying
      groupRef.current.rotation.z = Math.sin(t * 0.4) * 0.015 + Math.sin(t * 1.1) * 0.008;
      groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.01;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// ─── Falling leaves particle system ─────────────────────────────────────
export function FallingLeaves({ count = 20, bounds = 4, season }: { count?: number; bounds?: number; season?: string }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * bounds * 2,
      y: Math.random() * 5 + 2,
      z: (Math.random() - 0.5) * bounds * 2,
      speed: 0.2 + Math.random() * 0.3,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
      rotSpeed: (Math.random() - 0.5) * 2,
      scale: 0.03 + Math.random() * 0.04,
    }));
  }, [count, bounds]);

  const leafColor = useMemo(() => {
    switch (season) {
      case 'Autumn': return '#d97706';
      case 'Spring': return '#4ade80';
      case 'Winter': return '#94a3b8';
      default: return '#22c55e';
    }
  }, [season]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    particles.forEach((p, i) => {
      // Fall down, reset when below ground
      p.y -= p.speed * 0.016;
      if (p.y < -2.5) {
        p.y = 4 + Math.random() * 2;
        p.x = (Math.random() - 0.5) * bounds * 2;
        p.z = (Math.random() - 0.5) * bounds * 2;
      }

      const wobbleX = Math.sin(t * p.wobbleSpeed + p.wobble) * 0.5;
      const wobbleZ = Math.cos(t * p.wobbleSpeed * 0.7 + p.wobble) * 0.3;

      dummy.position.set(p.x + wobbleX, p.y, p.z + wobbleZ);
      dummy.rotation.set(t * p.rotSpeed * 0.5, t * p.rotSpeed, Math.sin(t + i) * 0.5);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1.4]} />
      <meshStandardMaterial
        color={leafColor}
        side={THREE.DoubleSide}
        roughness={0.8}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

// ─── Day/Night cycle based on real time ─────────────────────────────────
export function useDayNightCycle() {
  const hour = new Date().getHours();

  // 6-18 is day, transition at edges
  const isDawn = hour >= 5 && hour < 7;
  const isDay = hour >= 7 && hour < 17;
  const isDusk = hour >= 17 && hour < 19;
  const isNight = hour >= 19 || hour < 5;

  if (isDawn) {
    return {
      ambientIntensity: 0.4,
      directionalIntensity: 0.6,
      ambientColor: '#ffa07a',
      directionalColor: '#ff8c69',
      fogColor: '#2a1f3d',
      skyColor: '#4a3060',
      label: 'Dawn',
    };
  }
  if (isDay) {
    return {
      ambientIntensity: 0.7,
      directionalIntensity: 1.0,
      ambientColor: '#ffffff',
      directionalColor: '#fff5e0',
      fogColor: '#1a2e1a',
      skyColor: '#87ceeb',
      label: 'Day',
    };
  }
  if (isDusk) {
    return {
      ambientIntensity: 0.4,
      directionalIntensity: 0.5,
      ambientColor: '#ff7043',
      directionalColor: '#ff5722',
      fogColor: '#2d1b3d',
      skyColor: '#6a3078',
      label: 'Dusk',
    };
  }
  // Night
  return {
    ambientIntensity: 0.15,
    directionalIntensity: 0.2,
    ambientColor: '#4a6fa5',
    directionalColor: '#7b9bc7',
    fogColor: '#0a0f1a',
    skyColor: '#0d1117',
    label: 'Night',
  };
}
