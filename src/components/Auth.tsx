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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 sm:p-12 relative backdrop-blur-sm"
      >
        <div className="text-center space-y-6 mb-10">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 bg-gradient-to-tr from-primary to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-primary/20"
          >
            <Sparkles size={40} className="text-white" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              FinApp's
            </h1>
            <p className="text-muted-foreground font-medium">
              {mode === 'login' && 'Selamat datang kembali!'}
              {mode === 'register' && 'Mulai perjalanan finansialmu'}
              {mode === 'forgot' && 'Atur ulang kata sandimu'}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl text-sm flex items-center gap-3 mb-8"
            >
              <ShieldCheck size={18} className="flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-accent/10 border border-accent/20 text-accent p-4 rounded-2xl text-sm flex items-center gap-3 mb-8"
            >
              <Zap size={18} className="flex-shrink-0" />
              <span className="font-medium">{message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field w-full pl-12 py-4 rounded-2xl"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full pl-12 py-4 rounded-2xl"
                placeholder="email@contoh.com"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground/70 ml-1">Kata Sandi</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pl-12 py-4 rounded-2xl"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="text-right">
              <Link to="/forgot-password" title="Lupa kata sandi?" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                Lupa kata sandi?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-xl shadow-primary/20"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <span className="font-black">
                  {mode === 'login' && 'MASUK'}
                  {mode === 'register' && 'DAFTAR'}
                  {mode === 'forgot' && 'KIRIM EMAIL'}
                </span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-sm">
          {mode === 'login' ? (
            <p className="text-muted-foreground font-medium">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary font-black hover:underline underline-offset-4">
                Daftar sekarang
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground font-medium">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-primary font-black hover:underline underline-offset-4">
                Masuk di sini
              </Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
