import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PendingTag {
  id: string;
  memory_id: string;
  tagged_by_name: string;
  memory_description: string;
  memory_image: string;
  memory_emotion: string;
}

interface TagNotificationsProps {
  userId: string;
  onTagApproved?: () => void;
}

export function TagNotifications({ userId, onTagApproved }: TagNotificationsProps) {
  const [pendingTags, setPendingTags] = useState<PendingTag[]>([]);
  const [open, setOpen] = useState(false);

  const loadPendingTags = useCallback(async () => {
    const { data: tags } = await supabase
      .from('memory_tags')
      .select('*')
      .eq('tagged_user_id', userId)
      .eq('status', 'pending');

    if (!tags || tags.length === 0) { setPendingTags([]); return; }

    const memoryIds = tags.map(t => t.memory_id);
    const taggerIds = tags.map(t => t.tagged_by_user_id);

    const [{ data: memories }, { data: profiles }] = await Promise.all([
      supabase.from('memories').select('id, description, image_url, emotion').in('id', memoryIds),
      supabase.from('profiles').select('user_id, name').in('user_id', taggerIds),
    ]);

    const memMap = new Map(memories?.map(m => [m.id, m]) || []);
    const profMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    setPendingTags(tags.map(t => {
      const mem = memMap.get(t.memory_id);
      return {
        id: t.id,
        memory_id: t.memory_id,
        tagged_by_name: profMap.get(t.tagged_by_user_id) || 'Someone',
        memory_description: mem?.description || '',
        memory_image: mem?.image_url || '',
        memory_emotion: mem?.emotion || 'Normal',
      };
    }));
  }, [userId]);

  useEffect(() => { loadPendingTags(); }, [loadPendingTags]);

  // Poll every 30s for new tags
  useEffect(() => {
    const interval = setInterval(loadPendingTags, 30000);
    return () => clearInterval(interval);
  }, [loadPendingTags]);

  const handleApprove = async (tagId: string) => {
    await supabase.from('memory_tags').update({ status: 'approved' }).eq('id', tagId);
    setPendingTags(prev => prev.filter(t => t.id !== tagId));
    onTagApproved?.();
  };

  const handleReject = async (tagId: string) => {
    await supabase.from('memory_tags').update({ status: 'rejected' }).eq('id', tagId);
    setPendingTags(prev => prev.filter(t => t.id !== tagId));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground relative"
        title="Tag notifications"
      >
        <Bell className="w-4 h-4" />
        {pendingTags.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-[10px] text-accent-foreground rounded-full flex items-center justify-center animate-pulse">
            {pendingTags.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Memory Tags</span>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {pendingTags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No pending tags</p>
              ) : (
                pendingTags.map(tag => (
                  <div key={tag.id} className="px-4 py-3 border-b border-border/50 last:border-0">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        {tag.memory_image ? (
                          <img src={tag.memory_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground font-medium">{tag.tagged_by_name}</span> tagged you
                        </p>
                        <p className="text-xs text-foreground/80 truncate mt-0.5">{tag.memory_description}</p>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleApprove(tag.id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(tag.id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
