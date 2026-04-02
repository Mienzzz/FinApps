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

export default function Layout({ children, user }: any) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) setUserProfile(docSnap.data() as UserProfile);
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

  const isDark = userProfile?.theme !== 'light';
  const lang = userProfile?.language || 'en';

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: lang === 'id' ? 'Beranda' : 'Dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: lang === 'id' ? 'Transaksi' : 'Transactions' },
    { path: '/wallets', icon: Wallet, label: lang === 'id' ? 'Dompet' : 'Wallets' },
    { path: '/debts', icon: HandCoins, label: lang === 'id' ? 'Hutang' : 'Debts' },
    { path: '/settings', icon: SettingsIcon, label: lang === 'id' ? 'Pengaturan' : 'Settings' },
  ];

  React.useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${
      isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'
    }`}>

      {/* SIDEBAR */}
      <aside className={`hidden md:flex w-64 flex-col border-r ${
        isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200'
      }`}>
        <div className="p-6 font-bold text-primary text-xl">FinApp's</div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  isActive
                    ? 'bg-primary text-white'
                    : isDark
                      ? 'text-white/70 hover:bg-white/10'
                      : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={20}/>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="text-red-500 flex gap-2">
            <LogOut size={18}/> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 pb-32">

        {/* HEADER */}
        <header className={`flex justify-between items-center p-4 border-b ${
          isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'
        }`}>
          
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </button>

          <div className="flex gap-3 items-center">

            {/* 🌍 FLAG */}
            <div className="text-xl">
              {lang === 'id' ? '🇮🇩' : '🇺🇸'}
            </div>

            <button onClick={toggleLanguage} className="p-2 border rounded-lg">
              <Globe size={18}/>
            </button>

            <button onClick={toggleTheme} className="p-2 border rounded-lg">
              {isDark ? <Sun size={18}/> : <Moon size={18}/>}
            </button>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>

      {/* 🔥 MODERN FLOATING NAV */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md">
        <nav className={`flex justify-between px-3 py-2 rounded-3xl shadow-2xl backdrop-blur-xl ${
          isDark ? 'bg-slate-800/90 border border-white/10' : 'bg-white/90 border'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link key={item.path} to={item.path}
                className={`flex flex-col items-center flex-1 py-2 rounded-xl transition ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white scale-105'
                    : 'text-gray-400'
                }`}
              >
                <Icon size={20}/>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              className="fixed inset-0 bg-black/60 z-[150]"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`fixed left-0 top-0 bottom-0 w-64 z-[200] p-6 ${
                isDark ? 'bg-slate-900 text-white' : 'bg-white'
              }`}
            >
              <button onClick={() => setIsMobileMenuOpen(false)}><X /></button>

              {navItems.map((item) => (
                <Link key={item.path} to={item.path} className="block py-3">
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
