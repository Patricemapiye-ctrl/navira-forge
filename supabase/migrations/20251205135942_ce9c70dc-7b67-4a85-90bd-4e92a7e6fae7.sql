-- Add image_url column to inventory table
ALTER TABLE public.inventory
ADD COLUMN image_url text;