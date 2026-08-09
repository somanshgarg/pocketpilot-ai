import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { PieChart as PieIcon, TrendingUp, CreditCard, BarChart2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getCurrentMonthYear } from '../utils/initialData';

const COLOR_PALETTE = ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];

export const Analytics: React.FC = () => {
  const { transactions } = useFinance();
  const currentMonth = getCurrentMonthYear();

  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  const dailySpendMap: Record<string, { date: string; Expense: number; Income: number }> = {};

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    const dayStr = String(i).padStart(2, '0');
    const fullDateStr = `${currentMonth}-${dayStr}`;
    dailySpendMap[fullDateStr] = { date: `${dayStr} Aug`, Expense: 0, Income: 0 };
  }

  currentMonthTx.forEach(t => {
    if (dailySpendMap[t.date]) {
      if (t.type === 'EXPENSE') dailySpendMap[t.date].Expense += t.amount;
      if (t.type === 'INCOME') dailySpendMap[t.date].Income += t.amount;
    }
  });

  const dailyTrendData = Object.values(dailySpendMap);

  const categorySpendMap: Record<string, number> = {};
  currentMonthTx
    .filter(t => t.type === 'EXPENSE')
    .forEach(t => {
      categorySpendMap[t.categoryName] = (categorySpendMap[t.categoryName] || 0) + t.amount;
    });

  const categoryPieData = Object.entries(categorySpendMap).map(([name, value]) => ({
    name,
    value
  }));

  const weeklyData = [
    { week: 'W1 (1-7)', Expense: 0 },
    { week: 'W2 (8-14)', Expense: 0 },
    { week: 'W3 (15-21)', Expense: 0 },
    { week: 'W4 (22-31)', Expense: 0 }
  ];

  currentMonthTx.filter(t => t.type === 'EXPENSE').forEach(t => {
    const day = parseInt(t.date.split('-')[2], 10);
    if (day <= 7) weeklyData[0].Expense += t.amount;
    else if (day <= 14) weeklyData[1].Expense += t.amount;
    else if (day <= 21) weeklyData[2].Expense += t.amount;
    else weeklyData[3].Expense += t.amount;
  });

  let upiTotal = 0;
  let cashTotal = 0;
  currentMonthTx.filter(t => t.type === 'EXPENSE').forEach(t => {
    if (t.paymentSource === 'UPI') upiTotal += t.amount;
    else cashTotal += t.amount;
  });

  const paymentSplitData = [
    { name: 'UPI', value: upiTotal, color: '#8b5cf6' },
    { name: 'Cash', value: cashTotal, color: '#10b981' }
  ];

  const totalIncome = currentMonthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentMonthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  const incomeVsExpenseData = [
    { name: 'Inflow', Income: totalIncome, Expense: 0 },
    { name: 'Outflow', Income: 0, Expense: totalExpense }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100">Financial Reports & Analytics</h2>
        <p className="text-xs text-slate-400">Interactive visual charts for spending trends, category splits, and payment methods</p>
      </div>

      <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-slate-100">Daily Spending & Income Trend</h3>
        </div>
        
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyTrendData}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} interval="preserveStartEnd" />
              <YAxis stroke="#64748b" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} 
                formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <PieIcon className="w-5 h-5 text-purple-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">Spending by Category</h3>
          </div>

          <div className="h-56 sm:h-64 w-full">
            {categoryPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">No expense data available for pie chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {categoryPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <BarChart2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">Weekly Expense Breakdown</h3>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                />
                <Bar dataKey="Expense" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <CreditCard className="w-5 h-5 text-teal-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">Cash vs. UPI Split</h3>
          </div>

          <div className="h-48 sm:h-56 w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentSplitData}
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString('en-IN')}`}
                >
                  {paymentSplitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
            <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">Income vs. Expense Overview</h3>
          </div>

          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
