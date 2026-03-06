"use client"

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, Target, Sparkles, ArrowRight, Plus, X, DollarSign, PieChart, Trophy, Zap, Heart } from 'lucide-react'

// Mock data
const initialTransactions = [
  { id: 1, name: 'Morning Coffee', amount: 4.50, category: 'Food', date: '2026-03-05', type: 'expense' },
  { id: 2, name: 'Freelance Payment', amount: 850, category: 'Income', date: '2026-03-04', type: 'income' },
  { id: 3, name: 'Groceries', amount: 78.32, category: 'Food', date: '2026-03-04', type: 'expense' },
  { id: 4, name: 'Netflix', amount: 15.99, category: 'Entertainment', date: '2026-03-03', type: 'expense' },
  { id: 5, name: 'Gas Station', amount: 45.00, category: 'Transport', date: '2026-03-03', type: 'expense' },
  { id: 6, name: 'Side Project', amount: 200, category: 'Income', date: '2026-03-02', type: 'income' },
  { id: 7, name: 'Restaurant Dinner', amount: 62.40, category: 'Food', date: '2026-03-01', type: 'expense' },
  { id: 8, name: 'Gym Membership', amount: 49.99, category: 'Health', date: '2026-03-01', type: 'expense' },
]

const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Bills', 'Income', 'Other']

const categoryIcons: Record<string, string> = {
  Food: '🍕',
  Transport: '🚗',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💪',
  Bills: '📄',
  Income: '💰',
  Other: '📦',
}

const categoryColors: Record<string, string> = {
  Food: 'from-orange-400 to-red-400',
  Transport: 'from-blue-400 to-cyan-400',
  Entertainment: 'from-purple-400 to-pink-400',
  Shopping: 'from-rose-400 to-amber-400',
  Health: 'from-emerald-400 to-teal-400',
  Bills: 'from-slate-400 to-zinc-400',
  Income: 'from-green-400 to-emerald-400',
  Other: 'from-gray-400 to-slate-400',
}

export default function Home() {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showAdd, setShowAdd] = useState(false)
  const [newTx, setNewTx] = useState({ name: '', amount: '', category: 'Food', type: 'expense' })
  const [view, setView] = useState<'dashboard' | 'insights' | 'goals'>('dashboard')
  const [XP, setXP] = useState(1250)
  const [level, setLevel] = useState(5)
  const [streak, setStreak] = useState(7)
  const [showAha, setShowAha] = useState(false)
  const [ahaMessage, setAhaMessage] = useState('')

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense
  const savingsRate = ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1)

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4)

  const insights = [
    { title: 'Coffee Habit', message: 'You spend ~$120/month on coffee. That\'s a fancy espresso machine!', icon: '☕' },
    { title: 'Weekend Spike', message: 'Your spending spikes 40% on weekends. Challenge: try a free weekend activity?', icon: '📊' },
    { title: 'Savings Opportunity', message: `You could save $${Math.floor(totalExpense * 0.1)} this month with small cuts.`, icon: '💡' },
  ]

  const goals = [
    { name: 'Emergency Fund', current: 2500, target: 5000, color: 'from-green-400 to-emerald-600' },
    { name: 'New Laptop', current: 800, target: 1500, color: 'from-blue-400 to-indigo-600' },
    { name: 'Vacation', current: 350, target: 2000, color: 'from-amber-400 to-orange-600' },
  ]

  const handleAddTransaction = () => {
    if (!newTx.name || !newTx.amount) return
    
    const tx = {
      id: Date.now(),
      name: newTx.name,
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      date: new Date().toISOString().split('T')[0],
      type: newTx.type as 'expense' | 'income',
    }
    
    setTransactions([tx, ...transactions])
    setXP(XP + (tx.type === 'income' ? 50 : 20))
    setShowAdd(false)
    setNewTx({ name: '', amount: '', category: 'Food', type: 'expense' })
    
    // Show Aha moment
    if (tx.type === 'expense') {
      const messages = [
        'Every dollar tracked is a dollar mastered!',
        'Knowledge is power - now you know where your money goes!',
        'The first step to wealth is awareness. Great job!',
      ]
      setAhaMessage(messages[Math.floor(Math.random() * messages.length)])
      setShowAha(true)
      setTimeout(() => setShowAha(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                MintQuest
              </h1>
              <p className="text-slate-400 text-sm">Your financial adventure</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-amber-500/20 px-3 py-1 rounded-full">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold">{XP} XP</span>
              </div>
              <div className="flex items-center gap-1 bg-red-500/20 px-3 py-1 rounded-full">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold">{streak}</span>
              </div>
            </div>
          </div>
          
          {/* Level Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Level {level}</span>
              <span>{level + 1}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${(XP % 500) / 5}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex gap-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Wallet },
            { id: 'insights', label: 'Insights', icon: Sparkles },
            { id: 'goals', label: 'Goals', icon: Target },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as typeof view)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
                view === tab.id 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pb-24">
        {view === 'dashboard' && (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-purple-700 rounded-3xl p-6 mb-4 shadow-2xl shadow-purple-900/50">
              <p className="text-purple-200 text-sm mb-1">Total Balance</p>
              <p className="text-4xl font-bold text-white mb-4">${balance.toLocaleString()}</p>
              
              <div className="flex gap-4">
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-green-300 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Income</span>
                  </div>
                  <p className="text-lg font-bold text-white">${totalIncome.toLocaleString()}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-red-300 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs">Expenses</span>
                  </div>
                  <p className="text-lg font-bold text-white">${totalExpense.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-4 bg-white/10 rounded-xl p-3">
                <div className="flex justify-between items-center">
                  <span className="text-purple-200 text-sm">Savings Rate</span>
                  <span className={`font-bold ${parseFloat(savingsRate) > 20 ? 'text-green-300' : 'text-amber-300'}`}>
                    {savingsRate}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${parseFloat(savingsRate) > 20 ? 'bg-green-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(parseFloat(savingsRate), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top Spending Categories */}
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Top Spending</h3>
              <div className="space-y-3">
                {sortedCategories.map(([cat, amount], i) => (
                  <div key={cat} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColors[cat]} flex items-center justify-center text-xl`}>
                      {categoryIcons[cat]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-white font-medium">{cat}</span>
                        <span className="text-slate-300">${amount.toFixed(2)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${categoryColors[cat]}`}
                          style={{ width: `${(amount / totalExpense) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Recent</h3>
              <div className="space-y-2">
                {transactions.slice(0, 6).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tx.type === 'income' ? 'from-green-400 to-emerald-600' : 'from-slate-600 to-slate-700'} flex items-center justify-center`}>
                        {tx.type === 'income' ? <DollarSign className="w-4 h-4 text-white" /> : <span className="text-sm">{categoryIcons[tx.category]}</span>}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{tx.name}</p>
                        <p className="text-slate-500 text-xs">{tx.category}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === 'insights' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              </div>
              <p className="text-slate-300 text-sm">Your personalized financial wisdom</p>
            </div>
            
            {insights.map((insight, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.icon}</span>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{insight.title}</h4>
                    <p className="text-slate-400 text-sm">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/30">
              <h4 className="text-white font-semibold mb-2">💡 Try This Challenge</h4>
              <p className="text-slate-300 text-sm">Skip one $5 coffee this week and add $20 to your savings. Small habits = big results!</p>
            </div>
          </div>
        )}

        {view === 'goals' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Savings Goals</h3>
                <button className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1 rounded-lg text-sm font-medium">
                  + Add
                </button>
              </div>
              
              {goals.map((goal, i) => (
                <div key={i} className="mb-4 last:mb-0">
                  <div className="flex justify-between mb-2">
                    <span className="text-white font-medium">{goal.name}</span>
                    <span className="text-slate-400 text-sm">${goal.current} / ${goal.target}</span>
                  </div>
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${goal.color}`}
                      style={{ width: `${(goal.current / goal.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {Math.round((goal.current / goal.target) * 100)}% complete • ${goal.target - goal.current} to go
                  </p>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl p-4 border border-amber-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h4 className="text-white font-semibold">Achievements</h4>
              </div>
              <div className="flex gap-2">
                <div className="bg-white/10 px-3 py-2 rounded-xl text-center">
                  <p className="text-2xl">🎯</p>
                  <p className="text-xs text-slate-400">First Goal</p>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded-xl text-center">
                  <p className="text-2xl">🔥</p>
                  <p className="text-xs text-slate-400">7 Day Streak</p>
                </div>
                <div className="bg-white/10 px-3 py-2 rounded-xl text-center">
                  <p className="text-2xl">💰</p>
                  <p className="text-xs text-slate-400">$1K Saved</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 transition-transform"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Add Transaction Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="bg-slate-900 w-full rounded-t-3xl p-6 border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Add Transaction</h3>
              <button onClick={() => setShowAdd(false)} className="p-2">
                <X className="w-5 h-5 text-slate-400" />
              </button>
              
              <div className="flex bg-slate-800 rounded-xl p-1 mb-4">
                <button
                  onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${newTx.type === 'expense' ? 'bg-red-500 text-white' : 'text-slate-400'}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setNewTx({ ...newTx, type: 'income' })}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${newTx.type === 'income' ? 'bg-green-500 text-white' : 'text-slate-400'}`}
                >
                  Income
                </button>
              </div>
              
              <input
                type="text"
                placeholder="What did you spend on?"
                value={newTx.name}
                onChange={(e) => setNewTx({ ...newTx, name: e.target.value })}
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl mb-3 border border-slate-700 focus:border-emerald-500 outline-none"
              />
              
              <input
                type="number"
                placeholder="Amount"
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl mb-3 border border-slate-700 focus:border-emerald-500 outline-none"
              />
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {categories.filter(c => c !== 'Income').map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewTx({ ...newTx, category: cat })}
                    className={`py-2 px-2 rounded-xl text-xs font-medium transition-all ${
                      newTx.category === cat 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleAddTransaction}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                Add Transaction <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aha Moment Popup */}
      {showAha && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 p-6 rounded-2xl shadow-2xl animate-bounce">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-white" />
              <p className="text-white font-bold text-lg">{ahaMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
