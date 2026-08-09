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

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budget: MonthlyBudget;
  lendingEntries: LendingEntry[];
  settings: AppSettings;
  aiInsight: AIInsight | null;
  activeAlerts: string[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (cat: Category) => void;
  deleteCategory: (id: string) => void;
  updateBudget: (totalBudget: number, alertThresholds?: number[]) => void;
  addLendingEntry: (entry: Omit<LendingEntry, 'id' | 'createdAt'>) => void;
  updateLendingStatus: (id: string, status: 'PENDING' | 'SETTLED') => void;
  deleteLendingEntry: (id: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  refreshAIInsight: () => Promise<void>;
  testApiKey: (apiKey?: string) => Promise<{ success: boolean; message: string; latencyMs?: number; rawError?: string }>;
  fetchDynamicModels: (apiKey?: string) => Promise<{ success: boolean; models: DynamicGeminiModel[]; message?: string }>;
  resetToSampleData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pocketpilot_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('pocketpilot_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [budget, setBudget] = useState<MonthlyBudget>(() => {
    const saved = localStorage.getItem('pocketpilot_budget');
    return saved ? JSON.parse(saved) : INITIAL_BUDGET;
  });

  const [lendingEntries, setLendingEntries] = useState<LendingEntry[]>(() => {
    const saved = localStorage.getItem('pocketpilot_lending');
    return saved ? JSON.parse(saved) : INITIAL_LENDING;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('pocketpilot_settings');
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('pocketpilot_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('pocketpilot_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('pocketpilot_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('pocketpilot_lending', JSON.stringify(lendingEntries));
  }, [lendingEntries]);

  useEffect(() => {
    localStorage.setItem('pocketpilot_settings', JSON.stringify(settings));
  }, [settings]);

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
      updateSettings({ selectedModel: res.usedModel });
    }
    return res;
  };

  const fetchDynamicModels = async (apiKey?: string) => {
    return await fetchAvailableGeminiModels(apiKey || settings.geminiApiKey);
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...tx,
      id: 'tx-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setTransactions(prev => [newTx, ...prev]);
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...cat,
      id: 'cat-' + Date.now()
    };
    setCategories(prev => [...prev, newCat]);
  };

  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateBudget = (totalBudget: number, alertThresholds?: number[]) => {
    setBudget(prev => ({
      ...prev,
      totalBudget,
      alertThresholds: alertThresholds || prev.alertThresholds
    }));
  };

  const addLendingEntry = (entry: Omit<LendingEntry, 'id' | 'createdAt'>) => {
    const newEntry: LendingEntry = {
      ...entry,
      id: 'lend-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    setLendingEntries(prev => [newEntry, ...prev]);
  };

  const updateLendingStatus = (id: string, status: 'PENDING' | 'SETTLED') => {
    setLendingEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const deleteLendingEntry = (id: string) => {
    setLendingEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
