import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
import { 
  Plus, 
  Wallet as WalletIcon, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Trash2,
  X,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatNumberInput, parseNumberInput } from '../lib/format';
import { handleFirestoreError, OperationType } from '../lib/error';

export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      handleFirestoreError(err, OperationType.CREATE, 'wallets');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus dompet ini?')) return;
    await deleteDoc(doc(db, 'wallets', id));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote size={28} />;
      case 'bank': return <CreditCard size={28} />;
      case 'e-wallet': return <Smartphone size={28} />;
      default: return <WalletIcon size={28} />;
    }
  };

  const isDark = userProfile?.theme !== 'light';

  return (
    <div className="max-w-6xl mx-auto space-y-10 transition-colors duration-300">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Wallets</h2>

        <button 
          onClick={() => setShowForm(true)} 
          className="bg-primary text-white px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {/* LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : wallets.map((w) => (
          <div
            key={w.id}
            className={`p-6 rounded-2xl border transition ${
              isDark
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex justify-between">
              {getIcon(w.type)}
              <button onClick={() => handleDelete(w.id)}>
                <Trash2 size={18} />
              </button>
            </div>

            <h4 className="mt-4 font-bold">{w.name}</h4>
            <p className="text-xl font-bold">{formatCurrency(w.balance)}</p>
          </div>
        ))}
      </div>

      {/* MODAL */}
     <AnimatePresence>
  {showForm && (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">

      {/* OVERLAY */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setShowForm(false)}
        className={`absolute inset-0 ${
          isDark ? 'bg-black/80' : 'bg-black/40'
        }`}
      />

      {/* MODAL */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        
        // 🔥 INI KUNCI UTAMA
        onClick={(e) => e.stopPropagation()}
        
        className={`relative z-10 w-full max-w-md p-6 rounded-2xl border ${
          isDark
            ? 'bg-slate-900 border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
              <div className="flex justify-between mb-4">
                <h3 className="font-bold">Add Wallet</h3>
                <X onClick={() => setShowForm(false)} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* NAME */}
                <input
                  type="text"
                  placeholder="Wallet Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                {/* TYPE */}
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="e-wallet">E-Wallet</option>
                  <option value="credit">Credit</option>
                </select>

                {/* BALANCE */}
                <input
                  type="text"
                  placeholder="0"
                  value={balance}
                  onChange={(e) => setBalance(formatNumberInput(e.target.value, 'id-ID'))}
                  className={`w-full px-4 py-3 rounded-xl border text-lg ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-white py-3 rounded-xl font-bold"
                >
                  {submitting ? 'Saving...' : 'Save Wallet'}
                </button>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
