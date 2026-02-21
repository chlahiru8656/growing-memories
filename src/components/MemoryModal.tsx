import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { Memory } from '@/types/memory';

interface MemoryModalProps {
  memory: Memory | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const EMOTION_BADGE: Record<string, string> = {
  Happy:   'bg-forest-happy/20 text-forest-happy border border-forest-happy/40',
  Sad:     'bg-forest-sad/20 text-forest-sad border border-forest-sad/40',
  Special: 'bg-forest-special/20 text-forest-special border border-forest-special/40',
  Normal:  'bg-forest-normal/20 text-forest-normal border border-forest-normal/40',
};

const EMOTION_EMOJI: Record<string, string> = {
  Happy: '✨', Sad: '💧', Special: '⭐', Normal: '🌿',
};

export function MemoryModal({ memory, onClose, onDelete }: MemoryModalProps) {
  const formattedDate = memory?.memoryDate
    ? new Date(memory.memoryDate + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '';

  const handleDelete = () => {
    if (memory && onDelete) {
      onDelete(memory.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {memory && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div
              className="pointer-events-auto relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(150 18% 10% / 0.92), hsl(180 18% 8% / 0.96))',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
              }}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 transition-colors text-foreground/80 hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Full-size image */}
              <div className="w-full aspect-[4/3] overflow-hidden">
                <img
                  src={memory.imageUrl}
                  alt={memory.description}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 top-[calc(75%-2rem)] h-16 bg-gradient-to-b from-transparent to-[hsl(150_18%_10%/0.92)] pointer-events-none" />
              </div>

              {/* Content */}
              <div className="px-5 pb-5 pt-4 flex flex-col gap-3">
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EMOTION_BADGE[memory.emotion] ?? EMOTION_BADGE.Normal}`}>
                    {EMOTION_EMOJI[memory.emotion]} {memory.emotion}
                  </span>
                  {formattedDate && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-muted-foreground border border-white/10">
                      📅 {formattedDate}
                    </span>
                  )}
                </div>

                {/* Connections */}
                {memory.connections && memory.connections.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">With:</span>
                    {memory.connections.map((c) => (
                      <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground border border-accent/20">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-sm text-foreground/90 leading-relaxed font-body">
                  {memory.description}
                </p>

                {/* Delete button */}
                {onDelete && (
                  <motion.button
                    onClick={handleDelete}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-1 w-full py-2.5 rounded-xl bg-destructive/15 text-destructive border border-destructive/25 hover:bg-destructive/25 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Memory
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
