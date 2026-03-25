
-- Allow tagged users to read memories they're tagged in (approved)
CREATE POLICY "Tagged users can view tagged memories"
  ON public.memories FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memory_tags
      WHERE memory_tags.memory_id = memories.id
        AND memory_tags.tagged_user_id = auth.uid()
        AND memory_tags.status = 'approved'
    )
  );
