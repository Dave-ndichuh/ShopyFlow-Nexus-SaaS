-- Phase 6: Purchase Orders

-- Purchase Orders Table
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Ordered', 'Received', 'Cancelled')),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expected_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES catalog_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED
);

-- Enable RLS
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "Tenants can manage their purchase orders" ON purchase_orders
  FOR ALL USING (tenant_id = ANY(get_user_tenant_ids()));

-- Items policy is linked through the PO's tenant_id, but it's easier to join or just trust the application layer with RLS bypass if using service role, 
-- or we can just query the po_id. For strict RLS without a tenant_id column on items, we check the parent PO:
CREATE POLICY "Tenants can manage their purchase order items" ON purchase_order_items
  FOR ALL USING (
    po_id IN (SELECT id FROM purchase_orders WHERE tenant_id = ANY(get_user_tenant_ids()))
  );
