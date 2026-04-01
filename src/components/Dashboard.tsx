import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  History,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction, Wallet, UserProfile } from '../types';
import { format, startOfMonth, subMonths } from 'date-fns';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';
import { id as idLocale, enUS } from 'date-fns/locale';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    const qWallets = query(
      collection(db, 'wallets'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribeWallets = onSnapshot(qWallets, (snapshot) => {
      setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet)));
    });

    const unsubProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUserProfile(doc.data() as UserProfile);
    });

    return () => {
      unsubscribe();
      unsubscribeWallets();
      unsubProfile();
    };
  }, []);

  const totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date) >= startOfMonth(new Date()))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth(new Date()))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subMonths(new Date(), 6 - i);
    const locale = userProfile?.language === 'id' ? idLocale : enUS;
    const monthStr = format(date, 'MMM', { locale });
    const income = transactions
      .filter(t => t.type === 'income' && format(new Date(t.date), 'MMM yyyy') === format(date, 'MMM yyyy'))
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense' && format(new Date(t.date), 'MMM yyyy') === format(date, 'MMM yyyy'))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { name: monthStr, income, expense };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(userProfile?.language === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: userProfile?.currency || 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const isDark = userProfile?.theme !== 'light';

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 text-white rounded-3xl p-6 shadow-xl shadow-primary/20 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
                  {userProfile?.language === 'id' ? 'Total Saldo' : 'Total Balance'}
                </p>
                <h3 className="text-3xl font-bold tracking-tight">
                  {formatCurrency(totalBalance)}
                </h3>
              </div>
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
                <WalletIcon size={20} className="text-white/80" />
              </div>
            </div>

            <div className="h-px bg-white/10 w-full mb-6" />
            
            <div className="flex items-center justify-between w-full relative">
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 text-white/90 mb-1.5">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    <TrendingUp size={12} className="text-white" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {userProfile?.language === 'id' ? 'Pemasukan' : 'Income'}
                  </span>
                </div>
                <p className="text-lg font-bold tracking-tight text-center">{formatCurrency(monthlyIncome)}</p>
              </div>

              <div className="w-px h-10 bg-white/10 mx-4" />
              
              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 text-white/90 mb-1.5">
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                    <TrendingDown size={12} className="text-white" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    {userProfile?.language === 'id' ? 'Pengeluaran' : 'Expense'}
                  </span>
                </div>
                <p className="text-lg font-bold tracking-tight text-center">{formatCurrency(monthlyExpense)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-6">
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
            <div className="flex justify-between items-center">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Activity size={24} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                {wallets.length} {userProfile?.language === 'id' ? 'Dompet' : 'Wallets'}
              </span>
            </div>
            <div className="mt-6">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">
                {userProfile?.language === 'id' ? 'Status Keuangan' : 'Financial Status'}
              </p>
              <h4 className="text-2xl font-black tracking-tight">
                {totalBalance > 0 ? (userProfile?.language === 'id' ? 'Sehat' : 'Healthy') : (userProfile?.language === 'id' ? 'Waspada' : 'Warning')}
              </h4>
            </div>
          </div>
          <button 
            onClick={() => navigate('/transactions')}
            className="btn-primary w-full flex items-center justify-center gap-3 py-5 shadow-xl shadow-primary/20 rounded-3xl"
          >
            <Plus size={24} />
            <span className="font-black text-lg tracking-tight">{userProfile?.language === 'id' ? 'Transaksi Baru' : 'New Transaction'}</span>
          </button>
        </div>
      </div>

      {/* Charts & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              {userProfile?.language === 'id' ? 'Arus Kas' : 'Cash Flow'}
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span>Expense</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="#10b981"
                  fillOpacity={0.1} 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  stroke="#f43f5e" 
                  strokeWidth={2}
                  fill="#f43f5e"
                  fillOpacity={0.1} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History size={20} className="text-slate-400" />
              {userProfile?.language === 'id' ? 'Riwayat' : 'History'}
            </h3>
            <button 
              onClick={() => navigate('/transactions')}
              className="text-primary text-xs font-bold hover:underline"
            >
              {userProfile?.language === 'id' ? 'Lihat Semua' : 'View All'}
            </button>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">No activity yet</p>
              </div>
            ) : (
              transactions.slice(0, 6).map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      t.type === 'income' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {t.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{t.category}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(t.date), 'dd MMM')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm ${
                    t.type === 'income' ? 'text-accent' : 'text-secondary'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
