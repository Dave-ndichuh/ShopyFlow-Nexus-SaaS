-- Phase 1: SaaS Foundation Schema

-- 1. Tenants Table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    plan_id TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en-US',
    currency_code TEXT DEFAULT 'KES', -- Priority is M-Pesa/Kenya
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- 2. Tenant Settings Table
CREATE TABLE public.tenant_settings (
    tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    business_labels JSONB DEFAULT '{}',
    tax_settings JSONB DEFAULT '{}',
    receipt_settings JSONB DEFAULT '{}',
    invoice_numbering_rules JSONB DEFAULT '{}',
    date_format TEXT DEFAULT 'YYYY-MM-DD',
    number_format TEXT DEFAULT 'en-US',
    default_dashboard_preferences JSONB DEFAULT '{}',
    feature_overrides JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Roles Table
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 4. Permissions Table
CREATE TABLE public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Role Permissions Table
CREATE TABLE public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY(role_id, permission_id)
);

-- 6. Tenant Memberships Table
CREATE TABLE public.tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id),
    status TEXT NOT NULL DEFAULT 'active',
    invited_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- 7. Branches Table
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    address TEXT,
    phone TEXT,
    manager_user_id UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

-- Expose to authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;

-- Turn on RLS for all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Helper Function for RLS
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT tenant_id 
        FROM public.tenant_memberships 
        WHERE user_id = auth.uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- RLS POLICIES --

-- Tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
    FOR SELECT TO authenticated
    USING (id = ANY (public.get_user_tenant_ids()));

-- Tenant Settings
CREATE POLICY "Users can view settings of their tenants" ON public.tenant_settings
    FOR SELECT TO authenticated
    USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Memberships
CREATE POLICY "Users can view memberships of their tenants" ON public.tenant_memberships
    FOR SELECT TO authenticated
    USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Roles & Permissions
CREATE POLICY "Users can view roles of their tenants" ON public.roles
    FOR SELECT TO authenticated
    USING (tenant_id = ANY (public.get_user_tenant_ids()) OR tenant_id IS NULL);

CREATE POLICY "Users can view permissions" ON public.permissions
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Users can view role permissions" ON public.role_permissions
    FOR SELECT TO authenticated
    USING (
        role_id IN (
            SELECT id FROM public.roles WHERE tenant_id = ANY (public.get_user_tenant_ids()) OR tenant_id IS NULL
        )
    );

-- Branches
CREATE POLICY "Users can view branches of their tenants" ON public.branches
    FOR SELECT TO authenticated
    USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenants_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_tenant_settings_updated_at
BEFORE UPDATE ON public.tenant_settings
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_tenant_memberships_updated_at
BEFORE UPDATE ON public.tenant_memberships
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TRIGGER set_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
