import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  HandCoins, 
  Settings as SettingsIcon, 
  LogOut,
  Sun,
  Moon,
  Globe,
  Menu,
  X
} from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const toggleTheme = async () => {
    if (!auth.currentUser || !userProfile) return;
    const newTheme = userProfile.theme === 'dark' ? 'light' : 'dark';
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { theme: newTheme });
  };

  const toggleLanguage = async () => {
    if (!auth.currentUser || !userProfile) return;
    const newLang = userProfile.language === 'en' ? 'id' : 'en';
    await updateDoc(doc(db, 'users', auth.currentUser.uid), { language: newLang });
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { path: '/wallets', icon: Wallet, label: 'Wallets' },
    { path: '/debts', icon: HandCoins, label: 'Debts' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const isDark = userProfile?.theme !== 'light';

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${
      isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900">
        <div className="p-6 font-bold text-primary text-xl">
          FinApp's
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 pb-32">
        
        {/* HEADER FIX DARK */}
        <header className={`flex justify-between items-center p-4 border-b sticky top-0 z-40 backdrop-blur-xl ${
          isDark 
            ? 'bg-slate-900/80 border-white/10' 
            : 'bg-white/80 border-slate-200'
        }`}>
          
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </button>

          <div className="flex gap-3">
            <button onClick={toggleLanguage} className="p-2 rounded-lg border border-slate-200 dark:border-white/10">
              <Globe size={18}/>
            </button>

            <button onClick={toggleTheme} className="p-2 rounded-lg border border-slate-200 dark:border-white/10">
              {isDark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6">
          {children}
        </div>
      </main>

     {/* 🔥 ULTRA MODERN CENTERED FLOATING NAV */}
<div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-[200]">
  <div className={`
    flex items-center justify-between gap-2
    px-3 py-2
    rounded-full
    shadow-2xl backdrop-blur-xl
    border
    ${isDark 
      ? 'bg-slate-800/80 border-white/10' 
      : 'bg-white/90 border-slate-200'
    }
  `}>

    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <Link
          key={item.path}
          to={item.path}
          className="relative flex flex-col items-center justify-center w-14"
        >
          {/* ACTIVE BACKGROUND */}
          {isActive && (
            <motion.div
              layoutId="navActiveBg"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg"
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          )}

          {/* ICON */}
          <div className={`
            relative z-10 p-2 rounded-full transition-all duration-300
            ${isActive 
              ? 'text-white scale-110' 
              : isDark 
                ? 'text-white/60' 
                : 'text-slate-400'
            }
          `}>
            <Icon size={18}/>
          </div>

          {/* LABEL */}
          <span className={`
            relative z-10 text-[9px] mt-1 font-medium transition-all
            ${isActive 
              ? 'text-white' 
              : isDark 
                ? 'text-white/50' 
                : 'text-slate-400'
            }
          `}>
            {item.label}
          </span>

        </Link>
      );
    })}

  </div>
</div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[150]"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[200] p-6"
            >
              <button onClick={() => setIsMobileMenuOpen(false)} className="mb-6">
                <X />
              </button>

              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3"
                >
                  {item.label}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
