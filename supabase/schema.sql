-- ==========================================
-- PocketPilot AI — Supabase Database Schema
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    payment_source TEXT NOT NULL CHECK (payment_source IN ('UPI', 'CASH')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'BOTH')),
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    month_year TEXT NOT NULL,
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    alert_thresholds INT[] DEFAULT ARRAY[50, 75, 90],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, month_year)
);

-- 5. Lending Entries Table
CREATE TABLE IF NOT EXISTS public.lending_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    person TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('LENT', 'BORROWED')),
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SETTLED')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id TEXT PRIMARY KEY,
    gemini_api_key TEXT DEFAULT '',
    currency TEXT DEFAULT 'INR',
    user_name TEXT DEFAULT 'Alex',
    default_thresholds INT[] DEFAULT ARRAY[50, 75, 90],
    pro_mode_enabled BOOLEAN DEFAULT FALSE,
    selected_model TEXT DEFAULT 'gemini-3.5-flash-lite',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable restrictive RLS or allow all operations for authenticated/anon users
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
