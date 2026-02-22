import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory } from '@/types/memory';

interface LeafNodeProps {
  memory: Memory;
  x: number;
  y: number;
  index: number;
  rotation?: number;
  onClick?: (memory: Memory) => void | (() => void);
  isVineLeaf?: boolean;
}

const EMOTION_GLOW: Record<string, string> = {
  Happy: 'shadow-[0_0_12px_4px_rgba(52,211,153,0.55)] border-forest-happy/60',
  Sad: 'shadow-[0_0_10px_3px_rgba(147,197,253,0.4)] border-forest-sad/50 saturate-[0.7]',
  Special: 'shadow-[0_0_18px_6px_rgba(245,158,11,0.6)] border-forest-special/70 ring-1 ring-amber-200/30',
  Normal: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-white/20',
};

const CONNECTION_COLORS = [
  'hsl(160 40% 45%)',
  'hsl(200 45% 50%)',
  'hsl(280 40% 55%)',
  'hsl(30 50% 50%)',
  'hsl(340 40% 50%)',
];

export function LeafNode({ memory, x, y, index, rotation = 0, onClick, isVineLeaf = false }: LeafNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const glowClass = EMOTION_GLOW[memory.emotion] || EMOTION_GLOW.Normal;
  const isSpecial = memory.emotion === 'Special';
  const hasConnections = memory.connections && memory.connections.length > 0;

  const LEAF_SIZE = isVineLeaf ? 22 : 32;
  const borderWidth = isVineLeaf ? 'border' : 'border-2';

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: index * 0.06 }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      {/* Pulse ring for special */}
      {isSpecial && (
        <motion.circle
          cx={x}
          cy={y}
          r={isVineLeaf ? 16 : 22}
          fill="none"
          stroke="hsl(38 90% 60% / 0.45)"
          strokeWidth={1.5}
          animate={{ r: [isVineLeaf ? 14 : 18, isVineLeaf ? 20 : 26, isVineLeaf ? 14 : 18], opacity: [0.8, 0.2, 0.8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Leaf shape via foreignObject */}
      <foreignObject
        x={x - LEAF_SIZE / 2}
        y={y - LEAF_SIZE / 2}
        width={LEAF_SIZE + 4}
        height={LEAF_SIZE + 4}
        className="overflow-visible"
        style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${x}px ${y}px` }}
      >
        <div
          className={`cursor-pointer ${borderWidth} overflow-hidden transition-transform duration-200 hover:scale-125
            rounded-tr-[60%] rounded-bl-[60%] rounded-tl-[8px] rounded-br-[8px]
            aspect-square ${glowClass} ${isSpecial ? 'animate-pulse' : ''}`}
          style={{ width: LEAF_SIZE, height: LEAF_SIZE }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={() => onClick?.(memory)}
          title={memory.description}
        >
          <img
            src={memory.imageUrl}
            alt={memory.description}
            className="w-full h-full object-cover"
          />
        </div>
      </foreignObject>

      {/* Connection avatar badges */}
      {hasConnections && (
        <foreignObject
          x={x + LEAF_SIZE / 2 - 6}
          y={y - LEAF_SIZE / 2 - 6}
          width={Math.min(memory.connections!.length, 3) * 14 + 6}
          height={22}
          className="overflow-visible"
        >
          <div className="flex flex-row -space-x-1.5">
            {memory.connections!.slice(0, 3).map((name, i) => (
              <div
                key={name}
                className="flex items-center justify-center rounded-full border border-white/20"
                style={{
                  width: isVineLeaf ? 14 : 18,
                  height: isVineLeaf ? 14 : 18,
                  backgroundColor: CONNECTION_COLORS[i % CONNECTION_COLORS.length],
                  fontSize: isVineLeaf ? 7 : 8,
                  fontWeight: 600,
                  color: 'white',
                  zIndex: 10 - i,
                }}
                title={name}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            ))}
            {memory.connections!.length > 3 && (
              <div
                className="flex items-center justify-center rounded-full border border-white/20"
                style={{
                  width: isVineLeaf ? 14 : 18,
                  height: isVineLeaf ? 14 : 18,
                  backgroundColor: 'hsl(0 0% 30%)',
                  fontSize: isVineLeaf ? 6 : 7,
                  fontWeight: 600,
                  color: 'white',
                }}
              >
                +{memory.connections!.length - 3}
              </div>
            )}
          </div>
        </foreignObject>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <foreignObject
            x={x - 85}
            y={y - 95}
            width={170}
            height={90}
            className="overflow-visible pointer-events-none"
            style={{ zIndex: 100 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl pointer-events-none"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {memory.emotion}
                </p>
                {memory.memoryDate && (
                  <p className="text-[10px] text-muted-foreground/70">
                    · {new Date(memory.memoryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <p className="text-xs text-foreground line-clamp-2">{memory.description}</p>
            </motion.div>
          </foreignObject>
        )}
      </AnimatePresence>
    </motion.g>
  );
}
