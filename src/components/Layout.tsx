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
      
     {/* 🔥 FIXED + MODERN SIDEBAR */}
<aside className={`hidden md:flex w-64 flex-col border-r h-screen sticky top-0
  ${isDark 
    ? 'bg-slate-900 border-white/10 text-white' 
    : 'bg-white border-slate-200 text-slate-900'
  }`}
>
  {/* LOGO */}
  <div className="p-6 font-bold text-primary text-xl">
    FinApp's
  </div>

  {/* MENU */}
  <nav className="flex-1 px-3 space-y-2">
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = location.pathname === item.path;

      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isActive
              ? 'bg-primary text-white shadow-sm'
              : isDark
                ? 'text-white/70 hover:bg-white/10 hover:text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Icon size={20} />
          <span className="font-medium">{item.label}</span>
        </Link>
      );
    })}
  </nav>

  {/* LOGOUT */}
  <div className={`p-4 border-t ${
    isDark ? 'border-white/10' : 'border-slate-200'
  }`}>
    <button 
      onClick={handleLogout} 
      className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition"
    >
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
  {/* Mobile Bottom Nav - Floating Pill Dock */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-50">
        <nav className={`mx-auto max-w-sm rounded-2xl border border-border/50 p-2 flex justify-around items-center shadow-2xl backdrop-blur-xl ${isDark ? 'bg-card/80' : 'bg-white/80'}`}>
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative p-3 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' 
                    : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={20} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

     {/* 🔥 MODERN MOBILE SIDEBAR */}
<AnimatePresence>
  {isMobileMenuOpen && (
    <>
      {/* BACKDROP */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsMobileMenuOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
      />

      {/* SIDEBAR */}
      <motion.div 
        initial={{ x: -320 }}
        animate={{ x: 0 }}
        exit={{ x: -320 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className={`fixed left-0 top-0 bottom-0 w-72 z-[200] p-6 flex flex-col
          ${isDark 
            ? 'bg-slate-900 text-white border-r border-white/10' 
            : 'bg-white text-slate-900 border-r border-slate-200'
          }
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-primary">FinApp's</h2>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X size={20}/>
          </button>
        </div>

        {/* MENU */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : isDark 
                      ? 'text-white/70 hover:bg-white/10 hover:text-white'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <Icon size={20}/>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="mt-auto pt-6 border-t border-white/10 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 w-full transition"
          >
            <LogOut size={20}/>
            <span className="font-medium">Logout</span>
          </button>
        </div>

      </motion.div>
    </>
  )}
</AnimatePresence>
    </div>
  );
}
