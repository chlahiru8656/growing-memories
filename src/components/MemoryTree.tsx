import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory } from '@/types/memory';
import { LeafNode } from './LeafNode';
import { ALL_BRANCHES, getBranchCount, getLeafPosition } from '@/lib/treeGeometry';

interface MemoryTreeProps {
  memories: Memory[];
}

// Ground / roots / mist layers
function ForestBackground() {
  return (
    <g>
      {/* Deep sky gradient */}
      <defs>
        <radialGradient id="skyGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="hsl(180 20% 12%)" />
          <stop offset="100%" stopColor="hsl(150 18% 6%)" />
        </radialGradient>
        <radialGradient id="groundGlow" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="hsl(120 20% 14%)" />
          <stop offset="100%" stopColor="hsl(150 18% 7%)" />
        </radialGradient>
        <filter id="softBlur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="leafGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="treeClip">
          <rect x="0" y="0" width="600" height="540" />
        </clipPath>
      </defs>

      {/* Background rect */}
      <rect width="600" height="540" fill="url(#skyGlow)" />

      {/* Atmospheric stars */}
      {[...Array(30)].map((_, i) => (
        <motion.circle
          key={i}
          cx={(i * 83 + 17) % 580 + 10}
          cy={(i * 61 + 13) % 180 + 10}
          r={0.8 + (i % 3) * 0.4}
          fill="hsl(60 30% 90%)"
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{
            duration: 2 + (i % 4),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}

      {/* Distant tree silhouettes */}
      {[40, 100, 500, 550, 470, 80].map((tx, i) => (
        <ellipse
          key={i}
          cx={tx}
          cy={400 + (i % 2) * 20}
          rx={12 + (i % 3) * 6}
          ry={35 + (i % 4) * 12}
          fill="hsl(140 20% 8%)"
          opacity={0.6}
        />
      ))}

      {/* Ground */}
      <rect x="0" y="480" width="600" height="60" fill="url(#groundGlow)" />
      <ellipse cx="300" cy="490" rx="200" ry="25" fill="hsl(120 18% 11%)" opacity="0.8" />

      {/* Mist / fog layer */}
      <motion.rect
        x="0" y="460" width="600" height="40"
        fill="hsl(150 20% 12%)"
        opacity={0.5}
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </g>
  );
}

// Animated branch component
function AnimatedBranch({ path, delay }: { path: string; delay: number }) {
  return (
    <motion.path
      d={path}
      stroke="hsl(25 40% 26%)"
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{
        pathLength: { duration: 1.0, ease: 'easeInOut', delay },
        opacity: { duration: 0.3, delay },
      }}
    />
  );
}

// Trunk animation (thicker, textured)
function AnimatedTrunk() {
  return (
    <g>
      {/* Shadow trunk */}
      <motion.path
        d="M 305 520 C 305 520 300 420 305 340"
        stroke="hsl(25 30% 15%)"
        strokeWidth={16}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {/* Main trunk */}
      <motion.path
        d="M 300 520 C 300 520 295 420 300 340"
        stroke="hsl(25 40% 28%)"
        strokeWidth={12}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
      {/* Highlight */}
      <motion.path
        d="M 297 520 C 297 510 294 440 296 360"
        stroke="hsl(25 35% 36%)"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
      />
    </g>
  );
}

// Ambient firefly particles
function Fireflies({ count }: { count: number }) {
  return (
    <g>
      {[...Array(Math.min(count * 2, 12))].map((_, i) => (
        <motion.circle
          key={i}
          cx={150 + (i * 67) % 320}
          cy={200 + (i * 41) % 220}
          r={1.5}
          fill="hsl(60 90% 80%)"
          animate={{
            cx: [150 + (i * 67) % 320, 160 + (i * 73) % 310, 150 + (i * 67) % 320],
            cy: [200 + (i * 41) % 220, 195 + (i * 37) % 215, 200 + (i * 41) % 220],
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.5, 0.8],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            delay: i * 0.7,
          }}
        />
      ))}
    </g>
  );
}

export function MemoryTree({ memories }: MemoryTreeProps) {
  const branchCount = getBranchCount(memories.length);

  // Visible branches based on memory count
  const visibleBranches = useMemo(
    () => ALL_BRANCHES.slice(0, branchCount),
    [branchCount]
  );

  return (
    <svg
      viewBox="0 0 600 540"
      className="w-full h-full"
      style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
    >
      <ForestBackground />

      {/* Trunk */}
      <AnimatedTrunk />

      {/* Branches — revealed progressively */}
      <AnimatePresence>
        {visibleBranches.slice(1).map((branch, i) => (
          <AnimatedBranch
            key={branch.id}
            path={branch.path}
            delay={0.1 + i * 0.08}
          />
        ))}
      </AnimatePresence>

      {/* Memory leaves */}
      <AnimatePresence>
        {memories.map((memory, index) => {
          const pos = getLeafPosition(index);
          return (
            <LeafNode
              key={memory.id}
              memory={memory}
              x={pos.x}
              y={pos.y}
              index={index}
            />
          );
        })}
      </AnimatePresence>

      {/* Ambient fireflies */}
      <Fireflies count={memories.length} />

      {/* Empty state hint */}
      {memories.length === 0 && (
        <motion.text
          x="300"
          y="480"
          textAnchor="middle"
          fill="hsl(150 8% 50%)"
          fontSize="12"
          fontFamily="Inter, sans-serif"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          Plant your first memory seed...
        </motion.text>
      )}
    </svg>
  );
}
