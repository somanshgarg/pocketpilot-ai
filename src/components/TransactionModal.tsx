import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Tag, CreditCard, FileText, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction, TransactionType, PaymentSource } from '../types';
import { autoSuggestCategory } from '../services/aiService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  editTransaction
}) => {
  const { categories, addTransaction, updateTransaction } = useFinance();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [categoryId, setCategoryId] = useState<string>('');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('UPI');
  const [note, setNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setDate(editTransaction.date);
      setCategoryId(editTransaction.categoryId);
      setPaymentSource(editTransaction.paymentSource);
      setNote(editTransaction.note || '');
    } else {
      setType('EXPENSE');
      setAmount('');
      setDate(todayStr);
      const defaultCat = categories.find(c => c.type === 'EXPENSE' || c.type === 'BOTH');
      setCategoryId(defaultCat ? defaultCat.id : (categories[0]?.id || ''));
      setPaymentSource('UPI');
      setNote('');
    }
    setErrorMessage('');
    setIsSubmitting(false);
  }, [editTransaction, isOpen, categories, todayStr]);

  // Focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFieldRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'BOTH');

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNote(val);
    if (!editTransaction && val.trim().length > 2) {
      const suggestedId = autoSuggestCategory(val, categories);
      if (suggestedId) setCategoryId(suggestedId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      return;
    }
    if (!date) {
      setErrorMessage('Please select a valid date.');
      return;
    }
    if (date > todayStr) {
      setErrorMessage('Future dates are not allowed per financial business rules.');
      return;
    }

    setIsSubmitting(true);

    const selectedCat = categories.find(c => c.id === categoryId);
    const categoryName = selectedCat ? selectedCat.name : 'Uncategorized';

    if (editTransaction) {
      updateTransaction({ ...editTransaction, type, amount: numAmount, date, categoryId, categoryName, paymentSource, note });
    } else {
      addTransaction({ type, amount: numAmount, date, categoryId, categoryName, paymentSource, note });
    }

    onClose();
  };

  const isExpense = type === 'EXPENSE';
  const accentColor = isExpense ? '#f43f5e' : '#10b981';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      style={{ background: 'rgba(8,12,23,0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={editTransaction ? 'Edit Transaction' : 'Add Transaction'}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg animate-slide-up sm:animate-fade-in-scale overflow-hidden flex flex-col"
        style={{
          background: 'rgba(13,18,36,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '1.25rem 1.25rem 0 0',
          maxHeight: '92dvh',
        }}
        // For sm+ override to fully rounded
      >
        {/* ─── Modal Header ─── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div className="icon-wrap icon-wrap-sm" style={{
              background: isExpense ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)',
              color: accentColor,
            }}>
              {isExpense ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <h2 className="text-sm font-bold text-slate-100">
              {editTransaction ? 'Edit Transaction' : 'Record Transaction'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* ─── Form ─── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>
          <div className="p-5 space-y-5 overflow-y-auto flex-1">

            {/* Error */}
            {errorMessage && (
              <div
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm text-rose-200 animate-fade-in"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Type Toggle */}
            <div
              className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              role="group"
              aria-label="Transaction type"
            >
              {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => {
                const isSelected = type === t;
                const isExp = t === 'EXPENSE';
                const color = isExp ? '#f43f5e' : '#10b981';
                const bg = isExp ? 'rgba(244,63,94,0.15)' : 'rgba(16,185,129,0.15)';
                const border = isExp ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)';
                const Icon = isExp ? TrendingDown : TrendingUp;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      const defaultCat = categories.find(c => c.type === t || c.type === 'BOTH');
                      if (defaultCat) setCategoryId(defaultCat.id);
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isSelected ? '' : 'text-slate-500 hover:text-slate-300'}`}
                    style={isSelected ? {
                      background: bg,
                      color,
                      border: `1px solid ${border}`,
                    } : { border: '1px solid transparent' }}
                    aria-pressed={isSelected}
                  >
                    <Icon className="w-4 h-4" />
                    {t === 'EXPENSE' ? 'Expense' : 'Income'}
                  </button>
                );
              })}
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="section-label" htmlFor="tx-amount">
                Amount (₹ INR) <span className="text-rose-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">₹</span>
                <input
                  id="tx-amount"
                  ref={firstFieldRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="glass-input pl-8 text-base font-bold tabular-nums"
                  style={{ fontSize: '1.1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                  aria-required="true"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="section-label" htmlFor="tx-category">
                Category <span className="text-rose-400 ml-0.5">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <select
                  id="tx-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="glass-input pl-10 appearance-none"
                  style={{ background: 'rgba(8,12,23,0.7)' }}
                >
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-100">
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Source & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="section-label" htmlFor="tx-payment">Payment Source</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <select
                    id="tx-payment"
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value as PaymentSource)}
                    className="glass-input pl-10 appearance-none"
                    style={{ background: 'rgba(8,12,23,0.7)' }}
                  >
                    <option value="UPI" className="bg-slate-900">UPI</option>
                    <option value="CASH" className="bg-slate-900">Cash</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="section-label" htmlFor="tx-date">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="tx-date"
                    type="date"
                    max={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="glass-input pl-10"
                    style={{ background: 'rgba(8,12,23,0.7)' }}
                  />
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="section-label" htmlFor="tx-note">Note / Description</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="tx-note"
                  type="text"
                  placeholder="e.g. Starbucks coffee, cab fare…"
                  value={note}
                  onChange={handleNoteChange}
                  className="glass-input pl-10"
                />
              </div>
              <p className="text-[10px] text-slate-600 ml-1">
                AI will auto-suggest the category based on your note
              </p>
            </div>
          </div>

          {/* ─── Footer Actions ─── */}
          <div
            className="flex items-center justify-end gap-3 px-5 py-4 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-sm font-semibold text-white min-w-[140px] justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}dd, ${accentColor})`,
                boxShadow: `0 4px 20px ${accentColor}35`,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? (
                <>Saving…</>
              ) : editTransaction ? (
                'Save Changes'
              ) : (
                `Save ${isExpense ? 'Expense' : 'Income'}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
