import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Bot,
  ChevronRight
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getCurrentMonthYear } from '../utils/initialData';

interface DashboardProps {
  onOpenAddModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { transactions, budget, lendingEntries, aiInsight, activeAlerts } = useFinance();

  const currentMonth = getCurrentMonthYear();
  const currentMonthTx = transactions.filter(t => t.date.startsWith(currentMonth));
  
  const totalIncome = currentMonthTx
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = currentMonthTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const remainingBalance = Math.max(0, (budget.totalBudget + totalIncome) - totalExpense);
  const percentBudgetUsed = budget.totalBudget > 0 
    ? Math.min(100, Math.round((totalExpense / budget.totalBudget) * 100))
    : 0;

  const pendingLending = lendingEntries.filter(e => e.status === 'PENDING');
  const recentTransactions = [...transactions].slice(0, 5);

  let progressColor = '#10b981';
  let progressBg = 'rgba(16,185,129,0.2)';
  if (percentBudgetUsed >= 90) { progressColor = '#f43f5e'; progressBg = 'rgba(244,63,94,0.2)'; }
  else if (percentBudgetUsed >= 75) { progressColor = '#f59e0b'; progressBg = 'rgba(245,158,11,0.2)'; }

  const statCards = [
    {
      id: 'budget',
      label: 'Monthly Budget',
      value: `₹${budget.totalBudget.toLocaleString('en-IN')}`,
      sub: 'Target spending limit',
      icon: Wallet,
      iconClass: 'icon-indigo',
      valueClass: 'text-slate-100',
    },
    {
      id: 'balance',
      label: 'Available Balance',
      value: `₹${remainingBalance.toLocaleString('en-IN')}`,
      sub: 'Budget + Income − Spent',
      icon: IndianRupee,
      iconClass: 'icon-emerald',
      valueClass: 'text-emerald-400 glow-text-emerald',
    },
    {
      id: 'income',
      label: 'Total Income',
      value: `₹${totalIncome.toLocaleString('en-IN')}`,
      sub: <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" />Month inflows</span>,
      icon: TrendingUp,
      iconClass: 'icon-teal',
      valueClass: 'text-teal-300',
    },
    {
      id: 'spent',
      label: 'Total Spent',
      value: `₹${totalExpense.toLocaleString('en-IN')}`,
      sub: <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3" />Month outflows</span>,
      icon: TrendingDown,
      iconClass: 'icon-rose',
      valueClass: 'text-rose-400 glow-text-rose',
    },
  ];

  return (
    <div className="space-y-6 page-section">

      {/* ─── Alert Banner ─── */}
      {activeAlerts.length > 0 && (
        <div
          className="flex items-center justify-between p-4 rounded-2xl animate-fade-in"
          style={{
            background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.06))',
            border: '1px solid rgba(244,63,94,0.25)',
          }}
        >
          <div className="flex items-center gap-3 text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse-glow" />
            <div>
              <p className="text-sm font-bold">Budget Threshold Warning</p>
              <p className="text-xs text-rose-300/80 mt-0.5">{activeAlerts[activeAlerts.length - 1]}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('budget')}
            className="btn btn-sm flex-shrink-0"
            style={{
              background: 'rgba(244,63,94,0.15)',
              border: '1px solid rgba(244,63,94,0.3)',
              color: '#fda4af',
            }}
          >
            Adjust Budget
          </button>
        </div>
      )}

      {/* ─── Stat Cards Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="stat-card">
              {/* Shimmer top accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
              }} />

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">{card.label}</p>
                <div className={`icon-wrap icon-wrap-sm ${card.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className={`stat-value ${card.valueClass}`}>{card.value}</p>
              <p className="stat-label">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ─── Budget Progress ─── */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-200">Monthly Budget Progress</h3>
            <span className="badge" style={{
              background: progressBg,
              color: progressColor,
              border: `1px solid ${progressColor}40`,
            }}>
              {percentBudgetUsed}% used
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono tabular-nums">
            ₹{totalExpense.toLocaleString('en-IN')} of ₹{budget.totalBudget.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Progress track */}
        <div className="progress-track mb-3">
          <div
            className="progress-fill"
            style={{
              width: `${percentBudgetUsed}%`,
              background: `linear-gradient(90deg, ${progressColor}dd, ${progressColor})`,
              boxShadow: `0 0 8px ${progressColor}60`,
            }}
          />
        </div>

        {/* Milestones */}
        <div className="flex justify-between text-[10px] text-slate-600 font-medium">
          <span>0%</span>
          <span>50%</span>
          <span>75% warn</span>
          <span>90% alert</span>
          <span>100%</span>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* AI Intelligence Panel */}
        <div className="lg:col-span-2 card p-5 sm:p-6 space-y-5" style={{ borderColor: 'rgba(99,102,241,0.18)' }}>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-wrap icon-wrap-md" style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))',
                border: '1px solid rgba(99,102,241,0.3)',
              }}>
                <Sparkles className="w-5 h-5 text-indigo-300 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">PocketPilot Intelligence</h2>
                <p className="text-xs text-slate-500 mt-0.5">Smart analysis & runway prediction</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('pocky')}
              className="btn btn-sm flex items-center gap-1.5"
              style={{
                background: 'rgba(139,92,246,0.12)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#c4b5fd',
              }}
              aria-label="Open Pocky AI chat"
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ask Pocky</span>
            </button>
          </div>

          {/* Divider */}
          <div className="divider" />

          {aiInsight ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-xl text-sm text-indigo-200 leading-relaxed"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                {aiInsight.summary}
              </div>

              {/* Depletion date row */}
              <div className="flex items-center justify-between p-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3">
                  <div className="icon-wrap icon-wrap-sm icon-violet">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Predicted Depletion</p>
                    <p className="text-sm font-bold text-slate-200 mt-0.5">{aiInsight.predictedDepletionDate}</p>
                  </div>
                </div>
                {aiInsight.anomalyDetected ? (
                  <span className="badge badge-rose">
                    <AlertTriangle className="w-3 h-3" />
                    Burn Rate High
                  </span>
                ) : (
                  <span className="badge badge-emerald">
                    <CheckCircle2 className="w-3 h-3" />
                    Burn Normal
                  </span>
                )}
              </div>

              {/* Insights grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Spending patterns */}
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <h4 className="section-label">Spending Patterns</h4>
                  </div>
                  <ul className="space-y-2">
                    {aiInsight.insights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Saving tips */}
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
                    <h4 className="section-label">Smart Savings</h4>
                  </div>
                  <ul className="space-y-2">
                    {aiInsight.savingTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-1.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center space-y-3">
              <div className="shimmer w-full h-14 rounded-xl" />
              <div className="shimmer w-full h-10 rounded-xl" />
              <div className="shimmer w-3/4 mx-auto h-10 rounded-xl" />
              <p className="text-xs text-slate-500 mt-2">Generating AI financial insights…</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">

          {/* Ask Pocky Card */}
          <div className="card p-5 space-y-4" style={{ borderColor: 'rgba(139,92,246,0.2)' }}>
            <div className="flex items-center gap-3">
              <div className="icon-wrap icon-wrap-md"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                <Bot className="w-5 h-5 text-white animate-bounce-soft" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Ask Pocky</h3>
                <p className="text-xs text-slate-500 mt-0.5">Your AI finance assistant</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask questions about your spending, get advice, and get budget insights instantly.
            </p>
            <button
              onClick={() => setActiveTab('pocky')}
              className="btn btn-primary w-full btn-sm justify-center"
              aria-label="Start chat with Pocky AI"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Start Chat
            </button>
          </div>

          {/* Debt Reminders */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Debt Reminders</h3>
              </div>
              <button
                onClick={() => setActiveTab('lending')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
                aria-label={`View all ${pendingLending.length} lending entries`}
              >
                All ({pendingLending.length}) <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3">
              {pendingLending.length === 0 ? (
                <div className="py-5 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">No pending reminders</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {pendingLending.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl text-xs transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{item.person}</p>
                        <p className="text-slate-500 mt-0.5">Due: {item.dueDate}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold tabular-nums ${item.type === 'LENT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.type === 'LENT' ? '+' : '−'}₹{item.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-slate-500 mt-0.5">{item.type === 'LENT' ? 'Receivable' : 'Payable'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 className="text-sm font-bold text-slate-200">Recent Activity</h3>
              <button
                onClick={() => setActiveTab('transactions')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium"
                aria-label="View transaction history"
              >
                History <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="p-3">
              {recentTransactions.length === 0 ? (
                <div className="py-5 text-center">
                  <p className="text-xs text-slate-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl text-xs transition-colors hover:bg-white/5 cursor-default"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-semibold text-slate-200 truncate">{tx.categoryName}</p>
                        <p className="text-slate-500 mt-0.5 truncate">{tx.date} · {tx.paymentSource}</p>
                      </div>
                      <span className={`font-bold tabular-nums flex-shrink-0 ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {tx.type === 'INCOME' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
