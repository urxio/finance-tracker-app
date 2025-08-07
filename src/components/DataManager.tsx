import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import CSVImport from './CSVImport';

const DataManager: React.FC = () => {
  const { state, clearAllData, exportData, importData } = useData();
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'csv-import'>('overview');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    
    const success = importData(importText);
    if (success) {
      setImportStatus('success');
      setImportText('');
      setTimeout(() => setImportStatus('idle'), 3000);
    } else {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  const handleClearData = () => {
    clearAllData();
    setShowClearConfirm(false);
  };

  const getDataStats = () => {
    const totalTransactions = state.transactions.length;
    const totalBudgets = state.budgets.length;
    const totalCategories = state.categories.length;
    const totalPaymentMethods = state.paymentMethods.length;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = state.transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );
    
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions,
      totalBudgets,
      totalCategories,
      totalPaymentMethods,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Management</h2>
          <p className="text-gray-600 mt-1">Manage your financial data and import/export settings</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Database className="w-5 h-5" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('csv-import')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'csv-import'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>CSV Import</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Data Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Budgets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBudgets}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Methods</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPaymentMethods}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">${stats.monthlyIncome.toLocaleString()}</p>
                <p className="text-sm text-green-600">Income</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">${stats.monthlyExpenses.toLocaleString()}</p>
                <p className="text-sm text-red-600">Expenses</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className={`text-2xl font-bold ${stats.monthlySavings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ${stats.monthlySavings.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Savings</p>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
            <p className="text-gray-600 mb-4">Download all your financial data as a JSON file for backup or transfer.</p>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All Data
            </button>
          </div>

          {/* Import Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Import Data</h3>
            <p className="text-gray-600 mb-4">Import previously exported data or paste JSON data here.</p>
            <div className="space-y-4">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your JSON data here..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </button>
                <button
                  onClick={() => setImportText('')}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors duration-200"
                >
                  Clear
                </button>
              </div>
              {importStatus === 'success' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Data imported successfully!</span>
                </div>
              )}
              {importStatus === 'error' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Error importing data. Please check the format.</span>
                </div>
              )}
            </div>
          </div>

          {/* Clear Data Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear All Data</h3>
            <p className="text-gray-600 mb-4">This action will permanently delete all your transactions, budgets, and settings. This cannot be undone.</p>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </button>
          </div>

          {/* Storage Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Data is stored locally in your browser using localStorage.</p>
              <p>Your data is private and never leaves your device.</p>
              <p>Use the export feature to backup your data regularly.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'csv-import' && (
        <CSVImport />
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Data Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete all your data? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleClearData}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManager; 