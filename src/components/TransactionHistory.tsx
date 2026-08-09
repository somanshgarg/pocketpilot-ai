import React, { useState } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  Trash2, 
  Edit3, 
  Plus, 
  Download
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction } from '../types';

interface TransactionHistoryProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  onOpenAddModal,
  onEditTransaction
}) => {
  const { transactions, categories, deleteTransaction } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || tx.categoryId === selectedCategory;
    const matchesType = selectedType === 'ALL' || tx.type === selectedType;
    const matchesPayment = selectedPayment === 'ALL' || tx.paymentSource === selectedPayment;

    return matchesSearch && matchesCategory && matchesType && matchesPayment;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Amount (INR)', 'Payment Source', 'Note'];
    const rows = sortedTransactions.map(t => [
      t.date,
      t.type,
      `"${t.categoryName}"`,
      t.amount,
      t.paymentSource,
      `"${t.note || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pocketpilot_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100">Transaction History</h2>
          <p className="text-xs text-slate-400">View, search, filter, and manage all your financial logs</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by note or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 glass-input rounded-xl text-xs"
            />
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 glass-input rounded-xl text-xs bg-slate-900 text-slate-200"
            >
              <option value="ALL">All Types</option>
              <option value="EXPENSE">Expense Only</option>
              <option value="INCOME">Income Only</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 glass-input rounded-xl text-xs bg-slate-900 text-slate-200"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              className="w-full py-2 px-3 glass-input rounded-xl text-xs bg-slate-900 text-slate-200"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <span className="text-slate-400">
            Showing <strong className="text-slate-200">{sortedTransactions.length}</strong> of {transactions.length} transactions
          </span>
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs py-1 px-2 rounded-lg w-full sm:w-auto"
            >
              <option value="date-desc">Date (Newest First)</option>
              <option value="date-asc">Date (Oldest First)</option>
              <option value="amount-desc">Amount (Highest First)</option>
              <option value="amount-asc">Amount (Lowest First)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List: Mobile Card View (< sm) vs Desktop Table View (>= sm) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        {sortedTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            No matching transactions found. Try resetting your search or filter.
          </div>
        ) : (
          <>
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-slate-800/60">
              {sortedTransactions.map((tx) => (
                <div key={tx.id} className="p-3.5 space-y-2 hover:bg-slate-800/40 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-200">
                        {tx.categoryName}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        tx.paymentSource === 'UPI' ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {tx.paymentSource}
                      </span>
                    </div>
                    <span className={`font-black text-sm ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="truncate max-w-[200px]">{tx.note || tx.date}</span>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span>{tx.date}</span>
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="text-indigo-400 hover:underline font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="text-rose-400 hover:underline font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Note / Description</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-200">
                          {tx.categoryName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.paymentSource === 'UPI' 
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {tx.paymentSource}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {tx.note || <span className="text-slate-500 italic">—</span>}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-black text-sm ${
                        tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-100'
                      }`}>
                        {tx.type === 'INCOME' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition"
                            title="Edit Transaction"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
