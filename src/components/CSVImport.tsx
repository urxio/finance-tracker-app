import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface CSVTransaction {
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
}

const CSVImport: React.FC = () => {
  const { state, addTransaction, addCategory } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importedTransactions, setImportedTransactions] = useState<CSVTransaction[]>([]);
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
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
        setImportStatus('success');
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

  const handleImport = () => {
    if (importedTransactions.length === 0) return;

    // Add new categories first
    newCategories.forEach(category => {
      addCategory(category);
    });

    // Then add transactions
    importedTransactions.forEach(transaction => {
      addTransaction({
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        type: transaction.type,
        paymentMethod: 'CSV Import'
      });
    });

    // Reset state
    setImportedTransactions([]);
    setNewCategories([]);
    setImportStatus('idle');
    setErrorMessage('');
  };

  const handleCancel = () => {
    setImportedTransactions([]);
    setNewCategories([]);
    setImportStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

      {/* Status Messages */}
      {importStatus === 'processing' && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Processing CSV file...</span>
        </div>
      )}

      {importStatus === 'error' && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {importStatus === 'success' && (
        <div className="space-y-4">
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

          {/* Import Preview */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Import Preview ({importedTransactions.length} transactions)
              </h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {importedTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="px-6 py-3 border-b border-gray-100 hover:bg-gray-50"
                >
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
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleImport}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Import {importedTransactions.length} Transactions
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors duration-200"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
