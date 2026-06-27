-- Phase 11: Pricing Plan Enforcement

-- 1. Ensure plan_id exists and defaults to 'starter'
-- (It already exists, but we ensure the default is set and existing nulls are migrated)
ALTER TABLE public.tenants ALTER COLUMN plan_id SET DEFAULT 'starter';
UPDATE public.tenants SET plan_id = 'starter' WHERE plan_id IS NULL;

-- 2. Add subscription_status to handle M-Pesa pending states
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 3. Create the function to enforce branch limits
CREATE OR REPLACE FUNCTION public.enforce_branch_limits()
RETURNS TRIGGER AS $$
DECLARE
    v_plan_id TEXT;
    v_branch_limit INT;
    v_current_branches INT;
BEGIN
    -- Acquire a row-level lock on the tenant to prevent race conditions during concurrent inserts
    SELECT plan_id INTO v_plan_id
    FROM public.tenants
    WHERE id = NEW.tenant_id
    FOR UPDATE;

    -- Determine branch limit based on plan
    IF v_plan_id = 'starter' THEN
        v_branch_limit := 1;
    ELSIF v_plan_id = 'business_pro' THEN
        v_branch_limit := 5;
    ELSE
        -- Enterprise or unknown defaults to high/unlimited
        v_branch_limit := 9999;
    END IF;

    -- Count currently active branches for this tenant
    SELECT COUNT(*) INTO v_current_branches
    FROM public.branches
    WHERE tenant_id = NEW.tenant_id AND is_active = TRUE;

    -- If the new branch pushes the count over the limit (only checking active branches), throw an error
    IF v_current_branches >= v_branch_limit THEN
        RAISE EXCEPTION 'Branch limit reached for the current pricing plan (%). Please upgrade your plan to add more branches.', v_plan_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS check_branch_limit_trigger ON public.branches;
CREATE TRIGGER check_branch_limit_trigger
BEFORE INSERT ON public.branches
FOR EACH ROW
EXECUTE FUNCTION public.enforce_branch_limits();
