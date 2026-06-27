-- Phase 8: Shift & Cash Drawer Management

-- 1. Shifts Table
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'closed'
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    starting_cash NUMERIC NOT NULL DEFAULT 0,
    expected_cash NUMERIC DEFAULT 0,
    actual_cash NUMERIC DEFAULT 0,
    discrepancy NUMERIC DEFAULT 0,
    notes TEXT
);

-- 2. Cash Movements Table (Pay Ins / Pay Outs)
CREATE TABLE public.cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'pay_in', 'pay_out'
    amount NUMERIC NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Alter Orders to track shift
ALTER TABLE public.orders ADD COLUMN shift_id UUID REFERENCES public.shifts(id);

-- RLS Policies
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shifts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;

-- Policies for shifts
CREATE POLICY "Users can view shifts of their tenants" ON public.shifts FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert shifts" ON public.shifts FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update shifts" ON public.shifts FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Policies for cash movements
CREATE POLICY "Users can view cash movements of their tenants" ON public.cash_movements FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert cash movements" ON public.cash_movements FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
