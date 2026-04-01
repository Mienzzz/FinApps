import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Auth({ mode }: { mode: 'login' | 'register' | 'forgot' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName,
          email,
          language: 'id',
          theme: 'dark',
          currency: 'IDR',
          createdAt: new Date().toISOString()
        });
        
        navigate('/');
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Email pemulihan kata sandi telah dikirim!');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-3xl shadow-sm p-8 sm:p-10"
      >
        <div className="text-center space-y-6 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles size={32} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              FinApp's
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'login' && 'Selamat datang kembali!'}
              {mode === 'register' && 'Mulai perjalanan finansialmu'}
              {mode === 'forgot' && 'Atur ulang kata sandimu'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-sm flex items-center gap-3 mb-6"
            >
              <ShieldCheck size={16} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-accent/10 border border-accent/20 text-accent p-3 rounded-xl text-sm flex items-center gap-3 mb-6"
            >
              <Zap size={16} className="flex-shrink-0" />
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border focus:border-primary/50 rounded-xl outline-none transition-all text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border focus:border-primary/50 rounded-xl outline-none transition-all text-sm"
                placeholder="email@contoh.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-secondary/50 border border-border focus:border-primary/50 rounded-xl outline-none transition-all text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <Link to="/forgot-password" title="Lupa kata sandi?" className="text-xs font-semibold text-primary hover:underline">
                Lupa kata sandi?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Masuk'}
                  {mode === 'register' && 'Daftar'}
                  {mode === 'forgot' && 'Kirim Email'}
                </span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          {mode === 'login' ? (
            <p>
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Daftar sekarang
              </Link>
            </p>
          ) : (
            <p>
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">
                Masuk di sini
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
