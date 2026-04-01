import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  doc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Transaction, Wallet, Debt, FinancialHealth, UserProfile } from '../types';
import { getFinancialAdvice, askFinancialQuestion } from '../services/geminiService';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  BrainCircuit, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Zap,
  ShieldCheck,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AIAdvisor() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch user profile for language
    const userDoc = doc(db, 'users', auth.currentUser.uid);
    const unsubProfile = onSnapshot(userDoc, (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
    });

    const qT = query(collection(db, 'transactions'), where('uid', '==', auth.currentUser.uid), orderBy('date', 'desc'), limit(100));
    const qW = query(collection(db, 'wallets'), where('uid', '==', auth.currentUser.uid));
    const qD = query(collection(db, 'debts'), where('uid', '==', auth.currentUser.uid));

    const unsubT = onSnapshot(qT, (s) => setTransactions(s.docs.map(d => d.data() as Transaction)));
    const unsubW = onSnapshot(qW, (s) => setWallets(s.docs.map(d => d.data() as Wallet)));
    const unsubD = onSnapshot(qD, (s) => setDebts(s.docs.map(d => d.data() as Debt)));

    return () => { 
      unsubProfile();
      unsubT(); 
      unsubW(); 
      unsubD(); 
    };
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && wallets.length > 0 && !health) {
      fetchHealth();
    } else if (transactions.length === 0 && wallets.length === 0) {
      setLoadingHealth(false);
    }
  }, [transactions, wallets]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const t = {
    en: {
      title: 'AI Financial Advisor',
      subtitle: 'Your intelligent assistant for financial health',
      analyzing: 'Analyzing your financial data...',
      scoreTitle: 'Financial Health Score',
      adviceTitle: 'Financial Advice',
      updateAnalysis: 'Refresh Analysis',
      askTitle: 'Ask AI',
      placeholder: 'Type your question here...',
      chatEmpty: 'Ask anything about your finances.\nExample: "How can I save more money?"',
      error: 'Sorry, I am experiencing technical difficulties. Please try again later.',
      noData: 'Not enough data to analyze your financial health.',
      status: {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
      }
    },
    id: {
      title: 'AI Penasihat Keuangan',
      subtitle: 'Asisten cerdas untuk kesehatan keuanganmu',
      analyzing: 'Menganalisis data keuanganmu...',
      scoreTitle: 'Skor Kesehatan Keuangan',
      adviceTitle: 'Saran Keuangan',
      updateAnalysis: 'Perbarui Analisis',
      askTitle: 'Tanya AI',
      placeholder: 'Ketik pertanyaanmu di sini...',
      chatEmpty: 'Tanyakan apa saja tentang keuanganmu.\nContoh: "Bagaimana cara menabung lebih banyak?"',
      error: 'Maaf, saya sedang mengalami gangguan teknis. Coba lagi nanti.',
      noData: 'Data belum cukup untuk menganalisis kesehatan keuanganmu.',
      status: {
        excellent: 'Sangat Baik',
        good: 'Baik',
        fair: 'Cukup',
        poor: 'Kurang'
      }
    }
  }[userProfile?.language || 'id'];

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await getFinancialAdvice(transactions, debts, wallets, userProfile?.language || 'id');
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loadingChat) return;

    const userQ = question;
    setQuestion('');
    setChat(prev => [...prev, { role: 'user', text: userQ }]);
    setLoadingChat(true);

    try {
      const answer = await askFinancialQuestion(userQ, transactions, debts, wallets, userProfile?.language || 'id');
      setChat(prev => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      console.error(err);
      setChat(prev => [...prev, { role: 'ai', text: t.error }]);
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20"
        >
          <Sparkles size={24} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-3xl font-bold tracking-tight">
            {t.title}
          </h2>
          <p className="text-white/40 font-medium text-sm">{t.subtitle}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Health Score & Advice */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            {loadingHealth ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-white/60 font-bold text-lg animate-pulse">{t.analyzing}</p>
              </div>
            ) : health ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent" className="text-white/5"
                      />
                      <motion.circle
                        initial={{ strokeDashoffset: 402 }}
                        animate={{ strokeDashoffset: 402 - (402 * health.score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="72" cy="72" r="64"
                        stroke="currentColor" strokeWidth="8"
                        fill="transparent" className="text-primary"
                        strokeDasharray={402}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">{health.score}</span>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-white/40">Score</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                      <ShieldCheck size={14} />
                      {health.status}
                    </div>
                    <h3 className="text-2xl font-bold text-white leading-tight">
                      {userProfile?.language === 'en' ? 'Your Financial Status is ' : 'Kondisi Keuanganmu '}
                      <span className="text-primary">{health.status}</span>
                    </h3>
                    <button 
                      onClick={fetchHealth}
                      className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-primary transition-colors"
                    >
                      <RefreshCw size={14} />
                      {t.updateAnalysis}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      <Target size={18} />
                    </div>
                    <h4 className="text-lg font-bold text-white">{t.adviceTitle}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {health.advice.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.3 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all"
                      >
                        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <CheckCircle2 size={14} />
                        </div>
                        <p className="text-xs text-white/70 leading-relaxed">{item}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-white/10" size={32} />
                </div>
                <p className="text-white/40 font-medium text-base">{t.noData}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card flex flex-col h-[550px] p-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare size={18} />
                </div>
                <h4 className="font-bold text-base">{t.askTitle}</h4>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[9px] uppercase tracking-wider font-bold text-white/40">AI Online</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1 scrollbar-hide">
              {chat.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/20 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Sparkles size={24} className="opacity-20" />
                  </div>
                  <p className="text-xs font-medium leading-relaxed whitespace-pre-line">{t.chatEmpty}</p>
                </div>
              )}
              {chat.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 5, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[90%] p-3.5 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none font-medium' 
                      : 'bg-white/5 text-white/90 rounded-tl-none border border-white/10'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loadingChat && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/10 flex items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={14} />
                    <span className="text-[10px] text-white/40 font-bold">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAsk} className="relative mt-auto">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.placeholder}
                className="input-field w-full pr-12 py-3 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl text-xs"
              />
              <button 
                type="submit"
                disabled={!question.trim() || loadingChat}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-md shadow-primary/20 disabled:opacity-50 transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
