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

// ─── SVG Defs for realistic trunk & sprout ────────────────────────────────────
function TreeDefs() {
  return (
    <defs>
      <linearGradient id="trunkGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="hsl(25 45% 18%)" />
        <stop offset="30%" stopColor="hsl(25 40% 25%)" />
        <stop offset="60%" stopColor="hsl(30 35% 30%)" />
        <stop offset="85%" stopColor="hsl(90 30% 32%)" />
        <stop offset="100%" stopColor="hsl(120 40% 35%)" />
      </linearGradient>
      <linearGradient id="trunkHighlight" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="hsl(25 35% 28%)" />
        <stop offset="50%" stopColor="hsl(30 30% 38%)" />
        <stop offset="100%" stopColor="hsl(110 35% 45%)" />
      </linearGradient>
      <linearGradient id="sproutLeafGrad" x1="0.5" y1="1" x2="0.5" y2="0">
        <stop offset="0%" stopColor="hsl(130 50% 30%)" />
        <stop offset="50%" stopColor="hsl(125 55% 42%)" />
        <stop offset="100%" stopColor="hsl(115 60% 52%)" />
      </linearGradient>
      <linearGradient id="sproutLeafGrad2" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(135 45% 28%)" />
        <stop offset="100%" stopColor="hsl(120 55% 48%)" />
      </linearGradient>
      <linearGradient id="veinGrad" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="hsl(110 50% 60%)" stopOpacity="0.7" />
        <stop offset="100%" stopColor="hsl(120 40% 45%)" stopOpacity="0.2" />
      </linearGradient>
      <filter id="leafGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
        <feFlood floodColor="hsl(120 60% 55%)" floodOpacity="0.35" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="barkTexture">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  );
}

// ─── Realistic Trunk ──────────────────────────────────────────────────────────
function Trunk() {
  const bx = TRUNK_X;
  const by = TRUNK_BOTTOM;
  const ty = TRUNK_TOP;
  const trunkFill = `M ${bx - 7} ${by} C ${bx - 8} ${by - 50}, ${bx - 5} ${ty + 80}, ${bx - 3} ${ty + 10} C ${bx - 2} ${ty + 2}, ${bx - 1} ${ty - 2}, ${bx} ${ty - 6} C ${bx + 1} ${ty - 1}, ${bx + 2} ${ty + 4}, ${bx + 3} ${ty + 12} C ${bx + 6} ${ty + 75}, ${bx + 9} ${by - 55}, ${bx + 7} ${by} Z`;
  const trunkLeft = `M ${bx - 7} ${by} C ${bx - 8} ${by - 50}, ${bx - 5} ${ty + 80}, ${bx - 3} ${ty + 10}`;

  return (
    <g>
      <motion.path d={trunkFill} fill="hsl(25 30% 10%)" opacity={0.4} transform="translate(3,2)"
        initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ duration: 1.2 }} />
      <motion.path d={trunkFill} fill="url(#trunkGrad)" filter="url(#barkTexture)"
        initial={{ opacity: 0, scaleY: 0 }} animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }} style={{ transformOrigin: `${bx}px ${by}px` }} />
      <motion.path d={trunkLeft} stroke="hsl(25 35% 15%)" strokeWidth={1} fill="none" opacity={0.5}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeOut' }} />
      <motion.path
        d={`M ${bx + 2} ${by - 15} C ${bx + 3} ${by - 50}, ${bx + 2} ${ty + 70}, ${bx + 1} ${ty + 15}`}
        stroke="url(#trunkHighlight)" strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.45}
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }} />
      {[0.3, 0.55, 0.75].map((t, i) => (
        <ellipse key={i} cx={bx + (i % 2 === 0 ? -2 : 3)} cy={by + (ty - by) * t}
          rx={2.5} ry={1.5} fill="hsl(25 30% 18%)" opacity={0.35} />
      ))}
    </g>
  );
}

// ─── Realistic Sprout (දළු) ───────────────────────────────────────────────────
function TreeSprout() {
  const cx = TRUNK_X;
  const cy = TRUNK_TOP - 6;

  const realisticLeaf = (tipX: number, tipY: number, angle: number, size: number, gradId: string) => {
    const rad = (angle * Math.PI) / 180;
    const perpRad = rad + Math.PI / 2;
    const s = size;
    const tx = cx + Math.cos(rad) * s * 1.8 + tipX;
    const ty2 = cy + Math.sin(rad) * s * 1.8 + tipY;
    const cp1x = cx + Math.cos(rad) * s * 0.6 + Math.cos(perpRad) * s * 0.45 + tipX;
    const cp1y = cy + Math.sin(rad) * s * 0.6 + Math.sin(perpRad) * s * 0.45 + tipY;
    const cp2x = cx + Math.cos(rad) * s * 0.6 - Math.cos(perpRad) * s * 0.45 + tipX;
    const cp2y = cy + Math.sin(rad) * s * 0.6 - Math.sin(perpRad) * s * 0.45 + tipY;
    const veinEnd = { x: cx + Math.cos(rad) * s * 1.5 + tipX, y: cy + Math.sin(rad) * s * 1.5 + tipY };

    return (
      <g key={`leaf-${angle}-${tipX}`}>
        <path
          d={`M ${cx + tipX} ${cy + tipY} C ${cp1x} ${cp1y}, ${tx + Math.cos(perpRad) * 2} ${ty2 + Math.sin(perpRad) * 2}, ${tx} ${ty2} C ${tx - Math.cos(perpRad) * 2} ${ty2 - Math.sin(perpRad) * 2}, ${cp2x} ${cp2y}, ${cx + tipX} ${cy + tipY}`}
          fill={`url(#${gradId})`}
          filter="url(#leafGlow)"
        />
        <path d={`M ${cx + tipX} ${cy + tipY} L ${veinEnd.x} ${veinEnd.y}`}
          stroke="url(#veinGrad)" strokeWidth={0.6} fill="none" />
      </g>
    );
  };

  return (
    <motion.g
      animate={{ scale: [0.96, 1.05, 0.96] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: `${cx}px ${cy}px` }}
    >
      {realisticLeaf(0, 0, -90, 12, 'sproutLeafGrad')}
      {realisticLeaf(-2, 3, -140, 10, 'sproutLeafGrad2')}
      {realisticLeaf(2, 3, -40, 10, 'sproutLeafGrad2')}
      {realisticLeaf(-1, 6, -160, 6, 'sproutLeafGrad')}
      {realisticLeaf(1, 6, -20, 6, 'sproutLeafGrad')}
    </motion.g>
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
      <TreeDefs />
      <ForestBackground />
      {userAge > 0 && <BaseCanopy age={userAge} />}
      <Trunk />
      <TreeSprout />
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

                    {/* Memory leaves — single vs collection (vine) */}
                    {sg.memories.map((mem, mi) => {
                      if (mem.isCollection && mem.imageUrls.length > 1) {
                        // ── Vine visualization ──
                        const vineStartX = sEndX;
                        const vineStartY = sEndY;
                        const vineLength = 30 + mem.imageUrls.length * 22;
                        const vineEndX = vineStartX + (yg.side > 0 ? 8 : -8);
                        const vineEndY = vineStartY + vineLength;
                        const vineCX = vineStartX + yg.side * 18;
                        const vineCY = vineStartY + vineLength * 0.5;
                        const vinePath = qPath(vineStartX, vineStartY, vineCX, vineCY, vineEndX, vineEndY);

                        return (
                          <g key={mem.id}>
                            {/* Vine path */}
                            <BranchPath
                              d={vinePath}
                              color="hsl(130 40% 45%)"
                              width={1.5}
                              delay={seasonDelay + 0.4 + mi * 0.1}
                              opacity={0.6}
                            />
                            {/* Decorative tendrils */}
                            <motion.g
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: seasonDelay + 0.8, duration: 0.5 }}
                              style={{ pointerEvents: 'none' }}
                            >
                              <DecorativeLeaves
                                x1={vineStartX} y1={vineStartY}
                                cx={vineCX} cy={vineCY}
                                x2={vineEndX} y2={vineEndY}
                                color="hsl(130 35% 40%)"
                                count={Math.min(mem.imageUrls.length, 5)}
                                baseAngle={yg.side > 0 ? 30 : 150}
                              />
                            </motion.g>
                            {/* Leaf nodes for each image */}
                            {mem.imageUrls.map((imgUrl, imgIdx) => {
                              const t = (imgIdx + 1) / (mem.imageUrls.length + 1);
                              const pt = qBezierPoint(vineStartX, vineStartY, vineCX, vineCY, vineEndX, vineEndY, t);
                              const vineLeafMem = { ...mem, imageUrl: imgUrl };
                              return (
                                <LeafNode
                                  key={`${mem.id}-vine-${imgIdx}`}
                                  memory={vineLeafMem}
                                  x={pt.x + (imgIdx % 2 === 0 ? -8 : 8)}
                                  y={pt.y}
                                  index={yi * 20 + si * 4 + mi * 10 + imgIdx}
                                  rotation={imgIdx % 2 === 0 ? -15 : 15}
                                  onClick={() => onLeafClick?.(mem)}
                                  isVineLeaf
                                />
                              );
                            })}
                          </g>
                        );
                      }

                      // ── Standard single leaf ──
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
