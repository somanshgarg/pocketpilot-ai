-- ==========================================
-- PocketPilot AI — Supabase Database Schema
-- ==========================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    total_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
    alert_thresholds INT[] DEFAULT ARRAY[50, 75, 90],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, month_year)
);

-- 5. Lending Entries (Debts & Loans) Table
CREATE TABLE IF NOT EXISTS public.lending_entries (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gemini_api_key TEXT DEFAULT '',
    currency TEXT DEFAULT 'INR',
    user_name TEXT DEFAULT 'Alex',
    default_thresholds INT[] DEFAULT ARRAY[50, 75, 90],
    pro_mode_enabled BOOLEAN DEFAULT FALSE,
    selected_model TEXT DEFAULT 'gemini-3.5-flash-lite',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- Row Level Security (RLS) Policies
-- ==========================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lending_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions" 
ON public.transactions FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Users can manage their own categories" 
ON public.categories FOR ALL 
USING (auth.uid() = user_id OR is_system = true) 
WITH CHECK (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Users can manage their own budgets" 
ON public.budgets FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Lending Entries Policies
CREATE POLICY "Users can manage their own lending entries" 
ON public.lending_entries FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "Users can manage their own settings" 
ON public.user_settings FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- Default Seed Data Function (Run upon new user signup)
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user_seed()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert Default User Settings
    INSERT INTO public.user_settings (user_id, user_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Alex'));

    -- Insert Default Categories for User
    INSERT INTO public.categories (id, user_id, name, type, icon, color, is_system) VALUES
    ('cat-1-' || NEW.id, NEW.id, 'Food', 'EXPENSE', 'Utensils', '#f59e0b', true),
    ('cat-2-' || NEW.id, NEW.id, 'Transport', 'EXPENSE', 'Bus', '#3b82f6', true),
    ('cat-3-' || NEW.id, NEW.id, 'Shopping', 'EXPENSE', 'ShoppingBag', '#ec4899', true),
    ('cat-4-' || NEW.id, NEW.id, 'Entertainment', 'EXPENSE', 'Film', '#8b5cf6', true),
    ('cat-5-' || NEW.id, NEW.id, 'Education', 'EXPENSE', 'GraduationCap', '#10b981', true),
    ('cat-6-' || NEW.id, NEW.id, 'Bills & Utilities', 'EXPENSE', 'Receipt', '#ef4444', true),
    ('cat-7-' || NEW.id, NEW.id, 'Miscellaneous', 'EXPENSE', 'MoreHorizontal', '#6b7280', true),
    ('cat-8-' || NEW.id, NEW.id, 'Pocket Money', 'INCOME', 'Wallet', '#10b981', true),
    ('cat-9-' || NEW.id, NEW.id, 'Salary & Stipend', 'INCOME', 'Briefcase', '#059669', true),
    ('cat-10-' || NEW.id, NEW.id, 'Freelance & Projects', 'INCOME', 'Laptop', '#06b6d4', true),
    ('cat-11-' || NEW.id, NEW.id, 'Scholarship', 'INCOME', 'Award', '#6366f1', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically populate defaults for new registered users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_seed();
