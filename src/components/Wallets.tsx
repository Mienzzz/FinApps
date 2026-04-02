import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, onSnapshot, addDoc, deleteDoc, doc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
import { 
  Plus, Wallet as WalletIcon, CreditCard, Banknote, Smartphone,
  Trash2, X, Loader2
} from 'lucide-react';
import Modal from '../components/Modal';
import { formatNumberInput, parseNumberInput } from '../lib/format';

export default function Wallets() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'e-wallet'>('cash');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
    });

    const q = query(collection(db, 'wallets'),
      where('uid', '==', auth.currentUser.uid)
    );

    const unsubWallets = onSnapshot(q, (snapshot) => {
      setWallets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubWallets();
    };
  }, []);

  const lang = userProfile?.language || 'en';

  const t = {
    title: lang === 'id' ? 'Dompet' : 'Wallets',
    add: lang === 'id' ? 'Tambah' : 'Add',
    save: lang === 'id' ? 'Simpan' : 'Save',
    name: lang === 'id' ? 'Nama Dompet' : 'Wallet Name',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

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
  };

  const isDark = userProfile?.theme !== 'light';

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t.title}</h2>
        <button onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2 rounded-xl flex gap-2">
          <Plus size={16}/> {t.add}
        </button>
      </div>

      {loading ? <Loader2 className="animate-spin"/> : (
        <div className="grid md:grid-cols-3 gap-4">
          {wallets.map(w => (
            <div key={w.id}
              className={`p-4 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
              }`}
            >
              <h4 className="font-bold">{w.name}</h4>
              <p>Rp {w.balance}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} isDark={isDark}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.name}
            className="w-full p-3 border rounded-xl"
          />

          <input
            value={balance}
            onChange={(e) => setBalance(formatNumberInput(e.target.value, 'id-ID'))}
            placeholder="0"
            className="w-full p-3 border rounded-xl"
          />

          <button className="w-full bg-primary text-white py-3 rounded-xl">
            {t.save}
          </button>
        </form>
      </Modal>

    </div>
  );
}
