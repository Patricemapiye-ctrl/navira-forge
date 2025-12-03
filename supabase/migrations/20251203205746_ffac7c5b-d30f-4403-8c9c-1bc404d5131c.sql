-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone authenticated can view inventory" ON public.inventory;

-- Create new policy allowing public read access for online shop
CREATE POLICY "Public can view inventory"
  ON public.inventory
  FOR SELECT
  USING (true);