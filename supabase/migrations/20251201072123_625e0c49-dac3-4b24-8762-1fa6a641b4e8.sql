-- Add user_id and is_online columns to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS user_id uuid,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_is_online ON public.sales(is_online);

-- Update RLS policy to allow customers to view their own online orders
DROP POLICY IF EXISTS "Anyone authenticated can view sales" ON public.sales;

CREATE POLICY "Staff can view all sales"
ON public.sales FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Customers can view own online orders"
ON public.sales FOR SELECT
USING (is_online = true AND user_id = auth.uid());