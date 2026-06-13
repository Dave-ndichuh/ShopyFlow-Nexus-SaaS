-- Phase 3: Terminology & Billing Schema

-- 1. Alter tenants table
ALTER TABLE public.tenants 
  ADD COLUMN IF NOT EXISTS industry VARCHAR(50) DEFAULT 'Generic',
  ADD COLUMN IF NOT EXISTS terminology JSONB DEFAULT '{"contacts": "Contacts", "catalog": "Catalog", "orders": "Orders", "vendors": "Vendors", "pos": "Sales / POS"}'::jsonb,
  ADD COLUMN IF NOT EXISTS saas_paybill VARCHAR(20) DEFAULT '5907004',
  ADD COLUMN IF NOT EXISTS saas_till_number VARCHAR(20) DEFAULT '3706334',
  ADD COLUMN IF NOT EXISTS saas_consumer_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS saas_consumer_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS saas_callback_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pos_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pos_paybill VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pos_till_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pos_consumer_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pos_consumer_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pos_callback_url VARCHAR(255);

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) NOT NULL DEFAULT 'Standard',
    status VARCHAR(20) NOT NULL DEFAULT 'Trial',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their tenant subscriptions' AND tablename = 'subscriptions'
    ) THEN
        CREATE POLICY "Users can view their tenant subscriptions" 
            ON public.subscriptions FOR SELECT 
            USING (tenant_id = ANY(get_user_tenant_ids()));
    END IF;
END $$;


-- 3. M-Pesa Transactions tracking (for callbacks)
CREATE TABLE IF NOT EXISTS public.mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    checkout_request_id VARCHAR(100) NOT NULL UNIQUE,
    merchant_request_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    receipt_number VARCHAR(50),
    transaction_date TIMESTAMP WITH TIME ZONE,
    type VARCHAR(20) DEFAULT 'SaaS',
    raw_callback_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for mpesa_transactions
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their mpesa_transactions' AND tablename = 'mpesa_transactions'
    ) THEN
        CREATE POLICY "Users can view their mpesa_transactions" 
            ON public.mpesa_transactions FOR SELECT 
            USING (tenant_id = ANY(get_user_tenant_ids()));
    END IF;
END $$;
