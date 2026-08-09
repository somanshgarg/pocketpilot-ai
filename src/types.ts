export type TransactionType = 'EXPENSE' | 'INCOME';
export type PaymentSource = 'CASH' | 'UPI';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  paymentSource: PaymentSource;
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'BOTH';
  icon: string;
  color: string;
  isSystem?: boolean;
}

export interface MonthlyBudget {
  id: string;
  monthYear: string; // e.g. "2026-08"
  totalBudget: number;
  alertThresholds: number[]; // e.g. [50, 75, 90]
}

export type DebtType = 'LENT' | 'BORROWED';
export type DebtStatus = 'PENDING' | 'SETTLED';

export interface LendingEntry {
  id: string;
  person: string;
  amount: number;
  type: DebtType;
  dueDate: string;
  status: DebtStatus;
  note?: string;
  createdAt: string;
}

export interface AIInsight {
  healthScore: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  summary: string;
  insights: string[];
  savingTips: string[];
  predictedDepletionDate: string;
  anomalyDetected: boolean;
  lastUpdated: string;
}

export interface AppSettings {
  geminiApiKey: string;
  currency: string;
  userName: string;
  defaultThresholds: number[];
  proModeEnabled: boolean;
  selectedModel: string;
}
