import React, { useMemo } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, Target, DollarSign, Calendar, ArrowRight } from 'lucide-react';
import { useData } from '../contexts/DataContext';

const InsightsPanel: React.FC = () => {
  const { state, getTransactionsByDateRange, getMonthlyStats } = useData();
  const { transactions, budgets } = state;

  // Calculate insights based on actual data
  const insights = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    
    const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    const lastMonthTransactions = transactions.filter(t => t.date.startsWith(lastMonth));
    
    const currentMonthExpenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const lastMonthExpenses = lastMonthTransactions.filter(t => t.type === 'expense');
    
    const insightsList = [];

    // 1. Category spending analysis
    const categorySpending: { [key: string]: number } = {};
    currentMonthExpenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
    });

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      insightsList.push({
        id: 1,
        type: 'savings',
        icon: DollarSign,
        title: `Optimize Your ${topCategory[0]} Budget`,
        description: `You spent $${topCategory[1].toFixed(2)} on ${topCategory[0]} this month. Consider reviewing your spending in this category.`,
        impact: `Potential savings: $${(topCategory[1] * 0.2).toFixed(2)}/month`,
        priority: 'high',
        action: 'Review spending'
      });
    }

    // 2. Budget alerts
    budgets.forEach(budget => {
      const categoryExpenses = currentMonthExpenses
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const usagePercentage = (categoryExpenses / budget.amount) * 100;
      
      if (usagePercentage > 100) {
        insightsList.push({
          id: insightsList.length + 1,
          type: 'alert',
          icon: AlertCircle,
          title: `Budget Alert: ${budget.category}`,
          description: `You've exceeded your ${budget.category} budget by $${(categoryExpenses - budget.amount).toFixed(2)} this month.`,
          impact: `${usagePercentage.toFixed(0)}% of budget used`,
          priority: 'high',
          action: 'Adjust budget'
        });
      } else if (usagePercentage > 80) {
        insightsList.push({
          id: insightsList.length + 1,
          type: 'alert',
          icon: AlertCircle,
          title: `Budget Warning: ${budget.category}`,
          description: `You're at ${usagePercentage.toFixed(0)}% of your ${budget.category} budget. Consider monitoring your spending.`,
          impact: `${usagePercentage.toFixed(0)}% of budget used`,
          priority: 'medium',
          action: 'Monitor spending'
        });
      }
    });

    // 3. Spending trends
    const currentTotalExpenses = currentMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const lastTotalExpenses = lastMonthExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    if (lastTotalExpenses > 0) {
      const changePercentage = ((currentTotalExpenses - lastTotalExpenses) / lastTotalExpenses) * 100;
      
      if (Math.abs(changePercentage) > 10) {
        insightsList.push({
          id: insightsList.length + 1,
          type: 'trend',
          icon: TrendingUp,
          title: changePercentage > 0 ? 'Spending Increased' : 'Spending Decreased',
          description: `Your total expenses ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage).toFixed(1)}% compared to last month.`,
          impact: changePercentage > 0 ? `$${(currentTotalExpenses - lastTotalExpenses).toFixed(2)} more spent` : `$${(lastTotalExpenses - currentTotalExpenses).toFixed(2)} saved`,
          priority: changePercentage > 0 ? 'medium' : 'low',
          action: changePercentage > 0 ? 'Review expenses' : 'Keep it up'
        });
      }
    }

    // 4. Savings opportunity
    const monthlyStats = getMonthlyStats();
    const savingsRate = monthlyStats.totalIncome > 0 ? (monthlyStats.savings / monthlyStats.totalIncome) * 100 : 0;
    
    if (savingsRate < 20) {
      insightsList.push({
        id: insightsList.length + 1,
        type: 'opportunity',
        icon: Lightbulb,
        title: 'Increase Your Savings Rate',
        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% or higher for better financial health.`,
        impact: `Target: 20% savings rate`,
        priority: 'medium',
        action: 'Set savings goal'
      });
    }

    // 5. Income vs Expenses
    if (monthlyStats.totalIncome > 0 && monthlyStats.totalExpenses > 0) {
      const expenseRatio = (monthlyStats.totalExpenses / monthlyStats.totalIncome) * 100;
      
      if (expenseRatio > 80) {
        insightsList.push({
          id: insightsList.length + 1,
          type: 'alert',
          icon: AlertCircle,
          title: 'High Expense Ratio',
          description: `Your expenses are ${expenseRatio.toFixed(1)}% of your income. Consider reducing expenses to improve your financial position.`,
          impact: `${expenseRatio.toFixed(1)}% of income spent`,
          priority: 'high',
          action: 'Reduce expenses'
        });
      }
    }

    // 6. Emergency fund insight
    if (monthlyStats.savings > 0) {
      const monthsToEmergencyFund = 5000 / monthlyStats.savings; // Assuming $5k emergency fund goal
      
      if (monthsToEmergencyFund > 12) {
        insightsList.push({
          id: insightsList.length + 1,
          type: 'goal',
          icon: Target,
          title: 'Emergency Fund Goal',
          description: `At your current savings rate, it will take ${monthsToEmergencyFund.toFixed(1)} months to build a $5,000 emergency fund.`,
          impact: `Target: $5,000 emergency fund`,
          priority: 'medium',
          action: 'Increase savings'
        });
      }
    }

    return insightsList.slice(0, 6); // Limit to 6 insights
  }, [transactions, budgets, getMonthlyStats]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'savings': return 'text-green-600 bg-green-100';
      case 'trend': return 'text-blue-600 bg-blue-100';
      case 'goal': return 'text-purple-600 bg-purple-100';
      case 'alert': return 'text-red-600 bg-red-100';
      case 'opportunity': return 'text-yellow-600 bg-yellow-100';
      case 'pattern': return 'text-indigo-600 bg-indigo-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const summaryStats = useMemo(() => {
    const highPriorityInsights = insights.filter(i => i.priority === 'high').length;
    const mediumPriorityInsights = insights.filter(i => i.priority === 'medium').length;
    const lowPriorityInsights = insights.filter(i => i.priority === 'low').length;
    
    return {
      totalInsights: insights.length,
      highPriorityAlerts: highPriorityInsights,
      mediumPriorityAlerts: mediumPriorityInsights,
      positiveInsights: lowPriorityInsights
    };
  }, [insights]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Insights</h1>
        <p className="text-gray-600">AI-powered insights to help you make better financial decisions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Insights</p>
              <p className="text-3xl font-bold text-gray-900">{summaryStats.totalInsights}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-red-600">{summaryStats.highPriorityAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medium Priority</p>
              <p className="text-3xl font-bold text-yellow-600">{summaryStats.mediumPriorityAlerts}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Positive Insights</p>
              <p className="text-3xl font-bold text-green-600">{summaryStats.positiveInsights}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Personalized Insights</h2>
        
        {insights.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No insights available</h3>
            <p className="text-gray-500">Add more transactions to get personalized financial insights.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div key={insight.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconColor(insight.type)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{insight.impact}</span>
                        <button className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                          {insight.action}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;