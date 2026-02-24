import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Memory, Season, getSeason, getYear, isBirthdayToday, isTreeHealthy } from '@/types/memory';
import { LeafNode } from './LeafNode';
import { getSeasonTheme, SeasonTheme } from '@/lib/seasonTheme';

interface MemoryTree3DProps {
  memories: Memory[];
  onLeafClick?: (memory: Memory) => void;
  userAge?: number;
  userBirthdate?: string;
}

const SEASON_CONFIG: Record<Season, { color: string; label: string; emoji: string }> = {
  Spring: { color: '#4ade80', label: 'Spring', emoji: '🌸' },
  Summer: { color: '#84cc16', label: 'Summer', emoji: '☀️' },
  Autumn: { color: '#f59e0b', label: 'Autumn', emoji: '🍂' },
  Winter: { color: '#93c5fd', label: 'Winter', emoji: '❄️' },
};

const SEASON_ORDER: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

interface SeasonGroup { season: Season; memories: Memory[]; }
interface YearGroup { year: number; seasons: SeasonGroup[]; totalMemories: number; }

function groupMemories(memories: Memory[]): YearGroup[] {
  const byYear: Record<number, Record<Season, Memory[]>> = {};
  for (const m of memories) {
    const y = getYear(m.memoryDate);
    const s = getSeason(m.memoryDate);
    if (!byYear[y]) byYear[y] = { Spring: [], Summer: [], Autumn: [], Winter: [] };
    byYear[y][s].push(m);
  }
  return Object.entries(byYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, seasons]) => ({
      year: Number(year),
      seasons: SEASON_ORDER
        .filter((s) => seasons[s].length > 0)
        .map((s) => ({ season: s, memories: seasons[s] })),
      totalMemories: Object.values(seasons).flat().length,
    }));
}

// ─── Realistic trunk with bark texture ───────────────────────────────────
function Trunk({ height }: { height: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector2[] = [];
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Organic taper with slight bulge at base
      const bulge = Math.sin(t * Math.PI) * 0.03;
      const radius = 0.22 * (1 - t * 0.55) + bulge;
      const y = t * height;
      points.push(new THREE.Vector2(radius, y));
    }
    return new THREE.LatheGeometry(points, 16);
  }, [height]);

  return (
    <mesh geometry={geometry} position={[0, -height / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial
        color="#5a3d1a"
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}

// ─── Decorative foliage cluster (always visible) ─────────────────────────
function FoliageCluster({ position, scale = 1, color = '#2d6b2f' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
      const s = scale * (1 + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02);
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <dodecahedronGeometry args={[0.35 * scale, 1]} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.05}
        flatShading
      />
    </mesh>
  );
}

// ─── Sprout at tree top ──────────────────────────────────────────────────
function Sprout({ y }: { y: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04;
      groupRef.current.scale.set(s, s, s);
    }
  });

  const leafShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.06, 0.08, 0.04, 0.2, 0, 0.3);
    shape.bezierCurveTo(-0.04, 0.2, -0.06, 0.08, 0, 0);
    return shape;
  }, []);

  const leafGeo = useMemo(() => new THREE.ShapeGeometry(leafShape), [leafShape]);

  return (
    <group ref={groupRef} position={[0, y, 0]}>
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const tiltAngle = -0.4 - i * 0.08;
        return (
          <group key={i} rotation={[0, rad, 0]}>
            <mesh geometry={leafGeo} position={[0, 0.05, 0.04]} rotation={[tiltAngle, 0, 0]}>
              <meshStandardMaterial
                color={i % 2 === 0 ? '#22c55e' : '#16a34a'}
                roughness={0.5}
                metalness={0.05}
                side={THREE.DoubleSide}
                emissive="#22c55e"
                emissiveIntensity={0.15}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── Branch mesh ─────────────────────────────────────────────────────────
function Branch({ start, end, thickness, color }: { start: THREE.Vector3; end: THREE.Vector3; thickness: number; color: string }) {
  const midPoint = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 0.15;
    return mid;
  }, [start, end]);

  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(start, midPoint, end), [start, midPoint, end]);
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 12, thickness, 8, false), [curve, thickness]);

  return (
    <mesh geometry={tubeGeo} castShadow>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ─── Vine collection ─────────────────────────────────────────────────────
function VineCollection({ memory, startPos, onLeafClick, side, index }: {
  memory: Memory; startPos: THREE.Vector3; onLeafClick?: (m: Memory) => void; side: number; index: number;
}) {
  const vineLength = 0.5 + memory.imageUrls.length * 0.3;
  const endPos = useMemo(() => new THREE.Vector3(startPos.x + side * 0.15, startPos.y - vineLength, startPos.z), [startPos, vineLength, side]);
  const midPos = useMemo(() => new THREE.Vector3(startPos.x + side * 0.25, startPos.y - vineLength * 0.5, startPos.z + 0.1), [startPos, vineLength, side]);
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(startPos, midPos, endPos), [startPos, midPos, endPos]);
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 12, 0.012, 5, false), [curve]);
  const leafPositions = useMemo(() => memory.imageUrls.map((_, i) => {
    const t = (i + 1) / (memory.imageUrls.length + 1);
    return curve.getPointAt(t);
  }), [memory.imageUrls, curve]);

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color="#4ade80" roughness={0.7} metalness={0.05} transparent opacity={0.7} />
      </mesh>
      {memory.imageUrls.map((imgUrl, imgIdx) => {
        const pos = leafPositions[imgIdx];
        const vineLeafMem = { ...memory, imageUrl: imgUrl };
        return (
          <Html key={`${memory.id}-vine-${imgIdx}`} position={[pos.x, pos.y, pos.z]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible">
              <LeafNode memory={vineLeafMem} x={20} y={20} index={index + imgIdx} rotation={imgIdx % 2 === 0 ? -15 : 15} onClick={() => onLeafClick?.(memory)} isVineLeaf />
            </svg>
          </Html>
        );
      })}
    </group>
  );
}

// ─── Ground plane ────────────────────────────────────────────────────────
function Ground({ color }: { color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <circleGeometry args={[6, 48]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

// ─── Fireflies ───────────────────────────────────────────────────────────
function Fireflies3D({ count }: { count: number }) {
  const n = Math.min(count * 2, 12);
  const particles = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 4 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, [n]);

  useFrame((state) => {
    if (particles.current) {
      const posArr = particles.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < n; i++) {
        posArr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
        posArr[i * 3] += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.001;
      }
      particles.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (count === 0) return null;
  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={n} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ffffaa" size={0.05} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── Birthday blooms ─────────────────────────────────────────────────────
function BirthdayBlooms3D() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    angle: (i / 20) * Math.PI * 2,
    radius: 0.8 + (i % 3) * 0.4,
    speed: 1 + (i % 3) * 0.5,
    color: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#fbbf24' : '#a78bfa',
  })), []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        const t = state.clock.elapsedTime * p.speed;
        child.position.x = Math.cos(p.angle + t * 0.3) * p.radius;
        child.position.y = Math.sin(t) * 0.5 + 1;
        child.position.z = Math.sin(p.angle + t * 0.3) * p.radius;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[0, 1, 0]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial color={p.color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Scene content ───────────────────────────────────────────────────────
function TreeScene({ memories, onLeafClick, userAge = 0, userBirthdate, theme }: MemoryTree3DProps & { theme: SeasonTheme }) {
  const yearGroups = useMemo(() => groupMemories(memories), [memories]);
  const showBirthday = userBirthdate ? isBirthdayToday(userBirthdate) : false;
  const healthy = isTreeHealthy(memories);

  const trunkHeight = 3.5 + Math.min(userAge * 0.05, 1.5);
  const trunkTop = trunkHeight / 2;

  // Decorative foliage positions — always visible canopy
  const foliagePositions = useMemo(() => {
    const positions: { pos: [number, number, number]; scale: number; color: string }[] = [];
    const greens = ['#2d6b2f', '#1a5c1e', '#3a8f3e', '#276d29', '#1e7a22', '#4a9e4e'];
    // Top canopy cluster
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.3;
      positions.push({
        pos: [Math.cos(angle) * r, trunkTop - 0.2 + Math.random() * 0.4, Math.sin(angle) * r],
        scale: 0.8 + Math.random() * 0.5,
        color: greens[i % greens.length],
      });
    }
    // Mid-level foliage
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + 0.3;
      const r = 0.7 + Math.random() * 0.4;
      positions.push({
        pos: [Math.cos(angle) * r, trunkTop * 0.5 + Math.random() * 0.3, Math.sin(angle) * r],
        scale: 0.6 + Math.random() * 0.3,
        color: greens[(i + 3) % greens.length],
      });
    }
    return positions;
  }, [trunkTop]);

  // Demo branches (always visible structural branches)
  const demoBranches = useMemo(() => {
    const branches: { start: THREE.Vector3; end: THREE.Vector3; thickness: number }[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const yPos = -trunkHeight / 2 + trunkHeight * (0.35 + (i / count) * 0.45);
      const length = 0.8 + Math.random() * 0.5;
      branches.push({
        start: new THREE.Vector3(0, yPos, 0),
        end: new THREE.Vector3(Math.cos(angle) * length, yPos + 0.25, Math.sin(angle) * length),
        thickness: 0.03 + Math.random() * 0.015,
      });
    }
    return branches;
  }, [trunkHeight]);

  // Calculate 3D branch layouts for memory year groups
  const branchLayouts = useMemo(() => {
    const yearCount = yearGroups.length;
    return yearGroups.map((yg, idx) => {
      const baseAngle = yearCount <= 1 ? 0 : (idx / yearCount) * Math.PI * 2;
      const t = yearCount <= 1 ? 0.6 : 0.3 + (idx / Math.max(yearCount - 1, 1)) * 0.5;
      const branchY = -trunkHeight / 2 + trunkHeight * t;
      const branchLength = 1.2 + Math.min(yg.totalMemories * 0.08, 0.6);
      return {
        ...yg,
        baseAngle,
        branchY,
        branchLength,
        start: new THREE.Vector3(0, branchY, 0),
        end: new THREE.Vector3(Math.cos(baseAngle) * branchLength, branchY + 0.3, Math.sin(baseAngle) * branchLength),
      };
    });
  }, [yearGroups, trunkHeight]);

  return (
    <>
      {/* Lighting */}
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity * 1.2} />
      <directionalLight color={theme.directionalColor} intensity={theme.directionalIntensity * 1.3} position={[4, 6, 3]} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <pointLight color="#22c55e" intensity={0.5} position={[0, trunkTop + 0.5, 0]} distance={5} />
      <pointLight color="#fbbf24" intensity={0.2} position={[-2, 0, 2]} distance={6} />
      <hemisphereLight color="#87ceeb" groundColor="#3d2b1f" intensity={0.3} />

      <fog attach="fog" args={[theme.fogColor, 8, 18]} />

      <Ground color={theme.groundColor} />

      {/* Grass patches on ground */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 1.5 + Math.random() * 2;
        return (
          <mesh key={`grass-${i}`} position={[Math.cos(angle) * r, -2.45, Math.sin(angle) * r]} rotation={[-Math.PI / 2, 0, angle]}>
            <circleGeometry args={[0.15 + Math.random() * 0.1, 6]} />
            <meshStandardMaterial color="#2a5a2e" roughness={1} />
          </mesh>
        );
      })}

      <group>
        {/* Trunk */}
        <Trunk height={trunkHeight} />

        {/* Sprout at top */}
        <Sprout y={trunkTop} />

        {/* Decorative foliage canopy (always visible) */}
        {foliagePositions.map((f, i) => (
          <FoliageCluster key={`foliage-${i}`} position={f.pos} scale={f.scale} color={f.color} />
        ))}

        {/* Demo structural branches (always visible) */}
        {demoBranches.map((b, i) => (
          <Branch key={`demo-branch-${i}`} start={b.start} end={b.end} thickness={b.thickness} color="#6b4c30" />
        ))}

        {/* Small decorative leaves on demo branches */}
        {demoBranches.map((b, i) => (
          <mesh key={`demo-leaf-${i}`} position={[b.end.x * 1.05, b.end.y + 0.05, b.end.z * 1.05]}>
            <sphereGeometry args={[0.08 + Math.random() * 0.04, 8, 6]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#3a8f3e' : '#2d6b2f'} roughness={0.8} flatShading />
          </mesh>
        ))}

        {/* Age-scaled canopy glow */}
        {userAge > 0 && (
          <mesh position={[0, trunkTop - 0.3, 0]}>
            <sphereGeometry args={[0.5 + userAge * 0.015, 16, 12]} />
            <meshStandardMaterial color={healthy ? '#1a4a20' : '#3a3520'} transparent opacity={0.15} roughness={1} />
          </mesh>
        )}

        {/* Memory year branches + leaves */}
        {branchLayouts.map((yg, yi) => (
          <group key={yg.year}>
            <Branch start={yg.start} end={yg.end} thickness={0.04} color="#5a4530" />
            <Html position={[yg.end.x * 1.15, yg.end.y, yg.end.z * 1.15]} center>
              <span className="text-[10px] font-display italic text-foreground/70 whitespace-nowrap select-none pointer-events-none">{yg.year}</span>
            </Html>

            {yg.seasons.map((sg, si) => {
              const cfg = SEASON_CONFIG[sg.season];
              const seasonCount = yg.seasons.length;
              const seasonT = seasonCount === 1 ? 0.65 : 0.3 + (si / (seasonCount - 1)) * 0.5;
              const originOnBranch = new THREE.Vector3().lerpVectors(yg.start, yg.end, seasonT);
              const seasonAngleOffset = seasonCount === 1 ? 0 : (-0.4 + (si / (seasonCount - 1)) * 0.8);
              const seasonLength = 0.6 + sg.memories.length * 0.1;
              const dir = new THREE.Vector3(yg.end.x, 0, yg.end.z).normalize();
              const up = new THREE.Vector3(0, 1, 0);
              const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
              const seasonEnd = new THREE.Vector3(
                originOnBranch.x + dir.x * seasonLength + perp.x * seasonAngleOffset * seasonLength,
                originOnBranch.y + 0.2 + seasonAngleOffset * 0.3,
                originOnBranch.z + dir.z * seasonLength + perp.z * seasonAngleOffset * seasonLength,
              );

              return (
                <group key={sg.season}>
                  <Branch start={originOnBranch} end={seasonEnd} thickness={0.02} color={cfg.color} />
                  <Html position={[seasonEnd.x * 1.08, seasonEnd.y + 0.1, seasonEnd.z * 1.08]} center>
                    <span className="text-[8px] whitespace-nowrap select-none pointer-events-none" style={{ color: cfg.color }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </Html>

                  {sg.memories.map((mem, mi) => {
                    if (mem.isCollection && mem.imageUrls.length > 1) {
                      return (
                        <VineCollection key={mem.id} memory={mem} startPos={seasonEnd} onLeafClick={onLeafClick} side={yg.end.x > 0 ? 1 : -1} index={yi * 20 + si * 4 + mi * 10} />
                      );
                    }
                    const leafCount = sg.memories.length;
                    const spreadAngle = Math.min(leafCount * 0.4, 1.2);
                    const leafAngleOffset = leafCount === 1 ? 0 : -spreadAngle / 2 + (mi / (leafCount - 1)) * spreadAngle;
                    const leafDist = 0.3 + mi * 0.08;
                    const leafDir = new THREE.Vector3(seasonEnd.x - originOnBranch.x, 0, seasonEnd.z - originOnBranch.z).normalize();
                    const leafPerp = new THREE.Vector3().crossVectors(leafDir, up).normalize();
                    const lx = seasonEnd.x + leafDir.x * leafDist * 0.5 + leafPerp.x * leafAngleOffset * leafDist;
                    const ly = seasonEnd.y + 0.1 + leafAngleOffset * 0.2;
                    const lz = seasonEnd.z + leafDir.z * leafDist * 0.5 + leafPerp.z * leafAngleOffset * leafDist;

                    return (
                      <Html key={mem.id} position={[lx, ly, lz]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'auto' }}>
                        <svg width="50" height="50" viewBox="0 0 50 50" className="overflow-visible">
                          <LeafNode memory={mem} x={25} y={25} index={yi * 20 + si * 4 + mi} rotation={0} onClick={onLeafClick} />
                        </svg>
                      </Html>
                    );
                  })}
                </group>
              );
            })}
          </group>
        ))}
      </group>

      <Fireflies3D count={Math.max(memories.length, 4)} />
      {showBirthday && <BirthdayBlooms3D />}

      {memories.length === 0 && (
        <Html position={[0, -1.5, 0]} center>
          <p className="text-sm text-muted-foreground italic whitespace-nowrap select-none px-4 py-2 rounded-lg bg-card/60 backdrop-blur-sm border border-border">
            🌱 Plant your first memory seed...
          </p>
        </Html>
      )}
    </>
  );
}

// ─── Main exported component ──────────────────────────────────────────────
export function MemoryTree3D(props: MemoryTree3DProps) {
  const theme = useMemo(() => getSeasonTheme(props.memories), [props.memories]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden" style={{ background: theme.fogColor }}>
      <Canvas
        camera={{ position: [0, 1.5, 6], fov: 42 }}
        shadows
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={12}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <TreeScene {...props} theme={theme} />
      </Canvas>
    </div>
  );
}
