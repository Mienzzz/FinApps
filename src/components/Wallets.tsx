import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Wallet, UserProfile } from '../types';
import { 
  Plus, 
  Wallet as WalletIcon, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Trash2,
  X,
  Loader2,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumberInput, parseNumberInput } from '../lib/format';

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'e-wallet' | 'credit'>('cash');
  const [balance, setBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) setUserProfile(doc.data() as UserProfile);
    });

    const q = query(
      collection(db, 'wallets'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet)));
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || submitting) return;
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'wallets'), {
        uid: auth.currentUser.uid,
        name,
        type,
        balance: parseFloat(parseNumberInput(balance)),
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      setName('');
      setBalance('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(userProfile?.language === 'id' ? 'Hapus dompet ini? Semua riwayat saldo akan hilang.' : 'Delete this wallet? All balance history will be lost.')) return;
    try {
      await deleteDoc(doc(db, 'wallets', id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(userProfile?.language === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: userProfile?.currency || 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote size={28} />;
      case 'bank': return <CreditCard size={28} />;
      case 'e-wallet': return <Smartphone size={28} />;
      case 'credit': return <CreditCard size={28} className="text-secondary" />;
      default: return <WalletIcon size={28} />;
    }
  };

  const isDark = userProfile?.theme !== 'light';
  const lang = userProfile?.language || 'en';

  const t = {
    title: lang === 'id' ? 'Dompet & Akun' : 'Wallets & Accounts',
    add: lang === 'id' ? 'Tambah' : 'Add',
    noData: lang === 'id' ? 'Belum ada dompet terdaftar' : 'No wallets registered yet',
    newWallet: lang === 'id' ? 'Dompet Baru' : 'New Wallet',
    name: lang === 'id' ? 'Nama Dompet' : 'Wallet Name',
    type: lang === 'id' ? 'Tipe' : 'Type',
    initialBalance: lang === 'id' ? 'Saldo Awal' : 'Initial Balance',
    save: lang === 'id' ? 'Simpan Dompet' : 'Save Wallet',
    placeholderName: lang === 'id' ? 'BCA, GoPay, Tunai, dll' : 'Bank, E-Wallet, Cash, etc',
    cash: lang === 'id' ? 'Tunai (Cash)' : 'Cash',
    bank: lang === 'id' ? 'Rekening Bank' : 'Bank Account',
    eWallet: lang === 'id' ? 'E-Wallet' : 'E-Wallet',
    credit: lang === 'id' ? 'Kartu Kredit / Paylater' : 'Credit Card / Paylater',
  };

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.title}</h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-2 px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {wallets.length} {lang === 'id' ? 'Akun' : 'Accounts'}
              </span>
            </div>
            <p className={`text-sm font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              {lang === 'id' ? 'Total:' : 'Total:'} <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-bold`}>{formatCurrency(totalBalance)}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span className="font-bold uppercase tracking-wider text-xs">{t.add}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-white/40 font-medium uppercase tracking-widest text-[10px]">Loading Wallets...</p>
          </div>
        ) : wallets.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {wallets.map((w, index) => (
              <motion.div 
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card group relative p-6 flex flex-col justify-between min-h-[180px] hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    w.type === 'cash' ? 'bg-accent/10 text-accent border border-accent/20' : 
                    w.type === 'bank' ? 'bg-primary/10 text-primary border border-primary/20' : 
                    w.type === 'e-wallet' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                    'bg-secondary/10 text-secondary border border-secondary/20'
                  }`}>
                    {getIcon(w.type)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                      w.type === 'cash' ? 'bg-accent/10 text-accent' : 
                      w.type === 'bank' ? 'bg-primary/10 text-primary' : 
                      w.type === 'e-wallet' ? 'bg-blue-500/10 text-blue-500' : 
                      'bg-secondary/10 text-secondary'
                    }`}>
                      {w.type}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(w.id!);
                      }}
                      className="p-1.5 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-lg tracking-tight mb-0.5 group-hover:text-primary transition-colors">{w.name}</h4>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold tracking-tight">{formatCurrency(w.balance)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-20 glass-card border-dashed border-white/10"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <WalletIcon className="text-white/10" size={32} />
            </div>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">{t.noData}</p>
          </motion.div>
        )}
      </div>

      {/* Add Wallet Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md glass-card relative z-10 p-8 space-y-6 overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{t.newWallet}</h3>
                  <p className="text-white/40 text-xs">{lang === 'id' ? 'Tambahkan sumber dana baru' : 'Add a new funding source'}</p>
                </div>
                <button 
                  onClick={() => setShowForm(false)} 
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.name}</label>
                  <div className="relative">
                    <WalletIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field w-full pl-11 py-3 text-sm"
                      placeholder={t.placeholderName}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.type}</label>
                  <div className="relative">
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={18} />
                    <select
                      required
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="input-field w-full appearance-none py-3 text-sm"
                    >
                      <option value="cash">{t.cash}</option>
                      <option value="bank">{t.bank}</option>
                      <option value="e-wallet">{t.eWallet}</option>
                      <option value="credit">{t.credit}</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.initialBalance}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/20">
                      {userProfile?.currency || 'IDR'}
                    </span>
                    <input
                      type="text"
                      required
                      value={balance}
                      onChange={(e) => setBalance(formatNumberInput(e.target.value, lang === 'id' ? 'id-ID' : 'en-US'))}
                      className="input-field w-full pl-16 py-4 text-2xl font-bold text-primary placeholder:text-white/5"
                      placeholder="0"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-4 text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 flex items-center justify-center gap-2 rounded-xl"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  {submitting ? 'Processing...' : t.save}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
