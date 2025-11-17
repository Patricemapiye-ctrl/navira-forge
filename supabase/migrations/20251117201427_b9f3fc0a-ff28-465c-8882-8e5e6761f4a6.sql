-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix search_path for generate_sale_number function
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.sales;
  
  RETURN 'SALE-' || LPAD(next_num::TEXT, 6, '0');
END;
$$;