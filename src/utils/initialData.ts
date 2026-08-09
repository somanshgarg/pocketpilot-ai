import type { Category, Transaction, MonthlyBudget, LendingEntry, AppSettings } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food', type: 'EXPENSE', icon: 'Utensils', color: '#f59e0b', isSystem: true },
  { id: 'cat-2', name: 'Transport', type: 'EXPENSE', icon: 'Bus', color: '#3b82f6', isSystem: true },
  { id: 'cat-3', name: 'Shopping', type: 'EXPENSE', icon: 'ShoppingBag', color: '#ec4899', isSystem: true },
  { id: 'cat-4', name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#8b5cf6', isSystem: true },
  { id: 'cat-5', name: 'Education', type: 'EXPENSE', icon: 'GraduationCap', color: '#10b981', isSystem: true },
  { id: 'cat-6', name: 'Bills & Utilities', type: 'EXPENSE', icon: 'Receipt', color: '#ef4444', isSystem: true },
  { id: 'cat-7', name: 'Miscellaneous', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#6b7280', isSystem: true },
  { id: 'cat-8', name: 'Pocket Money', type: 'INCOME', icon: 'Wallet', color: '#10b981', isSystem: true },
  { id: 'cat-9', name: 'Salary & Stipend', type: 'INCOME', icon: 'Briefcase', color: '#059669', isSystem: true },
  { id: 'cat-10', name: 'Freelance & Projects', type: 'INCOME', icon: 'Laptop', color: '#06b6d4', isSystem: true },
  { id: 'cat-11', name: 'Scholarship', type: 'INCOME', icon: 'Award', color: '#6366f1', isSystem: true }
];

export const INITIAL_SETTINGS: AppSettings = {
  geminiApiKey: '',
  currency: 'INR',
  userName: 'Alex',
  defaultThresholds: [50, 75, 90],
  proModeEnabled: false,
  selectedModel: 'gemini-3.5-flash-lite'
};

export const AVAILABLE_GEMINI_MODELS = [
  // ── Gemini 3 (Latest Stable) ──────────────────────────────────────────────
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite ★ (Default – Fastest & Budget-Friendly)', isPro: false },
  { id: 'gemini-3.6-flash',      name: 'Gemini 3.6 Flash (Newest – Balanced Speed & Intelligence)',      isPro: false },
  { id: 'gemini-3.5-flash',      name: 'Gemini 3.5 Flash (Agentic & Coding Tasks)',                       isPro: false },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Frontier-Class, Low Cost)',                isPro: false },
  // ── Gemini 2.5 ────────────────────────────────────────────────────────────
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite (Budget Multimodal)',                       isPro: false },
  { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash (Best Price-Performance + Reasoning)',           isPro: false },
  { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro (Advanced – Complex Tasks & Deep Reasoning)',      isPro: true  },
  // ── Gemini 2.0 (Legacy) ───────────────────────────────────────────────────
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite (Legacy Lightweight)',                      isPro: false },
  { id: 'gemini-2.0-flash',      name: 'Gemini 2.0 Flash (Legacy Production)',                            isPro: false },
];

export const getCurrentMonthYear = (): string => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}`;
};

export const INITIAL_BUDGET: MonthlyBudget = {
  id: 'b-1',
  monthYear: getCurrentMonthYear(),
  totalBudget: 35000,
  alertThresholds: [50, 75, 90]
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    type: 'INCOME',
    amount: 30000,
    date: `${getCurrentMonthYear()}-01`,
    categoryId: 'cat-8',
    categoryName: 'Pocket Money',
    paymentSource: 'UPI',
    note: 'Monthly family allowance received',
    createdAt: new Date(`${getCurrentMonthYear()}-01T09:30:00`).toISOString()
  },
  {
    id: 'tx-2',
    type: 'INCOME',
    amount: 8500,
    date: `${getCurrentMonthYear()}-02`,
    categoryId: 'cat-10',
    categoryName: 'Freelance & Projects',
    paymentSource: 'UPI',
    note: 'UI design project payout',
    createdAt: new Date(`${getCurrentMonthYear()}-02T16:00:00`).toISOString()
  },
  {
    id: 'tx-3',
    type: 'EXPENSE',
    amount: 4200,
    date: `${getCurrentMonthYear()}-02`,
    categoryId: 'cat-6',
    categoryName: 'Bills & Utilities',
    paymentSource: 'UPI',
    note: 'Electricity, High-speed Wifi & Mobile recharge',
    createdAt: new Date(`${getCurrentMonthYear()}-02T18:30:00`).toISOString()
  },
  {
    id: 'tx-4',
    type: 'EXPENSE',
    amount: 1450,
    date: `${getCurrentMonthYear()}-03`,
    categoryId: 'cat-1',
    categoryName: 'Food',
    paymentSource: 'UPI',
    note: 'Weekend dinner at Bistro Grill',
    createdAt: new Date(`${getCurrentMonthYear()}-03T21:15:00`).toISOString()
  },
  {
    id: 'tx-5',
    type: 'EXPENSE',
    amount: 900,
    date: `${getCurrentMonthYear()}-04`,
    categoryId: 'cat-2',
    categoryName: 'Transport',
    paymentSource: 'CASH',
    note: 'Metro card top-up & auto fare',
    createdAt: new Date(`${getCurrentMonthYear()}-04T10:10:00`).toISOString()
  },
  {
    id: 'tx-6',
    type: 'EXPENSE',
    amount: 5800,
    date: `${getCurrentMonthYear()}-06`,
    categoryId: 'cat-3',
    categoryName: 'Shopping',
    paymentSource: 'UPI',
    note: 'Running shoes & denim jacket from Nike',
    createdAt: new Date(`${getCurrentMonthYear()}-06T15:45:00`).toISOString()
  },
  {
    id: 'tx-7',
    type: 'EXPENSE',
    amount: 1200,
    date: `${getCurrentMonthYear()}-08`,
    categoryId: 'cat-4',
    categoryName: 'Entertainment',
    paymentSource: 'UPI',
    note: 'IMAX Movie tickets & snack combo',
    createdAt: new Date(`${getCurrentMonthYear()}-08T20:00:00`).toISOString()
  },
  {
    id: 'tx-8',
    type: 'EXPENSE',
    amount: 2800,
    date: `${getCurrentMonthYear()}-10`,
    categoryId: 'cat-1',
    categoryName: 'Food',
    paymentSource: 'CASH',
    note: 'Supermarket monthly groceries restock',
    createdAt: new Date(`${getCurrentMonthYear()}-10T12:20:00`).toISOString()
  },
  {
    id: 'tx-9',
    type: 'EXPENSE',
    amount: 2200,
    date: `${getCurrentMonthYear()}-12`,
    categoryId: 'cat-5',
    categoryName: 'Education',
    paymentSource: 'UPI',
    note: 'Data structures online textbook & exam fee',
    createdAt: new Date(`${getCurrentMonthYear()}-12T14:00:00`).toISOString()
  },
  {
    id: 'tx-10',
    type: 'EXPENSE',
    amount: 650,
    date: `${getCurrentMonthYear()}-14`,
    categoryId: 'cat-1',
    categoryName: 'Food',
    paymentSource: 'UPI',
    note: 'Swiggy lunch order with roommates',
    createdAt: new Date(`${getCurrentMonthYear()}-14T13:30:00`).toISOString()
  },
  {
    id: 'tx-11',
    type: 'INCOME',
    amount: 4000,
    date: `${getCurrentMonthYear()}-15`,
    categoryId: 'cat-11',
    categoryName: 'Scholarship',
    paymentSource: 'UPI',
    note: 'Merit scholarship quarterly grant',
    createdAt: new Date(`${getCurrentMonthYear()}-15T11:00:00`).toISOString()
  },
  {
    id: 'tx-12',
    type: 'EXPENSE',
    amount: 1850,
    date: `${getCurrentMonthYear()}-16`,
    categoryId: 'cat-2',
    categoryName: 'Transport',
    paymentSource: 'CASH',
    note: 'Cab rides to university campus',
    createdAt: new Date(`${getCurrentMonthYear()}-16T09:40:00`).toISOString()
  },
  {
    id: 'tx-13',
    type: 'EXPENSE',
    amount: 3200,
    date: `${getCurrentMonthYear()}-18`,
    categoryId: 'cat-7',
    categoryName: 'Miscellaneous',
    paymentSource: 'UPI',
    note: 'Gym membership renewal for August',
    createdAt: new Date(`${getCurrentMonthYear()}-18T17:15:00`).toISOString()
  },
  {
    id: 'tx-14',
    type: 'EXPENSE',
    amount: 850,
    date: `${getCurrentMonthYear()}-20`,
    categoryId: 'cat-1',
    categoryName: 'Food',
    paymentSource: 'UPI',
    note: 'Starbucks coffee and bakery snacks',
    createdAt: new Date(`${getCurrentMonthYear()}-20T16:20:00`).toISOString()
  }
];

export const INITIAL_LENDING: LendingEntry[] = [
  {
    id: 'lend-1',
    person: 'Rohan Sharma',
    amount: 2500,
    type: 'LENT',
    dueDate: `${getCurrentMonthYear()}-25`,
    status: 'PENDING',
    note: 'Lent for semester registration fee gap',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lend-2',
    person: 'Ankit Verma',
    amount: 1200,
    type: 'LENT',
    dueDate: `${getCurrentMonthYear()}-28`,
    status: 'PENDING',
    note: 'Lent for concert ticket split',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lend-3',
    person: 'Priya Patel',
    amount: 800,
    type: 'BORROWED',
    dueDate: `${getCurrentMonthYear()}-24`,
    status: 'PENDING',
    note: 'Borrowed for team lunch bill split',
    createdAt: new Date().toISOString()
  },
  {
    id: 'lend-4',
    person: 'Vikram Singh',
    amount: 1500,
    type: 'BORROWED',
    dueDate: `${getCurrentMonthYear()}-15`,
    status: 'SETTLED',
    note: 'Borrowed for printer ink purchase',
    createdAt: new Date().toISOString()
  }
];
