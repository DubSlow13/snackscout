-- SnackScout Prototype 2
-- Database schema: 8 entities from Level 2 Specification
-- Run this file first on a clean Supabase PostgreSQL project.
-- UUID primary keys are generated automatically unless explicitly supplied.

BEGIN;

-- 1. User
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'shopper',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Product
CREATE TABLE IF NOT EXISTS public.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    flavor TEXT NOT NULL,
    category TEXT NOT NULL,
    barcode TEXT
);

-- 3. Store: each branch is a separate record
CREATE TABLE IF NOT EXISTS public.stores (
    store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name TEXT NOT NULL,
    branch_name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    operating_hours TEXT NOT NULL,
    CONSTRAINT valid_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT valid_longitude CHECK (longitude BETWEEN -180 AND 180)
);

-- 4. Product Report: new reports preserve prior reports
CREATE TABLE IF NOT EXISTS public.product_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(product_id),
    store_id UUID NOT NULL REFERENCES public.stores(store_id),
    user_id UUID NOT NULL REFERENCES public.users(user_id),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    availability_status TEXT NOT NULL,
    description TEXT,
    photo_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Employee Store Association
CREATE TABLE IF NOT EXISTS public.employee_store_associations (
    association_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id),
    store_id UUID NOT NULL REFERENCES public.stores(store_id),
    verification_status TEXT NOT NULL DEFAULT 'pending',
    verified_at TIMESTAMPTZ
);

-- 6. Report Verification
CREATE TABLE IF NOT EXISTS public.report_verifications (
    verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.product_reports(report_id),
    association_id UUID NOT NULL REFERENCES public.employee_store_associations(association_id),
    verification_status TEXT NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT
);

-- 7. Favorite: store_id NULL means product in any store
CREATE TABLE IF NOT EXISTS public.favorites (
    favorite_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id),
    product_id UUID NOT NULL REFERENCES public.products(product_id),
    store_id UUID REFERENCES public.stores(store_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Alert Preference
CREATE TABLE IF NOT EXISTS public.alert_preferences (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id),
    product_id UUID NOT NULL REFERENCES public.products(product_id),
    store_id UUID REFERENCES public.stores(store_id),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('restock', 'price_change')),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lock down direct access to these public-schema tables.
-- The local Express API will use the Supabase service-role key on the SERVER only.
-- No anon/authenticated policies have been granted yet.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_store_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

COMMIT;
