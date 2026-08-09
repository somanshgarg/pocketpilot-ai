import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Wallet, 
  Users, 
  Sparkles, 
  Plus,
  Bell, 
  ShieldAlert,
  Bot,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAddModal }) => {
  const { activeAlerts } = useFinance();
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (alertRef.current && !alertRef.current.contains(e.target as Node)) {
        setShowAlertsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pocky', label: 'Ask Pocky', icon: Bot, isSpecial: true },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'lending', label: 'Debt', icon: Users },
    { id: 'ai-settings', label: 'AI & Settings', icon: Sparkles },
  ];

  // Mobile bottom bar — limit to 5 most important
  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'transactions', label: 'History', icon: Receipt },
    { id: 'pocky', label: 'Pocky', icon: Bot, isSpecial: true },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'budget', label: 'Budget', icon: Wallet },
  ];

  return (
    <>
      {/* ─── Top Header ─── */}
      <header className="sticky top-0 z-40" style={{
        background: 'rgba(8, 12, 23, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px]">

            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none flex-shrink-0"
              onClick={() => setActiveTab('dashboard')}
              role="button"
              aria-label="Go to dashboard"
            >
              {/* Logo mark */}
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
                <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-lg"
                  style={{ boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                  <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold text-white leading-tight tracking-tight">
                  PocketPilot
                  <span className="ml-1 text-xs font-bold text-gradient-brand opacity-90">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 leading-none hidden sm:block">Smart Personal Finance</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
                        : item.isSpecial
                        ? 'text-violet-400 hover:text-violet-200 hover:bg-violet-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    ].join(' ')}
                    style={isActive ? { border: '1px solid rgba(99,102,241,0.3)' } : { border: '1px solid transparent' }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : item.isSpecial ? 'text-violet-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">

              {/* Alert Bell */}
              <div className="relative" ref={alertRef}>
                <button
                  id="alerts-btn"
                  onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
                  className="relative flex items-center justify-center w-9 h-9 rounded-[10px] text-slate-400 hover:text-slate-200 transition-colors duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
                  aria-label={`Budget alerts — ${activeAlerts.length} active`}
                  aria-expanded={showAlertsDropdown}
                >
                  <Bell className="w-4 h-4" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white animate-pulse-glow">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                {/* Alert Dropdown */}
                {showAlertsDropdown && (
                  <div
                    className="absolute right-0 mt-2 w-76 animate-fade-in-scale"
                    style={{
                      background: 'rgba(13,18,36,0.95)',
                      backdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '1rem',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
                      padding: '0',
                      overflow: 'hidden',
                      minWidth: '280px',
                    }}
                    role="dialog"
                    aria-label="Budget alerts"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span className="text-sm font-bold text-slate-100">Budget Alerts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-rose">{activeAlerts.length} Active</span>
                        <button
                          onClick={() => setShowAlertsDropdown(false)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          aria-label="Close alerts"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      {activeAlerts.length === 0 ? (
                        <div className="py-4 text-center">
                          <div className="text-2xl mb-2">✓</div>
                          <p className="text-xs text-slate-400">All budgets are healthy</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {activeAlerts.map((alert, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl text-xs text-rose-200 flex items-start gap-2.5"
                              style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                              <span>{alert}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Add Transaction CTA */}
              <button
                id="add-transaction-btn"
                onClick={onOpenAddModal}
                className="btn btn-primary btn-sm flex items-center gap-1.5"
                aria-label="Add new transaction"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Add</span>
                <span className="hidden sm:inline"> Transaction</span>
              </button>
            </div>
          </div>

          {/* ─── MD Screen Horizontal Scroll Nav ─── */}
          <div className="hidden md:flex lg:hidden items-center gap-1 pb-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={[
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200',
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300'
                      : item.isSpecial
                      ? 'text-violet-400 hover:bg-violet-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  ].join(' ')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ─── Mobile Fixed Bottom Nav (< md) ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 py-1"
        style={{
          background: 'rgba(8,12,23,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={[
                'flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px] rounded-xl transition-all duration-200',
                isActive
                  ? 'text-indigo-400'
                  : item.isSpecial
                  ? 'text-violet-400'
                  : 'text-slate-500'
              ].join(' ')}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className={`p-1 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-500/15' : ''}`}>
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
              </div>
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}

        {/* Quick Add — center floating button */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px]"
          aria-label="Add transaction"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            }}>
            <Plus className="w-5 h-5 text-white" />
          </div>
          <span className="text-[10px] font-medium text-indigo-400">Add</span>
        </button>
      </nav>
    </>
  );
};
