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
  ChevronRight,
  Camera,
  Image as ImageIcon,
  XCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumberInput, parseNumberInput } from '../lib/format';
import { handleFirestoreError, OperationType } from '../lib/error';

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
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setReceiptImage(compressed);
      } catch (err) {
        console.error("Error compressing image:", err);
      }
    }
  };

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
        receiptImage: receiptImage || null,
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
      handleFirestoreError(err, OperationType.CREATE, 'transactions');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setNote('');
    setReceiptImage(null);
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
      handleFirestoreError(err, OperationType.DELETE, `transactions/${t.id}`);
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
    receipt: lang === 'id' ? 'Foto Bon / Resi' : 'Receipt Photo',
    capture: lang === 'id' ? 'Ambil Foto' : 'Take Photo',
    upload: lang === 'id' ? 'Unggah' : 'Upload',
    remove: lang === 'id' ? 'Hapus' : 'Remove',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t.title}</h2>
          <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {transactions.length} {lang === 'id' ? 'transaksi tercatat' : 'transactions recorded'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center px-6 py-3 shadow-lg shadow-primary/20 rounded-xl group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-bold text-sm tracking-tight">{t.add}</span>
        </button>
      </div>

      {/* Search & Filter */}
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
          {(['all', 'income', 'expense', 'transfer'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm ${
                        transaction.type === 'income' ? 'bg-accent/10 text-accent' : 
                        transaction.type === 'expense' ? 'bg-secondary/10 text-secondary' : 
                        'bg-primary/10 text-primary'
                      }`}>
                        {transaction.type === 'income' ? <ArrowUpRight size={24} /> : 
                         transaction.type === 'expense' ? <ArrowDownRight size={24} /> : <ArrowLeftRight size={24} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground truncate">{transaction.category}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar size={12} />
                            {format(new Date(transaction.date), 'dd MMM yyyy')}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="flex items-center gap-1 truncate">
                            <WalletIcon size={12} />
                            {wallets.find(w => w.id === transaction.walletId)?.name || 'Wallet'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {transaction.receiptImage && (
                        <button
                          onClick={() => setSelectedReceipt(transaction.receiptImage!)}
                          className="w-10 h-10 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors flex-shrink-0"
                        >
                          <img 
                            src={transaction.receiptImage} 
                            alt="Receipt" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      )}
                      <div className="text-right">
                        <p className={`text-base sm:text-lg font-extrabold tracking-tight ${
                          transaction.type === 'income' ? 'text-accent' : 
                          transaction.type === 'expense' ? 'text-secondary' : 'text-primary'
                        }`}>
                          {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                          {formatCurrency(transaction.amount)}
                        </p>
                        {transaction.note && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[80px] sm:max-w-[120px] ml-auto font-medium">
                            {transaction.note}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(transaction);
                        }}
                        className="p-2 text-slate-400 hover:text-secondary hover:bg-secondary/5 rounded-xl transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center"
                      >
                        <Trash2 size={18} />
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
              className="w-full max-w-lg bg-card border border-border rounded-2xl relative z-10 p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
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
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      {userProfile?.currency || 'IDR'}
                    </span>
                    <input
                      type="text"
                      required
                      value={amount}
                      onChange={(e) => setAmount(formatNumberInput(e.target.value, lang === 'id' ? 'id-ID' : 'en-US'))}
                      className="input-field w-full pl-24 py-4 text-2xl font-bold text-primary"
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

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 ml-1">{t.receipt}</label>
                  <div className="flex flex-col gap-3">
                    {receiptImage ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border group">
                        <img 
                          src={receiptImage} 
                          alt="Captured receipt" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setReceiptImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                          <Camera size={24} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.capture}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment" 
                            onChange={handleImageChange} 
                            className="hidden" 
                          />
                        </label>
                        <label className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                          <ImageIcon size={24} className="text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{t.upload}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}
                  </div>
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

      {/* Receipt Viewer Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute -top-12 right-0 p-2 text-white hover:text-primary transition-colors"
              >
                <X size={32} />
              </button>
              <img 
                src={selectedReceipt} 
                alt="Full receipt" 
                className="w-full h-full object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
