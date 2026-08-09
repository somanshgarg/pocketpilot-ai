import { supabase, isSupabaseConfigured } from './supabase';
import type { Transaction, Category, MonthlyBudget, LendingEntry, AppSettings } from '../types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_SETTINGS, 
  INITIAL_BUDGET, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LENDING 
} from '../utils/initialData';

// ----------------------------------------------------
// TRANSACTIONS DB API
// ----------------------------------------------------
export async function getTransactions(userId: string): Promise<Transaction[]> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const saved = localStorage.getItem('pocketpilot_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions from Postgres:', error);
    const saved = localStorage.getItem('pocketpilot_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  }

  return data.map((item) => ({
    id: item.id,
    type: item.type,
    amount: Number(item.amount),
    date: item.date,
    categoryId: item.category_id,
    categoryName: item.category_name,
    paymentSource: item.payment_source,
    note: item.note || '',
    createdAt: item.created_at,
  }));
}

export async function createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const newTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase || !userId) {
    return newTx;
  }

  const { error } = await supabase.from('transactions').insert([
    {
      id: newTx.id,
      user_id: userId,
      type: newTx.type,
      amount: newTx.amount,
      date: newTx.date,
      category_id: newTx.categoryId,
      category_name: newTx.categoryName,
      payment_source: newTx.paymentSource,
      note: newTx.note,
      created_at: newTx.createdAt,
    },
  ]);

  if (error) {
    console.error('Error inserting transaction into Postgres:', error);
  }

  return newTx;
}

export async function updateTransactionDb(userId: string, tx: Transaction): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('transactions')
    .update({
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      category_id: tx.categoryId,
      category_name: tx.categoryName,
      payment_source: tx.paymentSource,
      note: tx.note,
    })
    .eq('id', tx.id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating transaction in Postgres:', error);
  }
}

export async function deleteTransactionDb(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting transaction in Postgres:', error);
  }
}

// ----------------------------------------------------
// CATEGORIES DB API
// ----------------------------------------------------
export async function getCategories(userId: string): Promise<Category[]> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const saved = localStorage.getItem('pocketpilot_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .or(`user_id.eq.${userId},is_system.eq.true`);

  if (error || !data || data.length === 0) {
    console.error('Error fetching categories from Postgres or empty:', error);
    return DEFAULT_CATEGORIES;
  }

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isSystem: c.is_system,
  }));
}

export async function createCategory(userId: string, cat: Omit<Category, 'id'>): Promise<Category> {
  const newCat: Category = {
    ...cat,
    id: 'cat-' + Date.now(),
  };

  if (!isSupabaseConfigured || !supabase || !userId) return newCat;

  const { error } = await supabase.from('categories').insert([
    {
      id: newCat.id,
      user_id: userId,
      name: newCat.name,
      type: newCat.type,
      icon: newCat.icon,
      color: newCat.color,
      is_system: false,
    },
  ]);

  if (error) console.error('Error inserting category in Postgres:', error);

  return newCat;
}

export async function updateCategoryDb(userId: string, cat: Category): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('categories')
    .update({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    })
    .eq('id', cat.id)
    .eq('user_id', userId);

  if (error) console.error('Error updating category in Postgres:', error);
}

export async function deleteCategoryDb(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) console.error('Error deleting category in Postgres:', error);
}

// ----------------------------------------------------
// BUDGET DB API
// ----------------------------------------------------
export async function getBudget(userId: string, monthYear: string): Promise<MonthlyBudget> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const saved = localStorage.getItem('pocketpilot_budget');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle();

  if (error || !data) {
    return {
      id: 'b-' + monthYear,
      monthYear,
      totalBudget: INITIAL_BUDGET.totalBudget,
      alertThresholds: INITIAL_BUDGET.alertThresholds,
    };
  }

  return {
    id: data.id,
    monthYear: data.month_year,
    totalBudget: Number(data.total_budget),
    alertThresholds: data.alert_thresholds || [50, 75, 90],
  };
}

export async function upsertBudgetDb(userId: string, budget: MonthlyBudget): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase.from('budgets').upsert([
    {
      id: budget.id || `b-${userId}-${budget.monthYear}`,
      user_id: userId,
      month_year: budget.monthYear,
      total_budget: budget.totalBudget,
      alert_thresholds: budget.alertThresholds,
    },
  ], { onConflict: 'user_id,month_year' });

  if (error) console.error('Error upserting budget in Postgres:', error);
}

// ----------------------------------------------------
// LENDING / DEBT DB API
// ----------------------------------------------------
export async function getLendingEntries(userId: string): Promise<LendingEntry[]> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const saved = localStorage.getItem('pocketpilot_lending');
    return saved ? JSON.parse(saved) : INITIAL_LENDING;
  }

  const { data, error } = await supabase
    .from('lending_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error fetching lending entries from Postgres:', error);
    const saved = localStorage.getItem('pocketpilot_lending');
    return saved ? JSON.parse(saved) : INITIAL_LENDING;
  }

  return data.map((item) => ({
    id: item.id,
    person: item.person,
    amount: Number(item.amount),
    type: item.type,
    dueDate: item.due_date,
    status: item.status,
    note: item.note || '',
    createdAt: item.created_at,
  }));
}

export async function createLendingEntry(userId: string, entry: Omit<LendingEntry, 'id' | 'createdAt'>): Promise<LendingEntry> {
  const newEntry: LendingEntry = {
    ...entry,
    id: 'lend-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase || !userId) return newEntry;

  const { error } = await supabase.from('lending_entries').insert([
    {
      id: newEntry.id,
      user_id: userId,
      person: newEntry.person,
      amount: newEntry.amount,
      type: newEntry.type,
      due_date: newEntry.dueDate,
      status: newEntry.status,
      note: newEntry.note,
      created_at: newEntry.createdAt,
    },
  ]);

  if (error) console.error('Error inserting lending entry in Postgres:', error);

  return newEntry;
}

export async function updateLendingStatusDb(userId: string, id: string, status: 'PENDING' | 'SETTLED'): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('lending_entries')
    .update({ status })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) console.error('Error updating lending entry status in Postgres:', error);
}

export async function deleteLendingEntryDb(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const { error } = await supabase
    .from('lending_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) console.error('Error deleting lending entry in Postgres:', error);
}

// ----------------------------------------------------
// USER SETTINGS DB API
// ----------------------------------------------------
export async function getUserSettings(userId: string): Promise<AppSettings> {
  if (!isSupabaseConfigured || !supabase || !userId) {
    const saved = localStorage.getItem('pocketpilot_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return INITIAL_SETTINGS;
  }

  return {
    geminiApiKey: data.gemini_api_key || '',
    currency: data.currency || 'INR',
    userName: data.user_name || 'Alex',
    defaultThresholds: data.default_thresholds || [50, 75, 90],
    proModeEnabled: Boolean(data.pro_mode_enabled),
    selectedModel: data.selected_model || 'gemini-3.5-flash-lite',
  };
}

export async function updateUserSettingsDb(userId: string, settings: Partial<AppSettings>): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const payload: any = { user_id: userId, updated_at: new Date().toISOString() };
  if (settings.geminiApiKey !== undefined) payload.gemini_api_key = settings.geminiApiKey;
  if (settings.currency !== undefined) payload.currency = settings.currency;
  if (settings.userName !== undefined) payload.user_name = settings.userName;
  if (settings.defaultThresholds !== undefined) payload.default_thresholds = settings.defaultThresholds;
  if (settings.proModeEnabled !== undefined) payload.pro_mode_enabled = settings.proModeEnabled;
  if (settings.selectedModel !== undefined) payload.selected_model = settings.selectedModel;

  const { error } = await supabase.from('user_settings').upsert([payload], { onConflict: 'user_id' });

  if (error) console.error('Error updating settings in Postgres:', error);
}
