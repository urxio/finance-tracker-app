import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
export interface Transaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  type: 'income' | 'expense';
}

export interface Budget {
  id: number;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
}

export interface DataState {
  transactions: Transaction[];
  budgets: Budget[];
  categories: string[];
  paymentMethods: string[];
  loading: boolean;
  error: string | null;
}

// Actions
export type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: number }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'ADD_BUDGET'; payload: Budget }
  | { type: 'UPDATE_BUDGET'; payload: Budget }
  | { type: 'DELETE_BUDGET'; payload: number }
  | { type: 'SET_CATEGORIES'; payload: string[] }
  | { type: 'SET_PAYMENT_METHODS'; payload: string[] }
  | { type: 'UPDATE_BUDGET_SPENT'; payload: { category: string; amount: number } }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: string[] }
  | { type: 'SET_PAYMENT_METHODS'; payload: string[] };

// Initial state with no hardcoded data
const initialState: DataState = {
  transactions: [],
  budgets: [],
  categories: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Income', 'Other'],
  paymentMethods: ['Credit Card', 'Debit Card', 'Bank Transfer', 'Cash', 'PayPal', 'Other'],
  loading: false,
  error: null,
};

// Helper function to generate unique IDs
const generateId = (): number => {
  return Date.now() + Math.random();
};

// Helper function to calculate budget spent for a category
const calculateBudgetSpent = (transactions: Transaction[], category: string): number => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  return transactions
    .filter(t => t.category === category && t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

// Helper function to update all budget spent amounts
const updateAllBudgetSpent = (transactions: Transaction[], budgets: Budget[]): Budget[] => {
  return budgets.map(budget => ({
    ...budget,
    spent: calculateBudgetSpent(transactions, budget.category)
  }));
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TRANSACTIONS':
      return { 
        ...state, 
        transactions: action.payload,
        budgets: updateAllBudgetSpent(action.payload, state.budgets)
      };
    case 'ADD_TRANSACTION':
      const newTransactions = [...state.transactions, { ...action.payload, id: generateId() }];
      return { 
        ...state, 
        transactions: newTransactions,
        budgets: updateAllBudgetSpent(newTransactions, state.budgets)
      };
    case 'UPDATE_TRANSACTION':
      const updatedTransactions = state.transactions.map(t => 
        t.id === action.payload.id ? action.payload : t
      );
      return {
        ...state,
        transactions: updatedTransactions,
        budgets: updateAllBudgetSpent(updatedTransactions, state.budgets)
      };
    case 'DELETE_TRANSACTION':
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload);
      return {
        ...state,
        transactions: filteredTransactions,
        budgets: updateAllBudgetSpent(filteredTransactions, state.budgets)
      };
    case 'SET_BUDGETS':
      return { 
        ...state, 
        budgets: updateAllBudgetSpent(state.transactions, action.payload)
      };
    case 'ADD_BUDGET':
      const newBudget = { ...action.payload, id: generateId() };
      const updatedBudgets = [...state.budgets, newBudget];
      return { 
        ...state, 
        budgets: updateAllBudgetSpent(state.transactions, updatedBudgets)
      };
    case 'UPDATE_BUDGET':
      const modifiedBudgets = state.budgets.map(b => 
        b.id === action.payload.id ? action.payload : b
      );
      return {
        ...state,
        budgets: updateAllBudgetSpent(state.transactions, modifiedBudgets)
      };
    case 'DELETE_BUDGET':
      const remainingBudgets = state.budgets.filter(b => b.id !== action.payload);
      return {
        ...state,
        budgets: updateAllBudgetSpent(state.transactions, remainingBudgets)
      };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_PAYMENT_METHODS':
      return { ...state, paymentMethods: action.payload };
    case 'UPDATE_BUDGET_SPENT':
      return {
        ...state,
        budgets: state.budgets.map(budget => 
          budget.category === action.payload.category 
            ? { ...budget, spent: action.payload.amount }
            : budget
        )
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    default:
      return state;
  }
}

// Context
interface DataContextType {
  state: DataState;
  dispatch: React.Dispatch<DataAction>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: number) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: number) => void;
  addCategory: (category: string) => void;
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];
  getMonthlyStats: () => {
    totalIncome: number;
    totalExpenses: number;
    savings: number;
    budgetUsed: number;
  };
  clearAllData: () => void;
  exportData: () => string;
  importData: (data: string) => boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Helper functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId()
    };
    dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
  };

  const updateTransaction = (transaction: Transaction) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: transaction });
  };

  const deleteTransaction = (id: number) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
  };

  const addBudget = (budget: Omit<Budget, 'id'>) => {
    const newBudget: Budget = {
      ...budget,
      id: generateId(),
      spent: 0
    };
    dispatch({ type: 'ADD_BUDGET', payload: newBudget });
  };

  const updateBudget = (budget: Budget) => {
    dispatch({ type: 'UPDATE_BUDGET', payload: budget });
  };

  const deleteBudget = (id: number) => {
    dispatch({ type: 'DELETE_BUDGET', payload: id });
  };

  const addCategory = (category: string) => {
    if (!state.categories.includes(category)) {
      dispatch({ type: 'ADD_CATEGORY', payload: category });
    }
  };

  const getTransactionsByDateRange = (startDate: string, endDate: string): Transaction[] => {
    return state.transactions.filter(transaction => 
      transaction.date >= startDate && transaction.date <= endDate
    );
  };

  const getTransactionsByCategory = (category: string): Transaction[] => {
    return state.transactions.filter(transaction => transaction.category === category);
  };

  const getMonthlyStats = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthlyTransactions = state.transactions.filter(t => 
      t.date.startsWith(currentMonth)
    );

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = Math.abs(monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0));

    const savings = totalIncome - totalExpenses;
    const totalBudget = state.budgets.reduce((sum, b) => sum + b.amount, 0);
    const budgetUsed = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

    return {
      totalIncome,
      totalExpenses,
      savings,
      budgetUsed
    };
  };

  const clearAllData = () => {
    dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
    dispatch({ type: 'SET_BUDGETS', payload: [] });
    localStorage.removeItem('finance-tracker-data');
  };

  const exportData = (): string => {
    return JSON.stringify({
      transactions: state.transactions,
      budgets: state.budgets,
      categories: state.categories,
      paymentMethods: state.paymentMethods,
      exportDate: new Date().toISOString()
    }, null, 2);
  };

  const importData = (data: string): boolean => {
    try {
      const parsedData = JSON.parse(data);
      if (parsedData.transactions) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: parsedData.transactions });
      }
      if (parsedData.budgets) {
        dispatch({ type: 'SET_BUDGETS', payload: parsedData.budgets });
      }
      if (parsedData.categories) {
        dispatch({ type: 'SET_CATEGORIES', payload: parsedData.categories });
      }
      if (parsedData.paymentMethods) {
        dispatch({ type: 'SET_PAYMENT_METHODS', payload: parsedData.paymentMethods });
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('finance-tracker-data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.transactions) {
          dispatch({ type: 'SET_TRANSACTIONS', payload: parsedData.transactions });
        }
        if (parsedData.budgets) {
          dispatch({ type: 'SET_BUDGETS', payload: parsedData.budgets });
        }
        if (parsedData.categories) {
          dispatch({ type: 'SET_CATEGORIES', payload: parsedData.categories });
        }
        if (parsedData.paymentMethods) {
          dispatch({ type: 'SET_PAYMENT_METHODS', payload: parsedData.paymentMethods });
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      // If there's an error loading data, clear localStorage and start fresh
      localStorage.removeItem('finance-tracker-data');
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        transactions: state.transactions,
        budgets: state.budgets,
        categories: state.categories,
        paymentMethods: state.paymentMethods,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('finance-tracker-data', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }, [state.transactions, state.budgets, state.categories, state.paymentMethods]);

  const value: DataContextType = {
    state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    deleteBudget,
    addCategory,
    getTransactionsByDateRange,
    getTransactionsByCategory,
    getMonthlyStats,
    clearAllData,
    exportData,
    importData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// Hook to use the context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 