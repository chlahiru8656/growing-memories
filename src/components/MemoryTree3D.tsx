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

// ─── Season config ───────────────────────────────────────────────────────
const SEASON_CONFIG: Record<Season, { color: string; label: string; emoji: string }> = {
  Spring: { color: '#4ade80', label: 'Spring', emoji: '🌸' },
  Summer: { color: '#84cc16', label: 'Summer', emoji: '☀️' },
  Autumn: { color: '#f59e0b', label: 'Autumn', emoji: '🍂' },
  Winter: { color: '#93c5fd', label: 'Winter', emoji: '❄️' },
};

const SEASON_ORDER: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

// ─── Group memories ──────────────────────────────────────────────────────
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

// ─── Trunk mesh ───────────────────────────────────────────────────────────
function Trunk({ height }: { height: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    // Tapered cylinder using lathe
    const points: THREE.Vector2[] = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const radius = 0.15 - t * 0.08; // taper from 0.15 to 0.07
      const y = t * height;
      points.push(new THREE.Vector2(radius, y));
    }
    return new THREE.LatheGeometry(points, 12);
  }, [height]);

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -height / 2, 0]}>
      <meshStandardMaterial
        color="#4a3520"
        roughness={0.9}
        metalness={0.05}
        vertexColors={false}
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

  const leafGeo = useMemo(() => {
    return new THREE.ShapeGeometry(leafShape);
  }, [leafShape]);

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
function Branch({
  start, end, thickness, color,
}: { start: THREE.Vector3; end: THREE.Vector3; thickness: number; color: string }) {
  const midPoint = useMemo(() => {
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
    mid.y += 0.15; // slight upward curve
    return mid;
  }, [start, end]);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(start, midPoint, end);
  }, [start, midPoint, end]);

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 12, thickness, 6, false);
  }, [curve, thickness]);

  return (
    <mesh geometry={tubeGeo}>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
    </mesh>
  );
}

// ─── Vine (hanging collection) ───────────────────────────────────────────
function VineCollection({
  memory, startPos, onLeafClick, side, index,
}: {
  memory: Memory;
  startPos: THREE.Vector3;
  onLeafClick?: (m: Memory) => void;
  side: number;
  index: number;
}) {
  const vineLength = 0.5 + memory.imageUrls.length * 0.3;
  const endPos = useMemo(() => new THREE.Vector3(
    startPos.x + side * 0.15,
    startPos.y - vineLength,
    startPos.z
  ), [startPos, vineLength, side]);

  const midPos = useMemo(() => new THREE.Vector3(
    startPos.x + side * 0.25,
    startPos.y - vineLength * 0.5,
    startPos.z + 0.1
  ), [startPos, vineLength, side]);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(startPos, midPos, endPos);
  }, [startPos, midPos, endPos]);

  const tubeGeo = useMemo(() => {
    return new THREE.TubeGeometry(curve, 12, 0.012, 5, false);
  }, [curve]);

  const leafPositions = useMemo(() => {
    return memory.imageUrls.map((_, i) => {
      const t = (i + 1) / (memory.imageUrls.length + 1);
      return curve.getPointAt(t);
    });
  }, [memory.imageUrls, curve]);

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial color="#4ade80" roughness={0.7} metalness={0.05} transparent opacity={0.7} />
      </mesh>
      {memory.imageUrls.map((imgUrl, imgIdx) => {
        const pos = leafPositions[imgIdx];
        const vineLeafMem = { ...memory, imageUrl: imgUrl };
        return (
          <Html
            key={`${memory.id}-vine-${imgIdx}`}
            position={[pos.x, pos.y, pos.z]}
            center
            zIndexRange={[10, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible">
              <LeafNode
                memory={vineLeafMem}
                x={20}
                y={20}
                index={index + imgIdx}
                rotation={imgIdx % 2 === 0 ? -15 : 15}
                onClick={() => onLeafClick?.(memory)}
                isVineLeaf
              />
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
      <circleGeometry args={[5, 32]} />
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
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 3 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return pos;
  }, [n]);

  useFrame((state) => {
    if (particles.current) {
      const geo = particles.current.geometry;
      const posArr = geo.attributes.position.array as Float32Array;
      for (let i = 0; i < n; i++) {
        posArr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.002;
        posArr[i * 3] += Math.cos(state.clock.elapsedTime * 0.5 + i) * 0.001;
      }
      geo.attributes.position.needsUpdate = true;
    }
  });

  if (count === 0) return null;

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={n}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffaa" size={0.04} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── Birthday particles ──────────────────────────────────────────────────
function BirthdayBlooms3D() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2,
      radius: 0.8 + (i % 3) * 0.4,
      speed: 1 + (i % 3) * 0.5,
      color: i % 3 === 0 ? '#f472b6' : i % 3 === 1 ? '#fbbf24' : '#a78bfa',
    }));
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        const t = state.clock.elapsedTime * p.speed;
        child.position.x = Math.cos(p.angle + t * 0.3) * p.radius;
        child.position.y = Math.sin(t) * 0.5 + 1;
        child.position.z = Math.sin(p.angle + t * 0.3) * p.radius;
        (child as THREE.Mesh).material = (child as THREE.Mesh).material;
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
function TreeScene({
  memories, onLeafClick, userAge = 0, userBirthdate, theme,
}: MemoryTree3DProps & { theme: SeasonTheme }) {
  const yearGroups = useMemo(() => groupMemories(memories), [memories]);
  const showBirthday = userBirthdate ? isBirthdayToday(userBirthdate) : false;
  const healthy = isTreeHealthy(memories);

  const trunkHeight = 3 + Math.min(userAge * 0.05, 1.5);
  const trunkTop = trunkHeight / 2;

  // Calculate 3D branch layouts: distribute years around 360°
  const branchLayouts = useMemo(() => {
    const yearCount = yearGroups.length;
    return yearGroups.map((yg, idx) => {
      // Distribute years around the trunk in 360°
      const baseAngle = yearCount <= 1
        ? 0
        : (idx / yearCount) * Math.PI * 2;
      
      // Vertical position along trunk
      const t = yearCount <= 1 ? 0.6 : 0.3 + (idx / Math.max(yearCount - 1, 1)) * 0.5;
      const branchY = -trunkHeight / 2 + trunkHeight * t;
      
      const branchLength = 1.2 + Math.min(yg.totalMemories * 0.08, 0.6);
      const branchEndX = Math.cos(baseAngle) * branchLength;
      const branchEndZ = Math.sin(baseAngle) * branchLength;
      const branchEndY = branchY + 0.3;

      return {
        ...yg,
        baseAngle,
        branchY,
        branchLength,
        start: new THREE.Vector3(0, branchY, 0),
        end: new THREE.Vector3(branchEndX, branchEndY, branchEndZ),
      };
    });
  }, [yearGroups, trunkHeight]);

  return (
    <>
      {/* Lighting based on seasonal theme */}
      <ambientLight color={theme.ambientColor} intensity={theme.ambientIntensity} />
      <directionalLight
        color={theme.directionalColor}
        intensity={theme.directionalIntensity}
        position={[3, 5, 2]}
        castShadow
      />
      <pointLight color="#22c55e" intensity={0.3} position={[0, trunkTop, 0]} distance={4} />
      
      <fog attach="fog" args={[theme.fogColor, 6, 15]} />

      {/* Ground */}
      <Ground color={theme.groundColor} />

      {/* Health filter - apply desaturation through material if unhealthy */}
      <group>
        {/* Trunk */}
        <Trunk height={trunkHeight} />

        {/* Sprout at top */}
        <Sprout y={trunkTop} />

        {/* Base canopy (age-scaled) */}
        {userAge > 0 && (
          <mesh position={[0, trunkTop - 0.3, 0]}>
            <sphereGeometry args={[0.4 + userAge * 0.015, 16, 12]} />
            <meshStandardMaterial
              color={healthy ? '#1a4a20' : '#3a3520'}
              transparent
              opacity={0.25}
              roughness={1}
            />
          </mesh>
        )}

        {/* Year branches + Season sub-branches + leaves */}
        {branchLayouts.map((yg, yi) => (
          <group key={yg.year}>
            {/* Year branch */}
            <Branch
              start={yg.start}
              end={yg.end}
              thickness={0.04}
              color="#5a4530"
            />

            {/* Year label */}
            <Html position={[yg.end.x * 1.15, yg.end.y, yg.end.z * 1.15]} center>
              <span className="text-[10px] font-display italic text-foreground/70 whitespace-nowrap select-none pointer-events-none">
                {yg.year}
              </span>
            </Html>

            {/* Season sub-branches */}
            {yg.seasons.map((sg, si) => {
              const cfg = SEASON_CONFIG[sg.season];
              const seasonCount = yg.seasons.length;
              
              // Spread seasons along the year branch
              const seasonT = seasonCount === 1 ? 0.65 : 0.3 + (si / (seasonCount - 1)) * 0.5;
              const originOnBranch = new THREE.Vector3().lerpVectors(yg.start, yg.end, seasonT);
              
              // Season branch direction - fan out from year branch
              const seasonAngleOffset = seasonCount === 1
                ? 0
                : (-0.4 + (si / (seasonCount - 1)) * 0.8);
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
                  {/* Season branch */}
                  <Branch
                    start={originOnBranch}
                    end={seasonEnd}
                    thickness={0.02}
                    color={cfg.color}
                  />

                  {/* Season label */}
                  <Html position={[seasonEnd.x * 1.08, seasonEnd.y + 0.1, seasonEnd.z * 1.08]} center>
                    <span className="text-[8px] whitespace-nowrap select-none pointer-events-none" style={{ color: cfg.color }}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </Html>

                  {/* Memory leaves */}
                  {sg.memories.map((mem, mi) => {
                    if (mem.isCollection && mem.imageUrls.length > 1) {
                      return (
                        <VineCollection
                          key={mem.id}
                          memory={mem}
                          startPos={seasonEnd}
                          onLeafClick={onLeafClick}
                          side={yg.end.x > 0 ? 1 : -1}
                          index={yi * 20 + si * 4 + mi * 10}
                        />
                      );
                    }

                    // Single leaf - fan out from season branch tip
                    const leafCount = sg.memories.length;
                    const spreadAngle = Math.min(leafCount * 0.4, 1.2);
                    const leafAngleOffset = leafCount === 1
                      ? 0
                      : -spreadAngle / 2 + (mi / (leafCount - 1)) * spreadAngle;
                    
                    const leafDist = 0.3 + mi * 0.08;
                    const leafDir = new THREE.Vector3(
                      seasonEnd.x - originOnBranch.x,
                      0,
                      seasonEnd.z - originOnBranch.z,
                    ).normalize();
                    const leafPerp = new THREE.Vector3().crossVectors(leafDir, up).normalize();
                    
                    const lx = seasonEnd.x + leafDir.x * leafDist * 0.5 + leafPerp.x * leafAngleOffset * leafDist;
                    const ly = seasonEnd.y + 0.1 + leafAngleOffset * 0.2;
                    const lz = seasonEnd.z + leafDir.z * leafDist * 0.5 + leafPerp.z * leafAngleOffset * leafDist;

                    return (
                      <Html
                        key={mem.id}
                        position={[lx, ly, lz]}
                        center
                        zIndexRange={[10, 0]}
                        style={{ pointerEvents: 'auto' }}
                      >
                        <svg width="50" height="50" viewBox="0 0 50 50" className="overflow-visible">
                          <LeafNode
                            memory={mem}
                            x={25}
                            y={25}
                            index={yi * 20 + si * 4 + mi}
                            rotation={0}
                            onClick={onLeafClick}
                          />
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

      {/* Fireflies */}
      <Fireflies3D count={memories.length} />

      {/* Birthday */}
      {showBirthday && <BirthdayBlooms3D />}

      {/* Empty state */}
      {memories.length === 0 && (
        <Html position={[0, -2, 0]} center>
          <p className="text-xs text-muted-foreground italic whitespace-nowrap select-none">
            Plant your first memory seed...
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
        camera={{ position: [0, 1, 5], fov: 45 }}
        shadows
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={10}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.3}
        />
        <TreeScene {...props} theme={theme} />
      </Canvas>
    </div>
  );
}
