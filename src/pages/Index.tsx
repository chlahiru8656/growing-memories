import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trees, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Memory, Emotion, UserProfile } from '@/types/memory';
import { PlantSeedForm } from '@/components/PlantSeedForm';
import { MemoryTree } from '@/components/MemoryTree';
import { MemoryModal } from '@/components/MemoryModal';
import { AuthGate } from '@/components/AuthGate';

const EMOTION_BADGE: Record<string, string> = {
  Happy: 'bg-forest-happy/20 text-forest-happy border-forest-happy/30',
  Sad: 'bg-forest-sad/20 text-forest-sad border-forest-sad/30',
  Special: 'bg-forest-special/20 text-forest-special border-forest-special/30',
  Normal: 'bg-forest-normal/20 text-forest-normal border-forest-normal/30',
};

export default function Index() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentMemory, setRecentMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handlePlant = useCallback((data: Omit<Memory, 'id' | 'timestamp'>) => {
    const newMemory: Memory = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMemories((prev) => [...prev, newMemory]);
    setRecentMemory(newMemory);
    setTimeout(() => setRecentMemory(null), 3500);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  if (!user) {
    return <AuthGate onEnter={setUser} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex-shrink-0 h-full overflow-hidden bg-panel border-r border-border"
            style={{ background: 'var(--gradient-panel)' }}
          >
            <div className="w-[340px] h-full flex flex-col p-6">
              <PlantSeedForm onPlant={handlePlant} connections={user.connections} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main canvas area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Trees className="w-5 h-5 text-primary" />
              <h1 className="font-display text-xl text-foreground">{user.name}'s Forest</h1>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Age {user.age}</span>
            {memories.length > 0 && (
              <motion.div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-sm text-foreground font-medium">{memories.length}</span>
                <span className="text-sm text-muted-foreground">
                  {memories.length === 1 ? 'memory' : 'memories'}
                </span>
              </motion.div>
            )}
          </div>
        </header>

        {/* Tree canvas */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          <div className="w-full h-full max-w-3xl">
            <MemoryTree
              memories={memories}
              onLeafClick={setSelectedMemory}
              userAge={user.age}
              userBirthdate={user.birthdate}
            />
          </div>

          {/* Floating "new memory" toast */}
          <AnimatePresence>
            {recentMemory && (
              <motion.div
                key={recentMemory.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border shadow-xl backdrop-blur-sm z-20"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary/40 flex-shrink-0">
                  <img src={recentMemory.imageUrls?.[0] || recentMemory.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">New leaf sprouted! 🌱</p>
                  <p className="text-sm text-foreground font-medium truncate max-w-[200px]">
                    {recentMemory.description}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${EMOTION_BADGE[recentMemory.emotion]}`}>
                  {recentMemory.emotion}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Memory strip at bottom */}
        <AnimatePresence>
          {memories.length > 0 && (
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              className="border-t border-border bg-card/40 backdrop-blur-sm px-6 py-3"
            >
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin">
                <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                  Your leaves:
                </span>
                {memories.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                    className="flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                    title={m.description}
                    onClick={() => setSelectedMemory(m)}
                  >
                    <img src={m.imageUrls?.[0] || m.imageUrl} alt={m.description} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Memory detail modal */}
      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
