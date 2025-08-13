import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface CSVTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const CSVImport: React.FC = () => {
  const { state, addTransactionsBatch, addCategory } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importedTransactions, setImportedTransactions] = useState<CSVTransaction[]>([]);
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Please select a valid CSV file');
      setImportStatus('error');
      return;
    }

    setImportStatus('processing');
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const transactions = parseCSV(csvText);
        setImportedTransactions(transactions);
        setSelectedTransactions(new Set(transactions.map(t => t.id)));
        setImportStatus('success');
        setShowReview(true);
      } catch (error) {
        setErrorMessage('Error parsing CSV file. Please check the format.');
        setImportStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string): CSVTransaction[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['description', 'amount', 'category', 'date'];
    
    // Check if required headers exist
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.includes(header))
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const transactions: CSVTransaction[] = [];
    const newCategoriesSet = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 4) continue;

      const description = values[headers.findIndex(h => h.includes('description'))]?.trim() || '';
      const amountStr = values[headers.findIndex(h => h.includes('amount'))]?.trim() || '0';
      const category = values[headers.findIndex(h => h.includes('category'))]?.trim() || 'Other';
      const dateStr = values[headers.findIndex(h => h.includes('date'))]?.trim() || '';

      if (!description || !amountStr || !dateStr) continue;

      const amount = parseFloat(amountStr.replace(/[$,]/g, ''));
      if (isNaN(amount)) continue;

      const type: 'income' | 'expense' = amount >= 0 ? 'income' : 'expense';
      const absAmount = Math.abs(amount);

      // Check if category exists, if not add to new categories
      if (!state.categories.includes(category)) {
        newCategoriesSet.add(category);
      }

      transactions.push({
        id: `csv-${Date.now()}-${i}-${Math.random()}`,
        description,
        amount: absAmount,
        category,
        date: formatDate(dateStr),
        type
      });
    }

    setNewCategories(Array.from(newCategoriesSet));
    return transactions;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0];
    } catch {
      // Return today's date if parsing fails
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setImportedTransactions(prev => prev.filter(t => t.id !== id));
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleSelectTransaction = (id: string, selected: boolean) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTransactions(new Set(importedTransactions.map(t => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleDeleteSelected = () => {
    setImportedTransactions(prev => prev.filter(t => !selectedTransactions.has(t.id)));
    setSelectedTransactions(new Set());
  };

  const handleImport = () => {
    const transactionsToImport = importedTransactions.filter(t => selectedTransactions.has(t.id));
    if (transactionsToImport.length === 0) return;

    // Add new categories first
    newCategories.forEach(category => {
      addCategory(category);
    });

    try {
      // Add all selected transactions in a batch, ensuring dates are properly formatted
      addTransactionsBatch(transactionsToImport.map(transaction => ({
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        date: new Date(transaction.date).toISOString().split('T')[0], // Ensure consistent date format
        type: transaction.type,
        paymentMethod: 'CSV Import'
      })));

      // Set success status and show success message
      setImportStatus('success');
      
      // Reset state after a short delay to show success message
      setTimeout(() => {
        setImportedTransactions([]);
        setNewCategories([]);
        setImportStatus('idle');
        setErrorMessage('');
        setSelectedTransactions(new Set());
        setShowReview(false);
      }, 1500);

    } catch (error) {
      setImportStatus('error');
      setErrorMessage('Error importing transactions. Please try again.');
    }
  };

  const handleCancel = () => {
    setImportedTransactions([]);
    setNewCategories([]);
    setImportStatus('idle');
    setErrorMessage('');
    setSelectedTransactions(new Set());
    setShowReview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCategoryColor = (category: string): string => {
    const categoryColors: { [key: string]: string } = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Income': 'bg-green-100 text-green-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Bills': 'bg-red-100 text-red-800',
      'Healthcare': 'bg-teal-100 text-teal-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return categoryColors[category] || 'bg-gray-100 text-gray-800';
  };

  const getSampleCSV = () => {
    const sampleData = `description,amount,category,date
Grocery Store,-50.25,Food,2024-01-15
Salary Deposit,2500.00,Income,2024-01-01
Gas Station,-35.00,Transportation,2024-01-10
Netflix Subscription,-12.99,Entertainment,2024-01-05
Restaurant,-85.50,Food,2024-01-12`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const selectedCount = selectedTransactions.size;
  const totalCount = importedTransactions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Import CSV Transactions</h2>
          <p className="text-gray-600 mt-1">Upload a CSV file to import your transactions</p>
        </div>
        <button
          onClick={getSampleCSV}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <FileText className="w-4 h-4 mr-2" />
          Download Sample CSV
        </button>
      </div>

      {/* File Upload Area */}
      {!showReview && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your CSV file here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supported format: CSV with columns: description, amount, category, date
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {importStatus === 'processing' && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Processing CSV file...</span>
        </div>
      )}

      {importStatus === 'success' && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span>Transactions imported successfully! Dashboard will update shortly.</span>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Review Section */}
      {showReview && importStatus === 'success' && (
        <div className="space-y-6">
          {/* New Categories Warning */}
          {newCategories.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">New Categories Found</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    The following categories will be added to your category list:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newCategories.map(category => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selection Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCount === totalCount && totalCount > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All ({selectedCount}/{totalCount})
                  </span>
                </label>
                {selectedCount > 0 && (
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected ({selectedCount})
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {selectedCount} of {totalCount} transactions selected
              </div>
            </div>
          </div>

          {/* Import Preview */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Review Transactions ({totalCount} total)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select which transactions you want to import
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {importedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={(e) => handleSelectTransaction(transaction.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{transaction.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                            {transaction.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Import {selectedCount} Selected Transactions
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedCount} of {totalCount} transactions ready to import
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
