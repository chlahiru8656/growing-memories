import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Check, X, Users, Clock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Friend {
  id: string;
  user_id: string;
  name: string;
  friendship_id: string;
  status: 'pending' | 'accepted';
  isIncoming: boolean;
}

interface SearchResult {
  user_id: string;
  name: string;
  already_friend: boolean;
}

interface FriendsPanelProps {
  userId: string;
  onClose: () => void;
}

export function FriendsPanel({ userId, onClose }: FriendsPanelProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  const loadFriends = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (!data) return;

    const friendIds = data.map(f =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );

    if (friendIds.length === 0) {
      setFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name')
      .in('user_id', friendIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.name]) || []);

    setFriends(data.map(f => {
      const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
      return {
        id: friendId,
        user_id: friendId,
        name: profileMap.get(friendId) || 'Unknown',
        friendship_id: f.id,
        status: f.status as 'pending' | 'accepted',
        isIncoming: f.addressee_id === userId,
      };
    }));
  }, [userId]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name')
      .neq('user_id', userId)
      .ilike('name', `%${searchQuery.trim()}%`)
      .limit(10);

    if (profiles) {
      const friendUserIds = new Set(friends.map(f => f.user_id));
      setSearchResults(profiles.map(p => ({
        user_id: p.user_id,
        name: p.name,
        already_friend: friendUserIds.has(p.user_id),
      })));
    }
    setSearching(false);
  }, [searchQuery, userId, friends]);

  useEffect(() => {
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const sendRequest = async (targetUserId: string) => {
    await supabase.from('friendships').insert({
      requester_id: userId,
      addressee_id: targetUserId,
    });
    setSearchQuery('');
    setSearchResults([]);
    loadFriends();
  };

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
    loadFriends();
  };

  const rejectRequest = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    loadFriends();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from('friendships').delete().eq('id', friendshipId);
    loadFriends();
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');
  const pendingIncoming = friends.filter(f => f.status === 'pending' && f.isIncoming);
  const pendingSent = friends.filter(f => f.status === 'pending' && !f.isIncoming);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-foreground">Friends</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 border border-border">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* Search results */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 overflow-hidden"
              >
                {searchResults.map(r => (
                  <div key={r.user_id} className="flex items-center justify-between py-2 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{r.name}</span>
                    </div>
                    {r.already_friend ? (
                      <span className="text-xs text-muted-foreground">Already connected</span>
                    ) : (
                      <button
                        onClick={() => sendRequest(r.user_id)}
                        className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab('friends')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === 'friends' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <UserCheck className="w-3.5 h-3.5 inline mr-1" />
            Friends ({acceptedFriends.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${tab === 'requests' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            Requests
            {pendingIncoming.length > 0 && (
              <span className="absolute -top-0.5 right-4 w-4 h-4 bg-accent text-[10px] text-accent-foreground rounded-full flex items-center justify-center">
                {pendingIncoming.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {tab === 'friends' ? (
            acceptedFriends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No friends yet. Search above to add friends!</p>
            ) : (
              <div className="space-y-2">
                {acceptedFriends.map(f => (
                  <div key={f.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                        {f.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{f.name}</span>
                    </div>
                    <button
                      onClick={() => removeFriend(f.friendship_id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {pendingIncoming.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Incoming</p>
                  {pendingIncoming.map(f => (
                    <div key={f.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-medium text-accent">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">{f.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => acceptRequest(f.friendship_id)} className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => rejectRequest(f.friendship_id)} className="p-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pendingSent.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Sent</p>
                  {pendingSent.map(f => (
                    <div key={f.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                          {f.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-foreground">{f.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Pending</span>
                    </div>
                  ))}
                </div>
              )}
              {pendingIncoming.length === 0 && pendingSent.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
