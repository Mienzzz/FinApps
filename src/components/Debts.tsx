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
import { Debt, UserProfile } from '../types';
import { 
  Plus, 
  HandCoins, 
  Trash2, 
  CheckCircle2, 
  X, 
  Loader2,
  Calendar,
  User,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumberInput, parseNumberInput } from '../lib/format';
import { handleFirestoreError, OperationType } from '../lib/error';

export default function Debts() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'debt' | 'receivable'>('all');

  // Form State
  const [type, setType] = useState<'debt' | 'receivable'>('debt');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile for language/currency
    const userDoc = doc(db, 'users', auth.currentUser.uid);
    const unsubProfile = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
    });

    const q = query(
      collection(db, 'debts'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDebts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt)));
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubscribe();
    };
  }, []);

  const t = {
    en: {
      title: 'Debts & Receivables',
      add: 'Add New',
      search: 'Search person...',
      all: 'All',
      myDebts: 'My Debts',
      myReceivables: 'My Receivables',
      empty: 'No records found',
      paid: 'Paid',
      active: 'Active',
      markPaid: 'Mark as Paid',
      delete: 'Delete',
      confirmPaid: 'Mark this as paid?',
      confirmDelete: 'Delete this record?',
      formTitle: 'New Record',
      person: 'Person / Entity Name',
      personPlaceholder: 'Friend, Bank, etc.',
      amount: 'Amount',
      dueDate: 'Due Date (Optional)',
      note: 'Note',
      notePlaceholder: 'Additional details...',
      save: 'Save Record',
      totalDebt: 'Total Debt',
      totalReceivable: 'Total Receivable',
      remaining: 'Remaining',
      overdue: 'Overdue'
    },
    id: {
      title: 'Hutang Piutang',
      add: 'Tambah Baru',
      search: 'Cari nama...',
      all: 'Semua',
      myDebts: 'Hutang Saya',
      myReceivables: 'Piutang Saya',
      empty: 'Belum ada catatan',
      paid: 'Lunas',
      active: 'Aktif',
      markPaid: 'Tandai Lunas',
      delete: 'Hapus',
      confirmPaid: 'Tandai sebagai lunas?',
      confirmDelete: 'Hapus catatan ini?',
      formTitle: 'Catatan Baru',
      person: 'Nama Orang / Pihak',
      personPlaceholder: 'Teman, Bank, dll',
      amount: 'Jumlah',
      dueDate: 'Jatuh Tempo (Opsional)',
      note: 'Catatan',
      notePlaceholder: 'Keterangan tambahan...',
      save: 'Simpan Catatan',
      totalDebt: 'Total Hutang',
      totalReceivable: 'Total Piutang',
      remaining: 'Sisa',
      overdue: 'Terlambat'
    }
  }[userProfile?.language || 'id'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || submitting) return;
    setSubmitting(true);

    try {
      const numAmount = parseFloat(parseNumberInput(amount));
      await addDoc(collection(db, 'debts'), {
        uid: auth.currentUser.uid,
        type,
        personName,
        amount: numAmount,
        remainingAmount: numAmount,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'active',
        note,
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      resetForm();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'debts');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPersonName('');
    setAmount('');
    setDueDate('');
    setNote('');
  };

  const handleMarkAsPaid = async (debt: Debt) => {
    if (!window.confirm(t.confirmPaid)) return;
    try {
      await updateDoc(doc(db, 'debts', debt.id!), {
        status: 'paid',
        remainingAmount: 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await deleteDoc(doc(db, 'debts', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `debts/${id}`);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(userProfile?.language === 'en' ? 'en-US' : 'id-ID', { 
      style: 'currency', 
      currency: userProfile?.currency || 'IDR', 
      maximumFractionDigits: 0 
    }).format(val);
  };

  const filteredDebts = debts
    .filter(d => {
      const matchesSearch = d.personName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || d.type === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      return a.status === 'active' ? -1 : 1;
    });

  const totalDebt = debts.filter(d => d.type === 'debt' && d.status === 'active').reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && d.status === 'active').reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            {t.title}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">{debts.length} {t.title.toLowerCase()}</p>
        </motion.div>
        <motion.button 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)} 
          className="btn-primary flex items-center justify-center gap-2 py-3 px-6 rounded-xl shadow-lg shadow-primary/20 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold text-sm tracking-tight">{t.add}</span>
        </motion.button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 relative overflow-hidden group"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t.totalDebt}</p>
              <p className="text-xl font-bold text-secondary">{formatCurrency(totalDebt)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 relative overflow-hidden group"
        >
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <ArrowDownLeft size={20} />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">{t.totalReceivable}</p>
              <p className="text-xl font-bold text-accent">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full pl-12 py-3 text-sm rounded-xl shadow-sm border-border focus:ring-2 focus:ring-primary/10 transition-all"
          />
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-border shadow-inner">
          {(['all', 'debt', 'receivable'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === f ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f === 'all' ? t.all : f === 'debt' ? t.myDebts : t.myReceivables}
            </button>
          ))}
        </div>
      </div>

      {/* Debt List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-white/40 animate-pulse">Loading records...</p>
          </div>
        ) : filteredDebts.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredDebts.map((d, index) => (
              <motion.div 
                key={d.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-card flex flex-col justify-between group relative overflow-hidden p-5 ${
                  d.status === 'paid' ? 'opacity-50 grayscale' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      d.type === 'debt' ? 'bg-secondary/10 text-secondary' : 'bg-accent/10 text-accent'
                    }`}>
                      <HandCoins size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{d.personName}</h4>
                      <p className={`text-[8px] uppercase tracking-wider font-bold ${
                        d.type === 'debt' ? 'text-secondary' : 'text-accent'
                      }`}>
                        {d.type === 'debt' ? t.myDebts : t.myReceivables}
                      </p>
                    </div>
                  </div>
                  {d.status === 'active' && (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMarkAsPaid(d)}
                      className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 hover:bg-accent hover:text-white transition-all"
                    >
                      <CheckCircle2 size={14} />
                      {t.markPaid}
                    </motion.button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold mb-0.5">{t.amount}</p>
                      <p className={`text-xl font-bold ${d.type === 'debt' ? 'text-secondary' : 'text-accent'}`}>
                        {formatCurrency(d.amount)}
                      </p>
                    </div>
                    {d.dueDate && (
                      <div className="text-right">
                        <p className="text-[9px] uppercase tracking-wider text-white/30 font-bold mb-0.5">{t.dueDate}</p>
                        <p className={`text-xs font-medium flex items-center gap-1.5 justify-end ${
                          new Date(d.dueDate) < new Date() && d.status === 'active' ? 'text-red-400' : 'text-white/60'
                        }`}>
                          <Calendar size={14} />
                          {format(new Date(d.dueDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {d.note && (
                    <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                      <p className="text-xs text-white/50 italic leading-relaxed">"{d.note}"</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      d.status === 'paid' ? 'bg-accent' : 'bg-primary'
                    }`} />
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${
                      d.status === 'paid' ? 'text-accent' : 'text-primary'
                    }`}>
                      {d.status === 'paid' ? t.paid : t.active}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(d.id!)}
                    className="p-1.5 text-white/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-32 glass-card border-dashed border-white/10"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <HandCoins className="text-white/10" size={40} />
            </div>
            <p className="text-white/40 font-medium text-lg">{t.empty}</p>
          </motion.div>
        )}
      </div>

      {/* Form Modal */}
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
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg glass-card bg-card p-8 space-y-6 relative z-10 shadow-2xl border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {t.formTitle}
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5">Fill in the details below</p>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                  {(['debt', 'receivable'] as const).map((t_type) => (
                    <button
                      key={t_type}
                      type="button"
                      onClick={() => setType(t_type)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        type === t_type ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {t_type === 'debt' ? t.myDebts : t.myReceivables}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.person}</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      required
                      value={personName}
                      onChange={(e) => setPersonName(e.target.value)}
                      className="input-field w-full pl-14 py-3 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                      placeholder={t.personPlaceholder}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.amount}</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
                      {userProfile?.currency || 'IDR'}
                    </span>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={(e) => setAmount(formatNumberInput(e.target.value, userProfile?.language === 'id' ? 'id-ID' : 'en-US'))}
                      className="input-field w-full pl-24 py-4 bg-white/5 border-white/10 focus:border-primary/50 text-2xl font-bold text-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.dueDate}</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="input-field w-full pl-14 py-3 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/40 ml-1">{t.note}</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field w-full h-24 resize-none p-3 bg-white/5 border-white/10 focus:border-primary/50 text-sm"
                    placeholder={t.notePlaceholder}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full py-3.5 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Plus size={20} />
                      {t.save}
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
