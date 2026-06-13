-- Supabase Seed Script for Nexus SaaS
-- This script sets up a demo tenant and populates sample data.

-- 1. Create a Demo Tenant
INSERT INTO public.tenants (id, name, slug, status, plan_id, currency_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Tech Retail', 'demo-tech-retail', 'active', 'pro', 'KES')
ON CONFLICT (id) DO NOTHING;

-- 2. Create Tenant Settings
INSERT INTO public.tenant_settings (tenant_id, business_labels)
VALUES ('00000000-0000-0000-0000-000000000001', '{"customer": "Client", "catalog": "Products"}')
ON CONFLICT (tenant_id) DO NOTHING;

-- 3. Create a Branch
INSERT INTO public.branches (id, tenant_id, name, code, address, phone)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Nairobi HQ', 'NRB-HQ', 'Westlands, Nairobi', '+254700000000')
ON CONFLICT (id) DO NOTHING;

-- 4. Create an Admin User
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@nexus.demo',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create Role & Membership
INSERT INTO public.roles (id, tenant_id, name, description, is_system_role)
VALUES ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Admin', 'Full access', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_memberships (id, user_id, tenant_id, role_id, status)
VALUES ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Categories
INSERT INTO public.categories (id, tenant_id, name)
VALUES 
('55555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000001', 'Laptops'),
('55555555-5555-5555-5555-555555555552', '00000000-0000-0000-0000-000000000001', 'Accessories')
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Catalog Items
INSERT INTO public.catalog_items (id, tenant_id, category_id, name, sku, description, cost_price, selling_price, track_inventory)
VALUES 
('66666666-6666-6666-6666-666666666661', '00000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555551', 'MacBook Pro M3', 'MBP-M3-14', 'Apple MacBook Pro 14-inch M3', 150000, 200000, TRUE),
('66666666-6666-6666-6666-666666666662', '00000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555552', 'Logitech MX Master 3S', 'LOG-MX3S', 'Wireless Performance Mouse', 8000, 12000, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Inventory (Using movements to trigger balances)
INSERT INTO public.inventory_movements (id, tenant_id, branch_id, item_id, movement_type, quantity_change, notes)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666661', 'restock', 10, 'Initial Stock'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666662', 'restock', 25, 'Initial Stock');

-- 9. Insert Contacts & Vendors
INSERT INTO public.contacts (id, tenant_id, type, first_name, last_name, email, phone)
VALUES ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001', 'customer', 'John', 'Doe', 'john@example.com', '+254711111111')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.vendors (id, tenant_id, name, contact_name, email)
VALUES ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001', 'Tech Distributions Ltd', 'Jane Smith', 'jane@techdist.com')
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Sample Order
INSERT INTO public.orders (id, tenant_id, branch_id, contact_id, status, subtotal, grand_total, payment_method)
VALUES ('99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'completed', 212000, 212000, 'M-Pesa')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (id, tenant_id, order_id, item_id, quantity, unit_price, subtotal)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666661', 1, 200000, 200000),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '66666666-6666-6666-6666-666666666662', 1, 12000, 12000);

-- Trigger inventory movement for the sale
INSERT INTO public.inventory_movements (id, tenant_id, branch_id, item_id, movement_type, quantity_change, reference_id, notes)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666661', 'sale', -1, '99999999-9999-9999-9999-999999999999', 'Sale'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666662', 'sale', -1, '99999999-9999-9999-9999-999999999999', 'Sale');
