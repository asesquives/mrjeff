
-- Enums
CREATE TYPE public.order_status AS ENUM ('received','processing','ready','delivered','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash','yape','pos','bank');
CREATE TYPE public.item_type AS ENUM ('polo','pantalon','camisa','short','vestido','sabana','toalla','otro');
CREATE TYPE public.color_tag AS ENUM ('blanco','color');
CREATE TYPE public.cash_type AS ENUM ('income','expense');
CREATE TYPE public.receipt_type AS ENUM ('boleta','factura');
CREATE TYPE public.receipt_status AS ENUM ('pending','issued');

-- Clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Operators (linked to auth.users via user_id, not FK to keep it loose)
CREATE TABLE public.operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  operator_id uuid REFERENCES public.operators(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'received',
  received_at timestamptz NOT NULL DEFAULT now(),
  promised_at timestamptz,
  delivered_at timestamptz,
  payment_method public.payment_method,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type public.item_type NOT NULL,
  quantity_in integer NOT NULL DEFAULT 0,
  quantity_out integer NOT NULL DEFAULT 0,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  color_tag public.color_tag NOT NULL DEFAULT 'color'
);

-- Cash entries
CREATE TABLE public.cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.cash_type NOT NULL,
  method public.payment_method NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  reference_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Receipts
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  receipt_type public.receipt_type NOT NULL,
  client_name text NOT NULL,
  client_doc text,
  status public.receipt_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Policies: any authenticated user (staff) can do CRUD
CREATE POLICY "auth_all_clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_operators" ON public.operators FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_order_items" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_cash" ON public.cash_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_receipts" ON public.receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger: auto-create operator on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.operators (user_id, name, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes
CREATE INDEX idx_orders_client ON public.orders(client_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_received ON public.orders(received_at DESC);
CREATE INDEX idx_items_order ON public.order_items(order_id);
CREATE INDEX idx_cash_created ON public.cash_entries(created_at DESC);
