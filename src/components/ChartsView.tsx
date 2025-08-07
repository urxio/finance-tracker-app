import React, { useState, useMemo } from 'react';
import { BarChart, TrendingUp, PieChart, Calendar, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const ChartsView: React.FC = () => {
  const { state, getTransactionsByDateRange } = useData();
  const { transactions } = state;
  
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedChart, setSelectedChart] = useState('overview');

  const periods = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'year', label: 'This Year' }
  ];

  const chartTypes = [
    { id: 'overview', label: 'Overview', icon: BarChart },
    { id: 'categories', label: 'Categories', icon: PieChart },
    { id: 'trends', label: 'Trends', icon: TrendingUp }
  ];

  // Calculate date ranges based on selected period
  const getDateRange = (period: string) => {
    const today = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(today.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      default:
        start.setMonth(today.getMonth() - 1);
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  // Get transactions for selected period
  const periodTransactions = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    return getTransactionsByDateRange(start, end);
  }, [selectedPeriod, transactions, getTransactionsByDateRange]);

  // Calculate monthly data for the last 6 months
  const monthlyData = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStart = month.toISOString().split('T')[0];
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const monthTransactions = getTransactionsByDateRange(monthStart, monthEnd);
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = Math.abs(monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0));
      
      months.push({
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        income,
        expenses
      });
    }
    
    return months;
  }, [transactions, getTransactionsByDateRange]);

  // Calculate category data
  const categoryData = useMemo(() => {
    const categoryTotals: { [key: string]: number } = {};
    
    periodTransactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + Math.abs(transaction.amount);
      });
    
    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    const colors = [
      'bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-indigo-500'
    ];
    
    return Object.entries(categoryTotals)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: colors[index % colors.length],
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [periodTransactions]);

  const maxAmount = Math.max(...monthlyData.map(item => Math.max(item.income, item.expenses)));

  const renderOverviewChart = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Income vs Expenses</h3>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Income</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Expenses</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {monthlyData.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span>{item.month}</span>
              <div className="flex space-x-4">
                <span className="text-green-600">${item.income.toLocaleString()}</span>
                <span className="text-red-600">${item.expenses.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex space-x-2 h-8">
              <div className="flex-1 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-1000 ease-out"
                  style={{ width: `${maxAmount > 0 ? (item.income / maxAmount) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex-1 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-1000 ease-out"
                  style={{ width: `${maxAmount > 0 ? (item.expenses / maxAmount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCategoryChart = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Spending by Category</h3>
      
      {categoryData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pie Chart Visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {categoryData.map((item, index) => {
                  const offset = categoryData.slice(0, index).reduce((sum, cat) => sum + cat.percentage, 0);
                  return (
                    <circle
                      key={item.category}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color.replace('bg-', '').replace('-500', '')}
                      strokeWidth="8"
                      strokeDasharray={`${item.percentage * 2.51} ${100 - item.percentage * 2.51}`}
                      strokeDashoffset={offset * 2.51}
                      className="transition-all duration-1000 ease-out"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${categoryData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">Total Spent</div>
                </div>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="space-y-4">
            {categoryData.map((item) => (
              <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                  <div>
                    <div className="font-medium text-gray-900">{item.category}</div>
                    <div className="text-sm text-gray-500">{item.percentage}%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${item.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <PieChart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No spending data</h3>
          <p className="text-gray-500">Add some transactions to see your spending breakdown.</p>
        </div>
      )}
    </div>
  );

  const renderTrendsChart = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Spending Trends</h3>
      
      {monthlyData.some(item => item.income > 0 || item.expenses > 0) ? (
        <div className="space-y-6">
          {/* Net Income Trend */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Net Income Trend</h4>
            <div className="space-y-3">
              {monthlyData.map((item, index) => {
                const netIncome = item.income - item.expenses;
                const isPositive = netIncome >= 0;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600">{item.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          isPositive ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(Math.abs(netIncome) / Math.max(...monthlyData.map(m => Math.abs(m.income - m.expenses))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className={`w-20 text-right font-medium ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}${netIncome.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Savings Rate */}
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-4">Savings Rate</h4>
            <div className="space-y-3">
              {monthlyData.map((item, index) => {
                const savingsRate = item.income > 0 ? ((item.income - item.expenses) / item.income) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-16 text-sm text-gray-600">{item.month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          savingsRate >= 20 ? 'bg-green-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(savingsRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-right font-medium text-gray-900">
                      {savingsRate.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trend data</h3>
          <p className="text-gray-500">Add transactions over time to see your financial trends.</p>
        </div>
      )}
    </div>
  );

  const renderChart = () => {
    switch (selectedChart) {
      case 'overview':
        return renderOverviewChart();
      case 'categories':
        return renderCategoryChart();
      case 'trends':
        return renderTrendsChart();
      default:
        return renderOverviewChart();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Charts</h1>
          <p className="text-gray-600">Visualize your financial data and trends</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Time Period</h2>
          <div className="flex space-x-2">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chart Type</h2>
          <div className="flex space-x-2">
            {chartTypes.map((chart) => {
              const Icon = chart.icon;
              return (
                <button
                  key={chart.id}
                  onClick={() => setSelectedChart(chart.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedChart === chart.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{chart.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data to analyze</h3>
            <p className="text-gray-500">Add some transactions to start seeing your financial analytics.</p>
          </div>
        ) : (
          renderChart()
        )}
      </div>
    </div>
  );
};

export default ChartsView;