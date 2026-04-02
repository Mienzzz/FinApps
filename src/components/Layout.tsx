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
    <div className={`min-h-screen flex flex-col md:flex-row ${isDark ? 'bg-background text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* MAIN */}
      <main className="flex-1 pb-24">
        
        {/* HEADER */}
        <header className="flex justify-between items-center p-4 border-b bg-white dark:bg-background sticky top-0 z-40">
          
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu />
          </button>

          <div className="flex gap-2">
            <button onClick={toggleLanguage}><Globe /></button>
            <button onClick={toggleTheme}>
              {isDark ? <Sun /> : <Moon />}
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-6 pb-28">
          {children}
        </div>
      </main>

      {/* ✅ FIXED BOTTOM NAV (PASTI MUNCUL) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-card border-t flex justify-around py-3 shadow-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex flex-col items-center text-xs ${
                isActive ? 'text-primary font-bold' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[900]"
            />
            <motion.div 
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-background z-[999] p-6"
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
