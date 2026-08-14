-- Drop existing policy that allows users to modify their own statut
drop policy if exists "modification propre" on public.users;

-- Create new policy that prevents users from modifying statut field
-- Users can only update their own profile, but NOT the statut field
create policy "modification propre (sans statut)" on public.users
  for update using (
    auth.uid() = id and 
    -- Prevent statut modification: statut must remain the same
    statut = old.statut
  );
