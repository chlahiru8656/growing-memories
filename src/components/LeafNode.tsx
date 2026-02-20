import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Memory } from '@/types/memory';

interface LeafNodeProps {
  memory: Memory;
  x: number;
  y: number;
  index: number;
}

const EMOTION_STYLES: Record<string, string> = {
  Happy: 'bg-forest-happy shadow-[0_0_15px_rgba(52,211,153,0.6)]',
  Sad: 'bg-forest-sad [filter:saturate(0.7)]',
  Special: 'bg-forest-special shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-2 ring-amber-200/40',
  Normal: 'bg-forest-normal shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
};

export function LeafNode({ memory, x, y, index }: LeafNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const emotionClass = EMOTION_STYLES[memory.emotion] || EMOTION_STYLES.Normal;
  const isSpecial = memory.emotion === 'Special';

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: index * 0.05 }}
      style={{ originX: `${x}px`, originY: `${y}px` }}
    >
      {/* Glow ring for special */}
      {isSpecial && (
        <motion.circle
          cx={x}
          cy={y}
          r={22}
          fill="none"
          stroke="hsl(38 90% 60% / 0.4)"
          strokeWidth={2}
          animate={{ r: [20, 26, 20] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Leaf/memory node as foreignObject for rich styling */}
      <foreignObject
        x={x - 18}
        y={y - 18}
        width={36}
        height={36}
        className="overflow-visible"
      >
        <div
          className={`w-9 h-9 rounded-full cursor-pointer transition-transform duration-200 hover:scale-125 border-2 border-white/20 overflow-hidden ${emotionClass} ${isSpecial ? 'animate-pulse' : ''}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          title={memory.description}
        >
          <img
            src={memory.imageUrl}
            alt={memory.description}
            className="w-full h-full object-cover"
          />
        </div>
      </foreignObject>

      {/* Tooltip via foreignObject */}
      <AnimatePresence>
        {showTooltip && (
          <foreignObject
            x={x - 80}
            y={y - 90}
            width={160}
            height={80}
            className="overflow-visible pointer-events-none"
          >
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl pointer-events-none"
            >
              <p className="text-[10px] font-medium text-foreground/80 uppercase tracking-wider mb-0.5">
                {memory.emotion}
              </p>
              <p className="text-xs text-foreground line-clamp-2">{memory.description}</p>
            </motion.div>
          </foreignObject>
        )}
      </AnimatePresence>
    </motion.g>
  );
}
