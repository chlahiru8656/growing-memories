import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory, Season, getSeason, getYear, isBirthdayToday, isTreeHealthy } from '@/types/memory';
import { LeafNode } from './LeafNode';

interface MemoryTreeProps {
  memories: Memory[];
  onLeafClick?: (memory: Memory) => void;
  userAge?: number;
  userBirthdate?: string;
}

// ─── Season config ───────────────────────────────────────────────────────────
const SEASON_CONFIG: Record<Season, { color: string; label: string; emoji: string }> = {
  Spring: { color: 'hsl(142 55% 55%)', label: 'Spring', emoji: '🌸' },
  Summer: { color: 'hsl(85 55% 45%)',  label: 'Summer', emoji: '☀️' },
  Autumn: { color: 'hsl(30 70% 50%)',  label: 'Autumn', emoji: '🍂' },
  Winter: { color: 'hsl(210 50% 65%)', label: 'Winter', emoji: '❄️' },
};

const SEASON_ORDER: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

// ─── Geometry helpers ────────────────────────────────────────────────────────
const SVG_W = 700;
const SVG_H = 600;
const TRUNK_X = SVG_W / 2;
const TRUNK_BOTTOM = SVG_H - 40;
const TRUNK_TOP = SVG_H - 220;

/** Quadratic bezier point at t */
function qBezierPoint(
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  t: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  };
}

/** SVG quadratic bezier path string */
function qPath(x1: number, y1: number, cx: number, cy: number, x2: number, y2: number) {
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

// ─── Grouped structure ───────────────────────────────────────────────────────
interface SeasonGroup {
  season: Season;
  memories: Memory[];
}
interface YearGroup {
  year: number;
  seasons: SeasonGroup[];
  totalMemories: number;
}

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

// ─── Decorative leaf shape ────────────────────────────────────────────────────
/** Renders a single small SVG leaf polygon at (x, y) rotated by `angleDeg`. */
function DecorativeLeaf({
  x, y, angleDeg, color, size = 7, opacity = 0.55,
}: { x: number; y: number; angleDeg: number; color: string; size?: number; opacity?: number }) {
  // A simple teardrop leaf path centered at origin, pointing up
  const s = size;
  const path = `M 0 ${-s * 1.6} C ${s * 0.9} ${-s * 0.6} ${s * 0.8} ${s * 0.5} 0 ${s * 0.9} C ${-s * 0.8} ${s * 0.5} ${-s * 0.9} ${-s * 0.6} 0 ${-s * 1.6}`;
  return (
    <g
      transform={`translate(${x}, ${y}) rotate(${angleDeg})`}
      style={{ pointerEvents: 'none' }}
      opacity={opacity}
    >
      <path d={path} fill={color} />
    </g>
  );
}

/** Distribute N decorative leaves evenly along a quadratic bezier. */
function DecorativeLeaves({
  x1, y1, cx, cy, x2, y2,
  color, count, baseAngle,
}: {
  x1: number; y1: number; cx: number; cy: number; x2: number; y2: number;
  color: string; count: number; baseAngle: number;
}) {
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const t = (i + 1) / (count + 1);
    const pt = qBezierPoint(x1, y1, cx, cy, x2, y2, t);
    // Alternate leaf angle slightly for natural look
    const wiggle = (i % 2 === 0 ? 25 : -25);
    leaves.push(
      <DecorativeLeaf
        key={i}
        x={pt.x}
        y={pt.y}
        angleDeg={baseAngle + wiggle}
        color={color}
        size={6 + (i % 2) * 2}
        opacity={0.45 + (i % 3) * 0.1}
      />
    );
  }
  return <>{leaves}</>;
}

// ─── Base canopy (age-scaled silhouette) ─────────────────────────────────────
function BaseCanopy({ age }: { age: number }) {
  // Scale canopy based on age: young tree = small, older = fuller
  const scale = Math.min(0.5 + age * 0.025, 1.3);
  const opacity = Math.min(0.15 + age * 0.005, 0.35);
  return (
    <motion.g
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale, opacity }}
      transition={{ duration: 1.8, ease: 'easeOut' }}
      style={{ transformOrigin: `${TRUNK_X}px ${TRUNK_TOP + 30}px` }}
    >
      {/* Main canopy ellipse */}
      <ellipse cx={TRUNK_X} cy={TRUNK_TOP - 10} rx={120 * scale} ry={90 * scale}
        fill="hsl(140 30% 18%)" opacity={0.6} />
      <ellipse cx={TRUNK_X - 50} cy={TRUNK_TOP + 20} rx={80 * scale} ry={65 * scale}
        fill="hsl(135 25% 15%)" opacity={0.5} />
      <ellipse cx={TRUNK_X + 55} cy={TRUNK_TOP + 15} rx={85 * scale} ry={70 * scale}
        fill="hsl(145 28% 16%)" opacity={0.5} />
      <ellipse cx={TRUNK_X} cy={TRUNK_TOP + 50} rx={100 * scale} ry={55 * scale}
        fill="hsl(130 22% 14%)" opacity={0.4} />
    </motion.g>
  );
}

// ─── Birthday celebration blooms ──────────────────────────────────────────────
function BirthdayBlooms() {
  return (
    <g>
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const radius = 80 + (i % 3) * 50;
        const cx = TRUNK_X + Math.cos(angle) * radius;
        const cy = TRUNK_TOP + 20 + Math.sin(angle) * radius * 0.7;
        return (
          <motion.circle
            key={`bloom-${i}`}
            cx={cx}
            cy={cy}
            r={2 + (i % 3)}
            fill={i % 3 === 0 ? 'hsl(330 70% 75%)' : i % 3 === 1 ? 'hsl(45 90% 75%)' : 'hsl(280 60% 75%)'}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.3, 1.5, 0.3],
              cy: [cy, cy - 30 - (i % 4) * 10, cy - 60],
            }}
            transition={{
              duration: 2.5 + (i % 3),
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </g>
  );
}

// ─── Forest background ───────────────────────────────────────────────────────
function ForestBackground() {
  return (
    <g>
      <defs>
        <radialGradient id="skyGlow" cx="50%" cy="30%" r="65%">
          <stop offset="0%" stopColor="hsl(180 20% 12%)" />
          <stop offset="100%" stopColor="hsl(150 18% 6%)" />
        </radialGradient>
        <filter id="branchBlur">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      <rect width={SVG_W} height={SVG_H} fill="url(#skyGlow)" />

      {/* Stars */}
      {[...Array(28)].map((_, i) => (
        <motion.circle
          key={i}
          cx={(i * 83 + 17) % (SVG_W - 20) + 10}
          cy={(i * 61 + 13) % 160 + 10}
          r={0.7 + (i % 3) * 0.4}
          fill="hsl(60 30% 90%)"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Distant silhouette trees */}
      {[50, 110, 590, 640, 540, 90].map((tx, i) => (
        <ellipse
          key={i}
          cx={tx} cy={460 + (i % 2) * 20}
          rx={12 + (i % 3) * 5} ry={35 + (i % 4) * 12}
          fill="hsl(140 20% 8%)" opacity={0.55}
        />
      ))}

      {/* Ground */}
      <rect x="0" y={SVG_H - 55} width={SVG_W} height={55} fill="hsl(120 18% 9%)" />
      <ellipse cx={TRUNK_X} cy={SVG_H - 42} rx={160} ry={22} fill="hsl(120 20% 11%)" opacity={0.9} />

      {/* Mist */}
      <motion.rect
        x="0" y={SVG_H - 75} width={SVG_W} height={40}
        fill="hsl(150 20% 12%)" opacity={0.45}
        animate={{ opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </g>
  );
}

// ─── Trunk ────────────────────────────────────────────────────────────────────
function Trunk() {
  return (
    <g>
      {/* Shadow */}
      <motion.path
        d={`M ${TRUNK_X + 4} ${TRUNK_BOTTOM} C ${TRUNK_X + 4} ${TRUNK_BOTTOM - 60} ${TRUNK_X + 6} ${TRUNK_TOP + 40} ${TRUNK_X + 5} ${TRUNK_TOP}`}
        stroke="hsl(25 30% 14%)" strokeWidth={18} strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {/* Main */}
      <motion.path
        d={`M ${TRUNK_X} ${TRUNK_BOTTOM} C ${TRUNK_X} ${TRUNK_BOTTOM - 60} ${TRUNK_X - 2} ${TRUNK_TOP + 40} ${TRUNK_X} ${TRUNK_TOP}`}
        stroke="hsl(25 40% 27%)" strokeWidth={14} strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />
      {/* Highlight */}
      <motion.path
        d={`M ${TRUNK_X - 3} ${TRUNK_BOTTOM - 10} C ${TRUNK_X - 3} ${TRUNK_BOTTOM - 50} ${TRUNK_X - 4} ${TRUNK_TOP + 50} ${TRUNK_X - 3} ${TRUNK_TOP + 10}`}
        stroke="hsl(25 35% 38%)" strokeWidth={3} strokeLinecap="round" fill="none"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
      />
    </g>
  );
}

// ─── Animated branch path ─────────────────────────────────────────────────────
function BranchPath({
  d, color, width, delay, opacity = 1,
}: { d: string; color: string; width: number; delay: number; opacity?: number }) {
  return (
    <motion.path
      d={d}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{ pathLength: { duration: 0.9, ease: 'easeInOut', delay }, opacity: { duration: 0.25, delay } }}
    />
  );
}

// ─── Fireflies ────────────────────────────────────────────────────────────────
function Fireflies({ count }: { count: number }) {
  return (
    <g>
      {[...Array(Math.min(count * 2, 14))].map((_, i) => (
        <motion.circle
          key={i}
          cx={160 + (i * 67) % 380}
          cy={210 + (i * 41) % 250}
          r={1.4}
          fill="hsl(60 90% 80%)"
          animate={{
            cx: [160 + (i * 67) % 380, 168 + (i * 73) % 375, 160 + (i * 67) % 380],
            cy: [210 + (i * 41) % 250, 205 + (i * 37) % 245, 210 + (i * 41) % 250],
            opacity: [0, 0.85, 0],
          }}
          transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.65 }}
        />
      ))}
    </g>
  );
}

// ─── Main tree component ──────────────────────────────────────────────────────
export function MemoryTree({ memories, onLeafClick, userAge = 0, userBirthdate }: MemoryTreeProps) {
  const yearGroups = useMemo(() => groupMemories(memories), [memories]);
  const showBirthday = userBirthdate ? isBirthdayToday(userBirthdate) : false;
  const healthy = isTreeHealthy(memories);

  const yearCount = yearGroups.length;

  const yearLayouts = useMemo(() => {
    return yearGroups.map((yg, idx) => {
      const side = idx % 2 === 0 ? -1 : 1;
      const t = yearCount <= 1 ? 0.5 : idx / (yearCount - 1);
      const branchY = TRUNK_TOP + 30 + (TRUNK_BOTTOM - TRUNK_TOP - 80) * (1 - t * 0.85);
      const branchLength = 110 + Math.min(yg.totalMemories * 6, 60);
      const branchEndX = TRUNK_X + side * branchLength;
      const branchEndY = branchY - 40;
      const ctrlX = TRUNK_X + side * branchLength * 0.5;
      const ctrlY = branchY - 15;
      return { ...yg, side, branchY, branchEndX, branchEndY, ctrlX, ctrlY, branchLength };
    });
  }, [yearGroups, yearCount]);

  // Tree health filter
  const healthFilter = healthy ? 'none' : 'sepia(0.3) saturate(0.5)';

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-full"
      style={{ filter: `drop-shadow(0 20px 50px rgba(0,0,0,0.45)) ${healthFilter}` }}
    >
      <ForestBackground />
      {userAge > 0 && <BaseCanopy age={userAge} />}
      <Trunk />
      {showBirthday && <BirthdayBlooms />}

      {/* Year branches + Season sub-branches + leaves */}
      <AnimatePresence>
        {yearLayouts.map((yg, yi) => {
          const yearDelay = 0.4 + yi * 0.25;
          const yearBranchPath = qPath(TRUNK_X, yg.branchY, yg.ctrlX, yg.ctrlY, yg.branchEndX, yg.branchEndY);
          const seasonCount = yg.seasons.length;
          // Decorative leaf color along year branch: muted earthy green
          const yearLeafColor = 'hsl(130 35% 28%)';

          return (
            <g key={yg.year}>
              {/* ── Year branch ── */}
              <BranchPath
                d={yearBranchPath}
                color="hsl(25 40% 30%)"
                width={6}
                delay={yearDelay}
                opacity={0.95}
              />

              {/* Decorative leaves along year branch */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: yearDelay + 0.7, duration: 0.6 }}
                style={{ pointerEvents: 'none' }}
              >
                <DecorativeLeaves
                  x1={TRUNK_X} y1={yg.branchY}
                  cx={yg.ctrlX} cy={yg.ctrlY}
                  x2={yg.branchEndX} y2={yg.branchEndY}
                  color={yearLeafColor}
                  count={4}
                  baseAngle={yg.side > 0 ? -60 : -120}
                />
              </motion.g>

              {/* Year label */}
              <motion.text
                x={yg.branchEndX + yg.side * 8}
                y={yg.branchEndY + 4}
                textAnchor={yg.side > 0 ? 'start' : 'end'}
                fill="hsl(60 20% 72%)"
                fontSize={11}
                fontFamily="Playfair Display, serif"
                fontStyle="italic"
                opacity={0}
                animate={{ opacity: 0.85 }}
                transition={{ delay: yearDelay + 0.7, duration: 0.5 }}
              >
                {yg.year}
              </motion.text>

              {/* ── Season sub-branches ── */}
              {yg.seasons.map((sg, si) => {
                const cfg = SEASON_CONFIG[sg.season];
                const seasonT = seasonCount === 1 ? 0.6 : 0.3 + (si / (seasonCount - 1)) * 0.55;
                const origin = qBezierPoint(
                  TRUNK_X, yg.branchY,
                  yg.ctrlX, yg.ctrlY,
                  yg.branchEndX, yg.branchEndY,
                  seasonT
                );

                const seasonLength = 55 + sg.memories.length * 10;
                const angle = yg.side > 0
                  ? -55 + si * 20
                  : -125 + si * 20;
                const rad = (angle * Math.PI) / 180;
                const sEndX = origin.x + Math.cos(rad) * seasonLength;
                const sEndY = origin.y + Math.sin(rad) * seasonLength;
                const sCtrlX = origin.x + Math.cos(rad) * seasonLength * 0.5 + yg.side * 12;
                const sCtrlY = origin.y + Math.sin(rad) * seasonLength * 0.5 - 10;
                const seasonPath = qPath(origin.x, origin.y, sCtrlX, sCtrlY, sEndX, sEndY);
                const seasonDelay = yearDelay + 0.5 + si * 0.2;

                const leafCount = sg.memories.length;

                return (
                  <g key={sg.season}>
                    {/* Season branch */}
                    <BranchPath
                      d={seasonPath}
                      color={cfg.color}
                      width={2.5}
                      delay={seasonDelay}
                      opacity={0.75}
                    />

                    {/* Decorative leaves along season branch */}
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: seasonDelay + 0.5, duration: 0.5 }}
                      style={{ pointerEvents: 'none' }}
                    >
                      <DecorativeLeaves
                        x1={origin.x} y1={origin.y}
                        cx={sCtrlX} cy={sCtrlY}
                        x2={sEndX} y2={sEndY}
                        color={cfg.color}
                        count={3}
                        baseAngle={angle - 90}
                      />
                    </motion.g>

                    {/* Season label */}
                    <motion.text
                      x={sEndX + Math.cos(rad) * 6}
                      y={sEndY + Math.sin(rad) * 6}
                      textAnchor="middle"
                      fill={cfg.color}
                      fontSize={9}
                      fontFamily="Inter, sans-serif"
                      opacity={0}
                      animate={{ opacity: 0.9 }}
                      transition={{ delay: seasonDelay + 0.6, duration: 0.4 }}
                    >
                      {cfg.emoji} {cfg.label}
                    </motion.text>

                    {/* Memory leaves */}
                    {sg.memories.map((mem, mi) => {
                      const spreadAngle = Math.min(leafCount * 22, 80);
                      const leafAngle = leafCount === 1
                        ? angle - 90
                        : angle - 90 - spreadAngle / 2 + (mi / (leafCount - 1)) * spreadAngle;
                      const leafRad = (leafAngle * Math.PI) / 180;
                      const leafDist = 28 + mi * 6;
                      const lx = sEndX + Math.cos(leafRad) * leafDist;
                      const ly = sEndY + Math.sin(leafRad) * leafDist;
                      const leafRotation = leafAngle + 90;
                      return (
                        <LeafNode
                          key={mem.id}
                          memory={mem}
                          x={lx}
                          y={ly}
                          index={yi * 20 + si * 4 + mi}
                          rotation={leafRotation}
                          onClick={onLeafClick}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </g>
          );
        })}
      </AnimatePresence>

      {/* Fireflies */}
      <Fireflies count={memories.length} />

      {/* Empty state */}
      {memories.length === 0 && (
        <motion.text
          x={TRUNK_X}
          y={SVG_H - 65}
          textAnchor="middle"
          fill="hsl(150 8% 50%)"
          fontSize={12}
          fontFamily="Inter, sans-serif"
          fontStyle="italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          Plant your first memory seed...
        </motion.text>
      )}
    </svg>
  );
}
