import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { DebtType } from '../types';

export const LendingBorrowing: React.FC = () => {
  const { lendingEntries, addLendingEntry, updateLendingStatus, deleteLendingEntry } = useFinance();

  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<DebtType>('LENT');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!person.trim() || isNaN(numAmount) || numAmount <= 0 || !dueDate) return;

    addLendingEntry({
      person: person.trim(),
      amount: numAmount,
      type,
      dueDate,
      status: 'PENDING',
      note
    });

    setPerson('');
    setAmount('');
    setDueDate('');
    setNote('');
  };

  const filteredEntries = lendingEntries.filter(entry => {
    if (filterStatus === 'PENDING') return entry.status === 'PENDING';
    if (filterStatus === 'SETTLED') return entry.status === 'SETTLED';
    return true;
  });

  const totalLentPending = lendingEntries
    .filter(e => e.type === 'LENT' && e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalBorrowedPending = lendingEntries
    .filter(e => e.type === 'BORROWED' && e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Lending & Borrowing Tracker</h2>
          <p className="text-xs text-slate-400">Track money owed to you or money you owe others with repayment due dates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Money Others Owe You (Lent)</span>
            <h3 className="text-2xl font-black text-emerald-400 glow-text-emerald">
              ₹{totalLentPending.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Money You Owe (Borrowed)</span>
            <h3 className="text-2xl font-black text-rose-400 glow-text-rose">
              ₹{totalBorrowedPending.toLocaleString('en-IN')}
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Plus className="w-5 h-5 text-indigo-400" />
            <span>Record New Debt / Loan</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('LENT')}
                className={`py-2 rounded-lg font-bold transition ${
                  type === 'LENT' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                🤝 Lent (Others owe me)
              </button>
              <button
                type="button"
                onClick={() => setType('BORROWED')}
                className={`py-2 rounded-lg font-bold transition ${
                  type === 'BORROWED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400'
                }`}
              >
                💳 Borrowed (I owe them)
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Person Name *</label>
              <input
                type="text"
                placeholder="e.g. Rohan Sharma"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                className="w-full py-2 px-3 glass-input rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full py-2 px-3 glass-input rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Due Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full py-2 px-3 glass-input rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="Reason or notes..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full py-2 px-3 glass-input rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
            >
              Add Debt Record
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Pending & Settled Records</span>
            </h3>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="py-1 px-3 glass-input rounded-lg text-xs bg-slate-900 text-slate-200"
            >
              <option value="ALL">All Records</option>
              <option value="PENDING">Pending Only</option>
              <option value="SETTLED">Settled Only</option>
            </select>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No debt records found matching criteria.</p>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{entry.person}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        entry.type === 'LENT' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {entry.type === 'LENT' ? 'LENT' : 'BORROWED'}
                      </span>
                    </div>
                    <div className="text-slate-400 flex items-center space-x-3 text-[11px]">
                      <span>Due: {entry.dueDate}</span>
                      {entry.note && <span>• {entry.note}</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className={`text-base font-black ${entry.type === 'LENT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {entry.status === 'SETTLED' ? '✅ Settled' : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      {entry.status === 'PENDING' && (
                        <button
                          onClick={() => updateLendingStatus(entry.id, 'SETTLED')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition"
                        >
                          Mark {entry.type === 'LENT' ? 'Collected' : 'Paid'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteLendingEntry(entry.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
