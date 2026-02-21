import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2 } from 'lucide-react';
import { Memory } from '@/types/memory';

interface LeafNodeProps {
  memory: Memory;
  x: number;
  y: number;
  index: number;
  rotation?: number;
  onClick?: (memory: Memory) => void;
}

const EMOTION_GLOW: Record<string, string> = {
  Happy: 'shadow-[0_0_12px_4px_rgba(52,211,153,0.55)] border-forest-happy/60',
  Sad: 'shadow-[0_0_10px_3px_rgba(147,197,253,0.4)] border-forest-sad/50 saturate-[0.7]',
  Special: 'shadow-[0_0_18px_6px_rgba(245,158,11,0.6)] border-forest-special/70 ring-1 ring-amber-200/30',
  Normal: 'shadow-[0_2px_8px_rgba(0,0,0,0.35)] border-white/20',
};

const LEAF_SIZE = 32;

export function LeafNode({ memory, x, y, index, rotation = 0, onClick }: LeafNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const glowClass = EMOTION_GLOW[memory.emotion] || EMOTION_GLOW.Normal;
  const isSpecial = memory.emotion === 'Special';
  const hasConnections = memory.connections && memory.connections.length > 0;

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
          r={22}
          fill="none"
          stroke="hsl(38 90% 60% / 0.45)"
          strokeWidth={1.5}
          animate={{ r: [18, 26, 18], opacity: [0.8, 0.2, 0.8] }}
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
          className={`cursor-pointer border-2 overflow-hidden transition-transform duration-200 hover:scale-125
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

      {/* Connection badge */}
      {hasConnections && (
        <foreignObject
          x={x + LEAF_SIZE / 2 - 4}
          y={y - LEAF_SIZE / 2 - 4}
          width={18}
          height={18}
          className="overflow-visible"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-[16px] h-[16px] rounded-full bg-accent/80 border border-accent/40 flex items-center justify-center"
            title={`With: ${memory.connections!.join(', ')}`}
          >
            <Link2 className="w-[9px] h-[9px] text-accent-foreground" />
          </motion.div>
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
