import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AcceptedFriend {
  user_id: string;
  name: string;
}

interface FriendTagPickerProps {
  userId: string;
  selectedIds: string[];
  onToggle: (userId: string) => void;
}

export function FriendTagPicker({ userId, selectedIds, onToggle }: FriendTagPickerProps) {
  const [friends, setFriends] = useState<AcceptedFriend[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (!data || data.length === 0) { setFriends([]); return; }

      const friendIds = data.map(f => f.requester_id === userId ? f.addressee_id : f.requester_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', friendIds);

      setFriends(profiles?.map(p => ({ user_id: p.user_id, name: p.name })) || []);
    };
    load();
  }, [userId]);

  if (friends.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" />
        Tag Friends
      </label>
      <div className="flex flex-wrap gap-2">
        {friends.map(f => {
          const selected = selectedIds.includes(f.user_id);
          return (
            <motion.button
              key={f.user_id}
              type="button"
              onClick={() => onToggle(f.user_id)}
              whileTap={{ scale: 0.95 }}
              className={`text-xs py-1.5 px-3 rounded-full border transition-all duration-200 flex items-center gap-1 ${
                selected
                  ? 'border-accent bg-accent/20 text-accent-foreground'
                  : 'border-border bg-muted/40 text-muted-foreground hover:border-border/80'
              }`}
            >
              {selected && <Check className="w-3 h-3" />}
              {f.name}
            </motion.button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <p className="text-[10px] text-muted-foreground">Tagged friends must approve before the memory appears on their tree</p>
      )}
    </div>
  );
}
