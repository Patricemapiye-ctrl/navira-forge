-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('ceo', 'employee');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "CEOs can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "CEOs can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'ceo'));

-- Create inventory table for stock items
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  item_code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  reorder_level INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory
CREATE POLICY "Anyone authenticated can view inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CEOs and employees can insert inventory"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ceo') OR 
    public.has_role(auth.uid(), 'employee')
  );

CREATE POLICY "CEOs and employees can update inventory"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'ceo') OR 
    public.has_role(auth.uid(), 'employee')
  );

CREATE POLICY "CEOs can delete inventory"
  ON public.inventory FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'ceo'));

-- Create sales table for transactions
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  customer_name TEXT,
  customer_contact TEXT,
  sold_by UUID REFERENCES auth.users(id),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales
CREATE POLICY "Anyone authenticated can view sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CEOs and employees can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ceo') OR 
    public.has_role(auth.uid(), 'employee')
  );

-- Create sale_items table for line items
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES public.inventory(id) NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on sale_items
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for sale_items
CREATE POLICY "Anyone authenticated can view sale items"
  ON public.sale_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "CEOs and employees can insert sale items"
  ON public.sale_items FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'ceo') OR 
    public.has_role(auth.uid(), 'employee')
  );

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updated_at
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate sale number
CREATE OR REPLACE FUNCTION public.generate_sale_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.sales;
  
  RETURN 'SALE-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;