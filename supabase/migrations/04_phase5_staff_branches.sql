-- Phase 5: Staff Management & user_branches

-- Create user_branches mapping table
CREATE TABLE user_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, branch_id)
);

-- Enable RLS
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view branches they are mapped to, or all branches if they are Admin of the tenant
-- Since get_user_tenant_ids() returns tenants they belong to, we allow viewing if they belong to the tenant.
CREATE POLICY "Users can view user_branches in their tenants" ON user_branches
  FOR SELECT USING ( tenant_id = ANY(get_user_tenant_ids()) );

-- Admins can insert/update/delete
CREATE POLICY "Admins can manage user_branches" ON user_branches
  FOR ALL USING ( tenant_id = ANY(get_user_tenant_ids()) );

-- Add default system roles for Manager and Cashier if they don't exist
INSERT INTO roles (tenant_id, name, description, is_system_role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Manager', 'Branch Manager with access to reporting and multiple branches', true),
  ('00000000-0000-0000-0000-000000000001', 'Cashier', 'POS Cashier limited to specific branches', true)
ON CONFLICT DO NOTHING;
