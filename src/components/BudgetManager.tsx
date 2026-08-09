import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Bell, 
  History, 
  Check, 
  Tag
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const BudgetManager: React.FC = () => {
  const { 
    budget, 
    updateBudget, 
    categories, 
    addCategory, 
    deleteCategory,
    transactions
  } = useFinance();

  const [newBudgetInput, setNewBudgetInput] = useState<string>(budget.totalBudget.toString());
  const [t50, setT50] = useState<boolean>(budget.alertThresholds.includes(50));
  const [t75, setT75] = useState<boolean>(budget.alertThresholds.includes(75));
  const [t90, setT90] = useState<boolean>(budget.alertThresholds.includes(90));
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryType, setNewCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCategoryColor, setNewCategoryColor] = useState<string>('#6366f1');

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBudget = parseFloat(newBudgetInput);
    if (isNaN(parsedBudget) || parsedBudget <= 0) return;

    const selectedThresholds: number[] = [];
    if (t50) selectedThresholds.push(50);
    if (t75) selectedThresholds.push(75);
    if (t90) selectedThresholds.push(90);

    updateBudget(parsedBudget, selectedThresholds);
    setSaveSuccessMsg('Budget & threshold settings updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    addCategory({
      name: newCategoryName.trim(),
      type: newCategoryType,
      icon: 'Tag',
      color: newCategoryColor,
      isSystem: false
    });

    setNewCategoryName('');
  };

  const pastMonthsMap: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === 'EXPENSE') {
      const monthKey = t.date.substring(0, 7);
      pastMonthsMap[monthKey] = (pastMonthsMap[monthKey] || 0) + t.amount;
    }
  });

  const pastMonthsList = Object.entries(pastMonthsMap).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Budget & Category Management</h2>
        <p className="text-xs text-slate-400">Set monthly spending limits, configure alert thresholds, and manage custom categories</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Monthly Budget & Alert Settings</h3>
              <p className="text-xs text-slate-400">Reference limit for calculations & warning triggers</p>
            </div>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monthly Spending Budget Limit (₹ INR)
              </label>
              <div className="relative">
                <div className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</div>
                <input
                  type="number"
                  step="100"
                  min="500"
                  value={newBudgetInput}
                  onChange={(e) => setNewBudgetInput(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 glass-input rounded-xl text-base font-bold text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Configure Alert Thresholds</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition ${
                  t50 ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={t50}
                    onChange={(e) => setT50(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <span className="text-xs font-bold">50% Limit</span>
                </label>

                <label className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition ${
                  t75 ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={t75}
                    onChange={(e) => setT75(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span className="text-xs font-bold">75% Limit</span>
                </label>

                <label className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition ${
                  t90 ? 'bg-rose-500/20 border-rose-500/40 text-rose-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={t90}
                    onChange={(e) => setT90(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <span className="text-xs font-bold">90% Limit</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              Update Budget & Alert Settings
            </button>
          </form>
        </div>

        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Category Management</h3>
              <p className="text-xs text-slate-400">Add custom categories for personalized tracking</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Custom category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 py-2 px-3 glass-input rounded-xl text-xs"
              required
            />

            <select
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value as any)}
              className="py-2 px-3 glass-input rounded-xl text-xs bg-slate-900 text-slate-200"
            >
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>

            <input
              type="color"
              value={newCategoryColor}
              onChange={(e) => setNewCategoryColor(e.target.value)}
              className="w-10 h-9 p-0.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-200">{cat.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {cat.type}
                  </span>
                </div>
                {!cat.isSystem && (
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-slate-100">Historical Monthly Spend Archive</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {pastMonthsList.map(([monthKey, spent]) => (
            <div key={monthKey} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-semibold block">{monthKey}</span>
              <span className="text-base font-bold text-slate-100 block">
                ₹{spent.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">Total Monthly Expense Logged</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
