import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction, Wallet, UserProfile } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight,
  X,
  Loader2,
  Calendar,
  Tag,
  FileText,
  Wallet as WalletIcon,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumberInput, parseNumberInput } from '../lib/format';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');

  // Form State
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [walletId, setWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUserProfile(doc.data() as UserProfile);
    });

    const q = query(
      collection(db, 'transactions'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    const qW = query(collection(db, 'wallets'), where('uid', '==', auth.currentUser.uid));
    const unsubscribeW = onSnapshot(qW, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
      setWallets(docs);
      if (docs.length > 0 && !walletId) setWalletId(docs[0].id!);
    });

    return () => { 
      unsubProfile();
      unsubscribe(); 
      unsubscribeW(); 
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || submitting) return;
    setSubmitting(true);

    try {
      const numAmount = parseFloat(parseNumberInput(amount));
      const transactionData: any = {
        uid: auth.currentUser.uid,
        type,
        amount: numAmount,
        category,
        walletId,
        note,
        date: new Date(date).toISOString(),
        createdAt: new Date().toISOString()
      };

      if (type === 'transfer') {
        transactionData.toWalletId = toWalletId;
      }

      await addDoc(collection(db, 'transactions'), transactionData);

      const walletRef = doc(db, 'wallets', walletId);
      if (type === 'income') {
        await updateDoc(walletRef, { balance: increment(numAmount) });
      } else if (type === 'expense') {
        await updateDoc(walletRef, { balance: increment(-numAmount) });
      } else if (type === 'transfer' && toWalletId) {
        await updateDoc(walletRef, { balance: increment(-numAmount) });
        await updateDoc(doc(db, 'wallets', toWalletId), { balance: increment(numAmount) });
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (t: Transaction) => {
    if (!window.confirm(userProfile?.language === 'id' ? 'Hapus transaksi ini?' : 'Delete this transaction?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', t.id!));
      const walletRef = doc(db, 'wallets', t.walletId);
      if (t.type === 'income') {
        await updateDoc(walletRef, { balance: increment(-t.amount) });
      } else if (t.type === 'expense') {
        await updateDoc(walletRef, { balance: increment(t.amount) });
      } else if (t.type === 'transfer' && t.toWalletId) {
        await updateDoc(walletRef, { balance: increment(t.amount) });
        await updateDoc(doc(db, 'wallets', t.toWalletId), { balance: increment(-t.amount) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.note.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(userProfile?.language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: userProfile?.currency || 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const isDark = userProfile?.theme !== 'light';
  const lang = userProfile?.language || 'en';

  const t = {
    title: lang === 'id' ? 'Transaksi' : 'Transactions',
    add: lang === 'id' ? 'Tambah' : 'Add',
    search: lang === 'id' ? 'Cari transaksi...' : 'Search transactions...',
    all: lang === 'id' ? 'Semua' : 'All',
    income: lang === 'id' ? 'Masuk' : 'Income',
    expense: lang === 'id' ? 'Keluar' : 'Expense',
    transfer: lang === 'id' ? 'Transfer' : 'Transfer',
    noData: lang === 'id' ? 'Tidak ada transaksi ditemukan' : 'No transactions found',
    newTransaction: lang === 'id' ? 'Transaksi Baru' : 'New Transaction',
    amount: lang === 'id' ? 'Jumlah' : 'Amount',
    category: lang === 'id' ? 'Kategori' : 'Category',
    date: lang === 'id' ? 'Tanggal' : 'Date',
    wallet: lang === 'id' ? 'Dompet' : 'Wallet',
    fromWallet: lang === 'id' ? 'Dari Dompet' : 'From Wallet',
    toWallet: lang === 'id' ? 'Ke Dompet' : 'To Wallet',
    note: lang === 'id' ? 'Catatan (Opsional)' : 'Note (Optional)',
    save: lang === 'id' ? 'Simpan Transaksi' : 'Save Transaction',
    placeholderCategory: lang === 'id' ? 'Makan, Gaji, dll' : 'Food, Salary, etc',
    placeholderNote: lang === 'id' ? 'Keterangan tambahan...' : 'Additional info...',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {transactions.length} {lang === 'id' ? 'transaksi tercatat' : 'transactions recorded'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="font-semibold text-sm">{t.add}</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-10 py-2 text-sm"
          />
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === type 
                  ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-slate-400 text-xs font-medium">Loading...</p>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-accent/10 text-accent' : 
                        transaction.type === 'expense' ? 'bg-secondary/10 text-secondary' : 
                        'bg-primary/10 text-primary'
                      }`}>
                        {transaction.type === 'income' ? <ArrowUpRight size={20} /> : 
                         transaction.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowLeftRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{transaction.category}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <WalletIcon size={10} />
                            {wallets.find(w => w.id === transaction.walletId)?.name || 'Wallet'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-base font-bold ${
                          transaction.type === 'income' ? 'text-accent' : 
                          transaction.type === 'expense' ? 'text-secondary' : 'text-primary'
                        }`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.note && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {transaction.note}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(transaction);
                        }}
                        className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
            <p className="text-slate-400 text-sm">{t.noData}</p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card border border-border rounded-2xl relative z-10 p-6 md:p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">{t.newTransaction}</h3>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-border">
                  {(['expense', 'income', 'transfer'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setType(item)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                        type === item 
                          ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t[item]}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 ml-1">{t.amount}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                      {userProfile?.currency || 'IDR'}
                    </span>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={(e) => setAmount(formatNumberInput(e.target.value, lang === 'id' ? 'id-ID' : 'en-US'))}
                      className="input-field w-full pl-16 py-3 text-2xl font-bold text-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">{t.category}</label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="input-field w-full"
                      placeholder={t.placeholderCategory}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">{t.date}</label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 ml-1">
                      {type === 'transfer' ? t.fromWallet : t.wallet}
                    </label>
                    <select
                      required
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                      className="input-field w-full"
                    >
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({formatCurrency(w.balance)})</option>
                      ))}
                    </select>
                  </div>
                  {type === 'transfer' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 ml-1">{t.toWallet}</label>
                      <select
                        required
                        value={toWalletId}
                        onChange={(e) => setToWalletId(e.target.value)}
                        className="input-field w-full"
                      >
                        <option value="">{lang === 'id' ? 'Pilih Tujuan' : 'Select Destination'}</option>
                        {wallets.filter(w => w.id !== walletId).map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 ml-1">{t.note}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field w-full h-20 resize-none"
                    placeholder={t.placeholderNote}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || (type === 'transfer' && !toWalletId)}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  <span>{submitting ? 'Processing...' : t.save}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
