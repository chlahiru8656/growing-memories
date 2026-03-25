import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trees, Sparkles, ChevronLeft, ChevronRight, LogOut, TreePine, List, Users } from 'lucide-react';
import { Memory, Emotion, UserProfile, calculateAge } from '@/types/memory';
import { PlantSeedForm } from '@/components/PlantSeedForm';
import { MemoryTree3D } from '@/components/MemoryTree3D';
import { MemoryModal } from '@/components/MemoryModal';
import { AuthPage } from '@/components/AuthPage';
import { TimelineView } from '@/components/TimelineView';
import { FriendsPanel } from '@/components/FriendsPanel';
import { TagNotifications } from '@/components/TagNotifications';
import { getDominantSeason } from '@/lib/seasonTheme';
import { supabase } from '@/integrations/supabase/client';

const EMOTION_BADGE: Record<string, string> = {
  Happy: 'bg-forest-happy/20 text-forest-happy border-forest-happy/30',
  Sad: 'bg-forest-sad/20 text-forest-sad border-forest-sad/30',
  Special: 'bg-forest-special/20 text-forest-special border-forest-special/30',
  Normal: 'bg-forest-normal/20 text-forest-normal border-forest-normal/30',
};

const DEFAULT_CONNECTIONS = ['Mom', 'Dad', 'Best Friend', 'Sibling', 'Partner'];

export default function Index() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [recentMemory, setRecentMemory] = useState<Memory | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'timeline'>('tree');
  const [showFriends, setShowFriends] = useState(false);

  // Auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setUser(null);
        setMemories([]);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile and memories when session changes
  useEffect(() => {
    if (!session?.user) return;

    const loadProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile) {
        setUser({
          name: profile.name,
          birthdate: profile.birthdate,
          age: calculateAge(profile.birthdate),
          connections: profile.connections || DEFAULT_CONNECTIONS,
        });
      } else {
        // Create profile from signup metadata
        const meta = session.user.user_metadata;
        const name = meta?.name || 'Forest Explorer';
        const birthdate = meta?.birthdate || '2000-01-01';
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            user_id: session.user.id,
            name,
            birthdate,
            connections: DEFAULT_CONNECTIONS,
          })
          .select()
          .single();

        if (newProfile) {
          setUser({
            name: newProfile.name,
            birthdate: newProfile.birthdate,
            age: calculateAge(newProfile.birthdate),
            connections: newProfile.connections || DEFAULT_CONNECTIONS,
          });
        }
      }
    };

    const loadMemories = async () => {
      // Own memories
      const { data: ownData } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      // Tagged & approved memories from others
      const { data: tagData } = await supabase
        .from('memory_tags')
        .select('memory_id')
        .eq('tagged_user_id', session.user.id)
        .eq('status', 'approved');

      let taggedMemories: any[] = [];
      if (tagData && tagData.length > 0) {
        const taggedIds = tagData.map(t => t.memory_id);
        const { data: tMems } = await supabase
          .from('memories')
          .select('*')
          .in('id', taggedIds);
        taggedMemories = tMems || [];
      }

      const allRaw = [...(ownData || []), ...taggedMemories];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = allRaw.filter(m => { if (seen.has(m.id)) return false; seen.add(m.id); return true; });

      setMemories(unique.map((m: any) => ({
        id: m.id,
        imageUrl: m.image_url,
        imageUrls: m.image_urls || [],
        isCollection: m.is_collection,
        description: m.description,
        emotion: m.emotion as Emotion,
        timestamp: new Date(m.created_at),
        memoryDate: m.memory_date,
        connections: m.connections || undefined,
        isTagged: m.user_id !== session.user.id,
      })));
    };

    loadProfile();
    loadMemories();
  }, [session]);

  const handlePlant = useCallback(async (data: Omit<Memory, 'id' | 'timestamp'> & { taggedUserIds?: string[] }) => {
    if (!session?.user) return;

    const { data: inserted, error } = await supabase
      .from('memories')
      .insert({
        user_id: session.user.id,
        image_url: data.imageUrl,
        image_urls: data.imageUrls,
        is_collection: data.isCollection,
        description: data.description,
        emotion: data.emotion,
        memory_date: data.memoryDate,
        connections: data.connections || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error planting memory:', error);
      return;
    }

    if (inserted) {
      // Create memory tags for tagged friends
      if (data.taggedUserIds && data.taggedUserIds.length > 0) {
        const tagRows = data.taggedUserIds.map(uid => ({
          memory_id: inserted.id,
          tagged_user_id: uid,
          tagged_by_user_id: session.user.id,
        }));
        await supabase.from('memory_tags').insert(tagRows);
      }

      const newMemory: Memory = {
        id: inserted.id,
        imageUrl: inserted.image_url,
        imageUrls: inserted.image_urls || [],
        isCollection: inserted.is_collection,
        description: inserted.description,
        emotion: inserted.emotion as Emotion,
        timestamp: new Date(inserted.created_at),
        memoryDate: inserted.memory_date,
        connections: inserted.connections || undefined,
      };
      setMemories((prev) => [...prev, newMemory]);
      setRecentMemory(newMemory);
      setTimeout(() => setRecentMemory(null), 3500);
    }
  }, [session]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemories([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={{ background: 'var(--gradient-sky)' }}>
        <div className="flex flex-col items-center gap-3">
          <Trees className="w-8 h-8 text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading your forest...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuth={() => {}} />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" style={{ background: 'var(--gradient-sky)' }}>
        <Trees className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const dominantSeason = getDominantSeason(memories);

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

          {/* View toggle + Stats */}
          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center bg-muted rounded-lg p-0.5 border border-border">
              <button
                onClick={() => setViewMode('tree')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'tree' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="Tree View"
              >
                <TreePine className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="Timeline View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs text-muted-foreground">Age {user.age}</span>
            <span className="text-xs text-muted-foreground capitalize">{dominantSeason}</span>
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
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main content: Tree or Timeline */}
        <div className="flex-1 overflow-hidden relative">
          {viewMode === 'tree' ? (
            <MemoryTree3D
              memories={memories}
              onLeafClick={setSelectedMemory}
              userAge={user.age}
              userBirthdate={user.birthdate}
            />
          ) : (
            <TimelineView memories={memories} onMemoryClick={setSelectedMemory} />
          )}

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
          {memories.length > 0 && viewMode === 'tree' && (
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
