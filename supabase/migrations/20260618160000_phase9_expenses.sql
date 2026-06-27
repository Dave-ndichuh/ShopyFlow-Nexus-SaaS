-- Phase 9: Expense Tracking

-- 1. Expense Categories Table
CREATE TABLE public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 2. Expenses Table
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
    amount NUMERIC NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_no TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER set_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- RLS Policies
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;

-- Policies for expense_categories
CREATE POLICY "Users can view expense categories of their tenants" ON public.expense_categories FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert expense categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update expense categories" ON public.expense_categories FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete expense categories" ON public.expense_categories FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));

-- Policies for expenses
CREATE POLICY "Users can view expenses of their tenants" ON public.expenses FOR SELECT TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
CREATE POLICY "Users can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (tenant_id = ANY (public.get_user_tenant_ids()));
