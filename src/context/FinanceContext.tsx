import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Transaction, Category, MonthlyBudget, LendingEntry, AppSettings, AIInsight } from '../types';
import { 
  DEFAULT_CATEGORIES, 
  INITIAL_SETTINGS, 
  INITIAL_BUDGET, 
  INITIAL_TRANSACTIONS, 
  INITIAL_LENDING,
  getCurrentMonthYear 
} from '../utils/initialData';
import { generateFinancialInsights, testGeminiApiKey, fetchAvailableGeminiModels, type DynamicGeminiModel } from '../services/aiService';
import { useAuth } from './AuthContext';
import {
  getTransactions,
  createTransaction,
  updateTransactionDb,
  deleteTransactionDb,
  getCategories,
  createCategory,
  updateCategoryDb,
  deleteCategoryDb,
  getBudget,
  upsertBudgetDb,
  getLendingEntries,
  createLendingEntry,
  updateLendingStatusDb,
  deleteLendingEntryDb,
  getUserSettings,
  updateUserSettingsDb,
} from '../lib/db';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget;
  lendingEntries: LendingEntry[];
  settings: AppSettings;
  aiInsight: AIInsight | null;
  activeAlerts: string[];
  isLoadingDb: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (cat: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateBudget: (totalBudget: number, alertThresholds?: number[]) => Promise<void>;
  addLendingEntry: (entry: Omit<LendingEntry, 'id' | 'createdAt'>) => Promise<void>;
  updateLendingStatus: (id: string, status: 'PENDING' | 'SETTLED') => Promise<void>;
  deleteLendingEntry: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  refreshAIInsight: () => Promise<void>;
  testApiKey: (apiKey?: string) => Promise<{ success: boolean; message: string; latencyMs?: number; rawError?: string }>;
  fetchDynamicModels: (apiKey?: string) => Promise<{ success: boolean; models: DynamicGeminiModel[]; message?: string }>;
  resetToSampleData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'demo-user-id';

  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [budget, setBudget] = useState<MonthlyBudget>(INITIAL_BUDGET);
  const [lendingEntries, setLendingEntries] = useState<LendingEntry[]>(INITIAL_LENDING);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);

  // ----------------------------------------------------
  // Load data from Postgres DB on login / user change
  // ----------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDb(true);

    const loadPostgresData = async () => {
      try {
        const [txs, cats, bgt, debts, stg] = await Promise.all([
          getTransactions(userId),
          getCategories(userId),
          getBudget(userId, getCurrentMonthYear()),
          getLendingEntries(userId),
          getUserSettings(userId),
        ]);

        if (isMounted) {
          setTransactions(txs);
          setCategories(cats);
          setBudget(bgt);
          setLendingEntries(debts);
          setSettings(stg);
        }
      } catch (err) {
        console.error('Error loading data from Postgres:', err);
      } finally {
        if (isMounted) setIsLoadingDb(false);
      }
    };

    loadPostgresData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // ----------------------------------------------------
  // Calculate Alerts & AI Insights
  // ----------------------------------------------------
  useEffect(() => {
    const currentMonth = getCurrentMonthYear();
    const currentMonthExpenses = transactions.filter(t => t.type === 'EXPENSE' && t.date.startsWith(currentMonth));
    const totalSpent = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const percentUsed = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;

    const alerts: string[] = [];
    const thresholds = budget.alertThresholds || [50, 75, 90];
    
    thresholds.sort((a, b) => a - b).forEach(threshold => {
      if (percentUsed >= threshold) {
        alerts.push(`Notice: You have spent ${percentUsed.toFixed(0)}% of your monthly budget (exceeded ${threshold}% alert threshold).`);
      }
    });

    setActiveAlerts(alerts);

    const activeModel = settings.selectedModel || 'gemini-3.5-flash-lite';

    generateFinancialInsights(
      transactions, 
      budget, 
      categories, 
      settings.geminiApiKey, 
      activeModel
    )
      .then(res => setAiInsight(res))
      .catch(console.error);

  }, [transactions, budget, categories, settings.geminiApiKey, settings.selectedModel]);

  const refreshAIInsight = async () => {
    const activeModel = settings.selectedModel || 'gemini-3.5-flash-lite';
    const res = await generateFinancialInsights(
      transactions, 
      budget, 
      categories, 
      settings.geminiApiKey, 
      activeModel
    );
    setAiInsight(res);
  };

  const testApiKey = async (apiKey?: string) => {
    const activeModel = settings.selectedModel || 'gemini-3.5-flash-lite';
    const res = await testGeminiApiKey(
      apiKey || settings.geminiApiKey, 
      activeModel
    );
    if (res.usedModel && res.usedModel !== settings.selectedModel) {
      await updateSettings({ selectedModel: res.usedModel });
    }
    return res;
  };

  const fetchDynamicModels = async (apiKey?: string) => {
    return await fetchAvailableGeminiModels(apiKey || settings.geminiApiKey);
  };

  // ----------------------------------------------------
  // MUTATIONS (Update Local State & Persist to Postgres)
  // ----------------------------------------------------
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx = await createTransaction(userId, tx);
    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    await updateTransactionDb(userId, updatedTx);
  };

  const deleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    await deleteTransactionDb(userId, id);
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const newCat = await createCategory(userId, cat);
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = async (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
    await updateCategoryDb(userId, updatedCat);
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    await deleteCategoryDb(userId, id);
  };

  const updateBudget = async (totalBudget: number, alertThresholds?: number[]) => {
    const updated: MonthlyBudget = {
      ...budget,
      totalBudget,
      alertThresholds: alertThresholds || budget.alertThresholds,
    };
    setBudget(updated);
    await upsertBudgetDb(userId, updated);
  };

  const addLendingEntry = async (entry: Omit<LendingEntry, 'id' | 'createdAt'>) => {
    const newEntry = await createLendingEntry(userId, entry);
    setLendingEntries(prev => [newEntry, ...prev]);
  };

  const updateLendingStatus = async (id: string, status: 'PENDING' | 'SETTLED') => {
    setLendingEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    await updateLendingStatusDb(userId, id, status);
  };

  const deleteLendingEntry = async (id: string) => {
    setLendingEntries(prev => prev.filter(e => e.id !== id));
    await deleteLendingEntryDb(userId, id);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await updateUserSettingsDb(userId, newSettings);
  };

  const resetToSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setBudget(INITIAL_BUDGET);
    setLendingEntries(INITIAL_LENDING);
    setSettings(INITIAL_SETTINGS);
  };

  return (
    <FinanceContext.Provider value={{
      transactions,
      categories,
      budget,
      lendingEntries,
      settings,
      aiInsight,
      activeAlerts,
      isLoadingDb,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      updateBudget,
      addLendingEntry,
      updateLendingStatus,
      deleteLendingEntry,
      updateSettings,
      refreshAIInsight,
      testApiKey,
      fetchDynamicModels,
      resetToSampleData
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
};
