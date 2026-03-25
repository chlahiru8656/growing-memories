
-- Friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Memory tags table
CREATE TABLE public.memory_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  tagged_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tagged_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(memory_id, tagged_user_id)
);

-- RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can insert friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they received"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- RLS on memory_tags
ALTER TABLE public.memory_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags involving them"
  ON public.memory_tags FOR SELECT
  USING (auth.uid() = tagged_user_id OR auth.uid() = tagged_by_user_id);

CREATE POLICY "Users can insert tags they create"
  ON public.memory_tags FOR INSERT
  WITH CHECK (auth.uid() = tagged_by_user_id);

CREATE POLICY "Tagged users can update their tags"
  ON public.memory_tags FOR UPDATE
  USING (auth.uid() = tagged_user_id);

CREATE POLICY "Tag creators can delete tags"
  ON public.memory_tags FOR DELETE
  USING (auth.uid() = tagged_by_user_id);

-- Triggers for updated_at
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Make profiles name searchable by other users (for friend search)
CREATE POLICY "Authenticated users can search profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
