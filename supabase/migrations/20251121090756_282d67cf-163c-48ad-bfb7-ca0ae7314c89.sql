-- Drop all policies that depend on app_role
DROP POLICY IF EXISTS "CEOs can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEOs can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEOs can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "CEOs and employees can insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "CEOs and employees can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "CEOs can delete inventory" ON public.inventory;
DROP POLICY IF EXISTS "CEOs and employees can insert sales" ON public.sales;
DROP POLICY IF EXISTS "CEOs and employees can insert sale items" ON public.sale_items;

-- Drop the function
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Now we can safely drop and recreate the enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'employee');

-- Update the user_roles table
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING (CASE WHEN role::text = 'ceo' THEN 'admin'::public.app_role ELSE role::text::public.app_role END);

-- Drop old enum
DROP TYPE public.app_role_old;

-- Recreate the has_role function with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Recreate all policies with new names (Admin instead of CEO)
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and employees can insert inventory" 
ON public.inventory 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins and employees can update inventory" 
ON public.inventory 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins can delete inventory" 
ON public.inventory 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins and employees can insert sales" 
ON public.sales 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Admins and employees can insert sale items" 
ON public.sale_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'employee'::app_role));