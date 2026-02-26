import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, X } from 'lucide-react';
import { Memory, Emotion, Season, getSeason } from '@/types/memory';

interface TimelineViewProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
}

const EMOTION_OPTIONS: Emotion[] = ['Normal', 'Happy', 'Sad', 'Special'];
const SEASON_OPTIONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const EMOTION_BADGE: Record<string, string> = {
  Happy: 'bg-forest-happy/20 text-forest-happy border-forest-happy/30',
  Sad: 'bg-forest-sad/20 text-forest-sad border-forest-sad/30',
  Special: 'bg-forest-special/20 text-forest-special border-forest-special/30',
  Normal: 'bg-forest-normal/20 text-forest-normal border-forest-normal/30',
};

const EMOTION_EMOJI: Record<string, string> = {
  Happy: '✨', Sad: '💧', Special: '⭐', Normal: '🌿',
};

const SEASON_EMOJI: Record<string, string> = {
  Spring: '🌸', Summer: '☀️', Autumn: '🍂', Winter: '❄️',
};

export function TimelineView({ memories, onMemoryClick }: TimelineViewProps) {
  const [emotionFilter, setEmotionFilter] = useState<Emotion | null>(null);
  const [seasonFilter, setSeasonFilter] = useState<Season | null>(null);

  const filtered = useMemo(() => {
    let result = [...memories];
    if (emotionFilter) result = result.filter((m) => m.emotion === emotionFilter);
    if (seasonFilter) result = result.filter((m) => getSeason(m.memoryDate) === seasonFilter);
    return result.sort((a, b) => new Date(b.memoryDate).getTime() - new Date(a.memoryDate).getTime());
  }, [memories, emotionFilter, seasonFilter]);

  const hasFilters = emotionFilter || seasonFilter;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Filters */}
      <div className="flex flex-col gap-3 p-4 border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filters</span>
          </div>
          {hasFilters && (
            <button
              onClick={() => { setEmotionFilter(null); setSeasonFilter(null); }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Emotion filter */}
        <div className="flex flex-wrap gap-1.5">
          {EMOTION_OPTIONS.map((e) => (
            <button
              key={e}
              onClick={() => setEmotionFilter(emotionFilter === e ? null : e)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                emotionFilter === e
                  ? EMOTION_BADGE[e]
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
              }`}
            >
              {EMOTION_EMOJI[e]} {e}
            </button>
          ))}
        </div>

        {/* Season filter */}
        <div className="flex flex-wrap gap-1.5">
          {SEASON_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSeasonFilter(seasonFilter === s ? null : s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                seasonFilter === s
                  ? 'border-primary bg-primary/15 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
              }`}
            >
              {SEASON_EMOJI[s]} {s}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} of {memories.length} memories
        </span>
      </div>

      {/* Timeline list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-muted-foreground text-sm"
            >
              {memories.length === 0 ? '🌱 No memories yet' : '🔍 No matches for current filters'}
            </motion.div>
          ) : (
            filtered.map((m, i) => {
              const season = getSeason(m.memoryDate);
              const date = new Date(m.memoryDate + 'T00:00:00');
              return (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onMemoryClick(m)}
                  className="flex gap-3 p-3 rounded-xl border border-border bg-card/60 hover:bg-card/90 hover:border-primary/30 cursor-pointer transition-all group"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                    <img
                      src={m.imageUrls?.[0] || m.imageUrl}
                      alt={m.description}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2 leading-snug">{m.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${EMOTION_BADGE[m.emotion]}`}>
                        {EMOTION_EMOJI[m.emotion]} {m.emotion}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {SEASON_EMOJI[season]} {season}
                      </span>
                      {m.isCollection && m.imageUrls.length > 1 && (
                        <span className="text-[10px] text-primary">
                          🌿 {m.imageUrls.length} photos
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
