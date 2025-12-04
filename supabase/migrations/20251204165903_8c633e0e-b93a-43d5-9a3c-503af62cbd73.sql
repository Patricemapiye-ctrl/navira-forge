-- Company information table (admin editable)
CREATE TABLE public.company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  landline text,
  cell_number text,
  address text,
  city text,
  country text,
  google_maps_url text,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- Anyone can view company info
CREATE POLICY "Public can view company info"
  ON public.company_info FOR SELECT USING (true);

-- Only admins can update company info
CREATE POLICY "Admins can update company info"
  ON public.company_info FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company info"
  ON public.company_info FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company info
INSERT INTO public.company_info (email, landline, cell_number, address, city, country)
VALUES ('info@navirahardware.com', '+1-555-0100', '+1-555-0101', '123 Hardware Street', 'Harare', 'Zimbabwe');

-- Add status column to sales table for order tracking
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS handled_by uuid REFERENCES auth.users(id);
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS handled_at timestamp with time zone;

-- Returns and refunds table
CREATE TABLE public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.sales(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  reason text NOT NULL,
  status text DEFAULT 'pending', -- pending, approved, rejected, completed
  refund_amount numeric,
  warranty_claim boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamp with time zone,
  notes text
);

ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- Users can view their own returns
CREATE POLICY "Users can view own returns"
  ON public.returns FOR SELECT
  USING (auth.uid() = user_id);

-- Staff can view all returns
CREATE POLICY "Staff can view all returns"
  ON public.returns FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Users can create returns for their orders
CREATE POLICY "Users can create returns"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff can update returns
CREATE POLICY "Staff can update returns"
  ON public.returns FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

-- Allow staff to update sales status
CREATE POLICY "Staff can update sales status"
  ON public.sales FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));