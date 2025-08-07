import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const DataManager: React.FC = () => {
  const { state, clearAllData, exportData, importData } = useData();
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      setImportStatus('error');
      return;
    }

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
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = state.transactions.filter(t => t.date.startsWith(currentMonth));
    
    return {
      totalTransactions: state.transactions.length,
      monthlyTransactions: monthlyTransactions.length,
      totalBudgets: state.budgets.length,
      categories: state.categories.length,
      paymentMethods: state.paymentMethods.length
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
        <p className="text-gray-600">Export, import, and manage your financial data</p>
      </div>

      {/* Data Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-green-600">{stats.monthlyTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Budgets</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalBudgets}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-orange-600">{stats.categories}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Methods</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.paymentMethods}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Export Data</h2>
          <Download className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-gray-600 mb-4">
          Download a backup of all your financial data as a JSON file. This includes transactions, budgets, categories, and payment methods.
        </p>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Import Data</h2>
          <Upload className="w-5 h-5 text-gray-500" />
        </div>
        <p className="text-gray-600 mb-4">
          Import previously exported data. This will replace all current data with the imported data.
        </p>
        
        <div className="space-y-4">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your exported JSON data here..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </button>
            
            {importStatus === 'success' && (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Import successful!</span>
              </div>
            )}
            
            {importStatus === 'error' && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">Import failed. Please check your data format.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clear Data Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Clear All Data</h2>
          <Trash2 className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-gray-600 mb-4">
          This will permanently delete all your transactions, budgets, and settings. This action cannot be undone.
        </p>
        
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-red-600 font-medium">Are you sure you want to delete all data?</p>
            <div className="flex space-x-3">
              <button
                onClick={handleClearData}
                className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Yes, Delete Everything
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="inline-flex items-center px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Storage</h3>
        <p className="text-gray-600 mb-3">
          Your data is automatically saved to your browser's local storage. This means:
        </p>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Data persists between browser sessions</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Data is stored locally on your device</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Data is not shared with any servers</span>
          </li>
          <li className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <span>Clearing browser data will delete your financial data</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DataManager; 