-- Phase 2: Generic Domain Refactor

-- 1. Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Catalog Items (Products/Services) Table
CREATE TABLE public.catalog_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'product', -- 'product' or 'service'
    cost_price NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    tax_rate NUMERIC DEFAULT 0,
    track_inventory BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'active',
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- 3. Contacts (Customers/Clients) Table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'customer',
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Vendors (Suppliers) Table
CREATE TABLE public.vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Orders (Transactions/Sales/Jobs) Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    contact_id UUID REFERENCES public.contacts(id),
    user_id UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax_total NUMERIC NOT NULL DEFAULT 0,
    discount_total NUMERIC NOT NULL DEFAULT 0,
    grand_total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'paid', -- 'unpaid', 'partial', 'paid'
    amount_paid NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Order Items Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.catalog_items(id),
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Inventory Balances Table
CREATE TABLE public.inventory_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    quantity NUMERIC NOT NULL DEFAULT 0,
    reorder_threshold NUMERIC DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, branch_id, item_id)
);

-- 8. Inventory Movements Table
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    movement_type TEXT NOT NULL, -- 'sale', 'restock', 'adjustment', 'transfer'
    quantity_change NUMERIC NOT NULL, -- Positive or Negative
    reference_id UUID, -- Optional link to order_id or purchase_order_id
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Turn on RLS for all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Expose to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.catalog_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_balances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;

-- RLS POLICIES --

-- Categories
CREATE POLICY "Users can view categories of their tenants" ON public.categories FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update categories" ON public.categories FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete categories" ON public.categories FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Catalog Items
CREATE POLICY "Users can view items of their tenants" ON public.catalog_items FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert items" ON public.catalog_items FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update items" ON public.catalog_items FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete items" ON public.catalog_items FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Contacts
CREATE POLICY "Users can view contacts of their tenants" ON public.contacts FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert contacts" ON public.contacts FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update contacts" ON public.contacts FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete contacts" ON public.contacts FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Vendors
CREATE POLICY "Users can view vendors of their tenants" ON public.vendors FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert vendors" ON public.vendors FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update vendors" ON public.vendors FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete vendors" ON public.vendors FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Orders
CREATE POLICY "Users can view orders of their tenants" ON public.orders FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update orders" ON public.orders FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete orders" ON public.orders FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Order Items
CREATE POLICY "Users can view order items of their tenants" ON public.order_items FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update order items" ON public.order_items FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete order items" ON public.order_items FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Inventory Balances
CREATE POLICY "Users can view inventory balances" ON public.inventory_balances FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert inventory balances" ON public.inventory_balances FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update inventory balances" ON public.inventory_balances FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete inventory balances" ON public.inventory_balances FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Inventory Movements
CREATE POLICY "Users can view inventory movements" ON public.inventory_movements FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert inventory movements" ON public.inventory_movements FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update inventory movements" ON public.inventory_movements FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete inventory movements" ON public.inventory_movements FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Updated_at triggers
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_catalog_items_updated_at BEFORE UPDATE ON public.catalog_items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_inventory_balances_updated_at BEFORE UPDATE ON public.inventory_balances FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Database Function for updating inventory balances on movement insert
CREATE OR REPLACE FUNCTION public.update_inventory_balance()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.inventory_balances (tenant_id, branch_id, item_id, quantity)
    VALUES (NEW.tenant_id, NEW.branch_id, NEW.item_id, NEW.quantity_change)
    ON CONFLICT (tenant_id, branch_id, item_id)
    DO UPDATE SET 
        quantity = public.inventory_balances.quantity + EXCLUDED.quantity,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_inventory_balance
AFTER INSERT ON public.inventory_movements
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_balance();
