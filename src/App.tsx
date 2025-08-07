import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionManager from './components/TransactionManager';
import BudgetManager from './components/BudgetManager';
import ChartsView from './components/ChartsView';
import InsightsPanel from './components/InsightsPanel';
import DataManager from './components/DataManager';
import { DataProvider } from './contexts/DataContext';
import { Wallet, PieChart, Target, Lightbulb, Plus, Edit3, Database } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: Edit3 },
    { id: 'charts', label: 'Analytics', icon: PieChart },
    { id: 'budget', label: 'Budget', icon: Target },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onAddTransaction={() => setShowTransactionForm(true)} />;
      case 'transactions':
        return <TransactionManager />;
      case 'charts':
        return <ChartsView />;
      case 'budget':
        return <BudgetManager />;
      case 'insights':
        return <InsightsPanel />;
      case 'data':
        return <DataManager />;
      default:
        return <Dashboard onAddTransaction={() => setShowTransactionForm(true)} />;
    }
  };

  return (
    <DataProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">FinanceTracker</h1>
                  <p className="text-sm text-gray-500">Smart Financial Management</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowTransactionForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="transition-all duration-300 ease-in-out">
            {renderContent()}
          </div>
        </div>

        {/* Transaction Form Modal */}
        {showTransactionForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <TransactionForm onClose={() => setShowTransactionForm(false)} />
            </div>
          </div>
        )}
      </div>
    </DataProvider>
  );
}

export default App;