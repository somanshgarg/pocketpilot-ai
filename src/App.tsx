import React, { useState } from 'react';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { AskPocky } from './components/AskPocky';
import { TransactionHistory } from './components/TransactionHistory';
import { Analytics } from './components/Analytics';
import { BudgetManager } from './components/BudgetManager';
import { LendingBorrowing } from './components/LendingBorrowing';
import { AISettings } from './components/AISettings';
import { TransactionModal } from './components/TransactionModal';
import type { Transaction } from './types';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsAddModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenAddModal={handleOpenAddModal} 
      />

      <main
        id="main-content"
        className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-10"
        style={{ maxWidth: '1280px' }}
      >
        {activeTab === 'dashboard' && (
          <Dashboard 
            onOpenAddModal={handleOpenAddModal} 
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'pocky' && <AskPocky />}
        {activeTab === 'transactions' && (
          <TransactionHistory 
            onOpenAddModal={handleOpenAddModal} 
            onEditTransaction={handleEditTransaction} 
          />
        )}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'budget' && <BudgetManager />}
        {activeTab === 'lending' && <LendingBorrowing />}
        {activeTab === 'ai-settings' && <AISettings />}
      </main>

      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        editTransaction={editingTransaction}
      />

      {/* Footer — desktop only */}
      <footer className="hidden md:block py-5 text-center" style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: '#334155',
      }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <span>© 2026 <strong className="text-slate-500">PocketPilot AI</strong> · Powered by Google Gemini & Ask Pocky</span>
          <span>INR (₹) · Validated Business Rules</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <FinanceProvider>
      <MainAppContent />
    </FinanceProvider>
  );
}

export default App;
