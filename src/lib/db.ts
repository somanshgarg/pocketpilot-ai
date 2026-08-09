import { supabase, isSupabaseConfigured } from './supabase';
import type { Transaction, Category, MonthlyBudget, LendingEntry, AppSettings } from '../types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_SETTINGS, 
  INITIAL_BUDGET, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LENDING 
} from '../utils/initialData';

// Helper to save fallback data locally
function saveLocal<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save to localStorage (${key}):`, err);
  }
}

// ----------------------------------------------------
// TRANSACTIONS DB API
// ----------------------------------------------------
export async function getTransactions(userId: string): Promise<Transaction[]> {
  const saved = localStorage.getItem('pocketpilot_transactions');
  const localData: Transaction[] = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return localData;
  }

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data || data.length === 0) {
      console.warn('Postgres transactions query returned empty or error:', error);
      return localData;
    }

    const fetched: Transaction[] = data.map((item) => ({
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

    saveLocal('pocketpilot_transactions', fetched);
    return fetched;
  } catch (err) {
    console.error('Error fetching transactions from Postgres:', err);
    return localData;
  }
}

export async function createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
  const newTx: Transaction = {
    ...tx,
    id: 'tx-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  // Always update local storage first as guaranteed instant fallback
  const saved = localStorage.getItem('pocketpilot_transactions');
  const list: Transaction[] = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  const updatedList = [newTx, ...list];
  saveLocal('pocketpilot_transactions', updatedList);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return newTx;
  }

  try {
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
      console.error('Error inserting transaction into Postgres:', error.message || error);
    } else {
      console.log('Successfully synced new transaction to Postgres DB');
    }
  } catch (err) {
    console.error('Failed to sync transaction to Postgres DB:', err);
  }

  return newTx;
}

export async function updateTransactionDb(userId: string, tx: Transaction): Promise<void> {
  // Update local storage
  const saved = localStorage.getItem('pocketpilot_transactions');
  const list: Transaction[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.map(t => t.id === tx.id ? tx : t);
  saveLocal('pocketpilot_transactions', updatedList);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
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

    if (error) console.error('Error updating transaction in Postgres:', error);
  } catch (err) {
    console.error('Failed to update transaction in Postgres:', err);
  }
}

export async function deleteTransactionDb(userId: string, id: string): Promise<void> {
  // Update local storage
  const saved = localStorage.getItem('pocketpilot_transactions');
  const list: Transaction[] = saved ? JSON.parse(saved) : [];
  const updatedList = list.filter(t => t.id !== id);
  saveLocal('pocketpilot_transactions', updatedList);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) console.error('Error deleting transaction in Postgres:', error);
  } catch (err) {
    console.error('Failed to delete transaction in Postgres:', err);
  }
}

// ----------------------------------------------------
// CATEGORIES DB API
// ----------------------------------------------------
export async function getCategories(userId: string): Promise<Category[]> {
  const saved = localStorage.getItem('pocketpilot_categories');
  const localCats = saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return localCats;
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_system.eq.true`);

    if (error || !data || data.length === 0) {
      return localCats;
    }

    const fetched: Category[] = data.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isSystem: c.is_system,
    }));

    saveLocal('pocketpilot_categories', fetched);
    return fetched;
  } catch (err) {
    return localCats;
  }
}

export async function createCategory(userId: string, cat: Omit<Category, 'id'>): Promise<Category> {
  const newCat: Category = {
    ...cat,
    id: 'cat-' + Date.now(),
  };

  const saved = localStorage.getItem('pocketpilot_categories');
  const list: Category[] = saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  saveLocal('pocketpilot_categories', [...list, newCat]);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return newCat;

  try {
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
  } catch (err) {
    console.error('Failed inserting category:', err);
  }

  return newCat;
}

export async function updateCategoryDb(userId: string, cat: Category): Promise<void> {
  const saved = localStorage.getItem('pocketpilot_categories');
  const list: Category[] = saved ? JSON.parse(saved) : [];
  saveLocal('pocketpilot_categories', list.map(c => c.id === cat.id ? cat : c));

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    await supabase
      .from('categories')
      .update({ name: cat.name, type: cat.type, icon: cat.icon, color: cat.color })
      .eq('id', cat.id)
      .eq('user_id', userId);
  } catch (err) {
    console.error(err);
  }
}

export async function deleteCategoryDb(userId: string, id: string): Promise<void> {
  const saved = localStorage.getItem('pocketpilot_categories');
  const list: Category[] = saved ? JSON.parse(saved) : [];
  saveLocal('pocketpilot_categories', list.filter(c => c.id !== id));

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);
  } catch (err) {
    console.error(err);
  }
}

// ----------------------------------------------------
// BUDGET DB API
// ----------------------------------------------------
export async function getBudget(userId: string, monthYear: string): Promise<MonthlyBudget> {
  const saved = localStorage.getItem('pocketpilot_budget');
  const localBudget = saved ? JSON.parse(saved) : INITIAL_BUDGET;

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return localBudget;
  }

  try {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', monthYear)
      .maybeSingle();

    if (error || !data) return localBudget;

    const fetched: MonthlyBudget = {
      id: data.id,
      monthYear: data.month_year,
      totalBudget: Number(data.total_budget),
      alertThresholds: data.alert_thresholds || [50, 75, 90],
    };

    saveLocal('pocketpilot_budget', fetched);
    return fetched;
  } catch (err) {
    return localBudget;
  }
}

export async function upsertBudgetDb(userId: string, budget: MonthlyBudget): Promise<void> {
  saveLocal('pocketpilot_budget', budget);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
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
  } catch (err) {
    console.error(err);
  }
}

// ----------------------------------------------------
// LENDING / DEBT DB API
// ----------------------------------------------------
export async function getLendingEntries(userId: string): Promise<LendingEntry[]> {
  const saved = localStorage.getItem('pocketpilot_lending');
  const localLending = saved ? JSON.parse(saved) : INITIAL_LENDING;

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return localLending;
  }

  try {
    const { data, error } = await supabase
      .from('lending_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return localLending;

    const fetched: LendingEntry[] = data.map((item) => ({
      id: item.id,
      person: item.person,
      amount: Number(item.amount),
      type: item.type,
      dueDate: item.due_date,
      status: item.status,
      note: item.note || '',
      createdAt: item.created_at,
    }));

    saveLocal('pocketpilot_lending', fetched);
    return fetched;
  } catch (err) {
    return localLending;
  }
}

export async function createLendingEntry(userId: string, entry: Omit<LendingEntry, 'id' | 'createdAt'>): Promise<LendingEntry> {
  const newEntry: LendingEntry = {
    ...entry,
    id: 'lend-' + Date.now(),
    createdAt: new Date().toISOString(),
  };

  const saved = localStorage.getItem('pocketpilot_lending');
  const list: LendingEntry[] = saved ? JSON.parse(saved) : INITIAL_LENDING;
  saveLocal('pocketpilot_lending', [newEntry, ...list]);

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return newEntry;

  try {
    await supabase.from('lending_entries').insert([
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
  } catch (err) {
    console.error(err);
  }

  return newEntry;
}

export async function updateLendingStatusDb(userId: string, id: string, status: 'PENDING' | 'SETTLED'): Promise<void> {
  const saved = localStorage.getItem('pocketpilot_lending');
  const list: LendingEntry[] = saved ? JSON.parse(saved) : [];
  saveLocal('pocketpilot_lending', list.map(e => e.id === id ? { ...e, status } : e));

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    await supabase.from('lending_entries').update({ status }).eq('id', id).eq('user_id', userId);
  } catch (err) {
    console.error(err);
  }
}

export async function deleteLendingEntryDb(userId: string, id: string): Promise<void> {
  const saved = localStorage.getItem('pocketpilot_lending');
  const list: LendingEntry[] = saved ? JSON.parse(saved) : [];
  saveLocal('pocketpilot_lending', list.filter(e => e.id !== id));

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    await supabase.from('lending_entries').delete().eq('id', id).eq('user_id', userId);
  } catch (err) {
    console.error(err);
  }
}

// ----------------------------------------------------
// USER SETTINGS DB API
// ----------------------------------------------------
export async function getUserSettings(userId: string): Promise<AppSettings> {
  const saved = localStorage.getItem('pocketpilot_settings');
  const localSettings = saved ? JSON.parse(saved) : INITIAL_SETTINGS;

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) {
    return localSettings;
  }

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return localSettings;

    const fetched: AppSettings = {
      geminiApiKey: data.gemini_api_key || '',
      currency: data.currency || 'INR',
      userName: data.user_name || 'Alex',
      defaultThresholds: data.default_thresholds || [50, 75, 90],
      proModeEnabled: Boolean(data.pro_mode_enabled),
      selectedModel: data.selected_model || 'gemini-3.5-flash-lite',
    };

    saveLocal('pocketpilot_settings', fetched);
    return fetched;
  } catch (err) {
    return localSettings;
  }
}

export async function updateUserSettingsDb(userId: string, settings: Partial<AppSettings>): Promise<void> {
  const saved = localStorage.getItem('pocketpilot_settings');
  const current = saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  saveLocal('pocketpilot_settings', { ...current, ...settings });

  if (!isSupabaseConfigured || !supabase || !userId || userId.startsWith('demo')) return;

  try {
    const payload: any = { user_id: userId, updated_at: new Date().toISOString() };
    if (settings.geminiApiKey !== undefined) payload.gemini_api_key = settings.geminiApiKey;
    if (settings.currency !== undefined) payload.currency = settings.currency;
    if (settings.userName !== undefined) payload.user_name = settings.userName;
    if (settings.defaultThresholds !== undefined) payload.default_thresholds = settings.defaultThresholds;
    if (settings.proModeEnabled !== undefined) payload.pro_mode_enabled = settings.proModeEnabled;
    if (settings.selectedModel !== undefined) payload.selected_model = settings.selectedModel;

    await supabase.from('user_settings').upsert([payload], { onConflict: 'user_id' });
  } catch (err) {
    console.error(err);
  }
}
