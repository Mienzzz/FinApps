import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  HandCoins, 
  Sparkles, 
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
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

const handleInstall = async () => {
  const prompt = (window as any).deferredPrompt;
  if (!prompt) return alert('Install belum tersedia');

  prompt.prompt();
  await prompt.userChoice;
};

<button
  onClick={handleInstall}
  className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow"
>
  Install App
</button>

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
    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
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
    { path: '/', icon: LayoutDashboard, label: userProfile?.language === 'id' ? 'Beranda' : 'Dashboard' },
    { path: '/transactions', icon: ArrowLeftRight, label: userProfile?.language === 'id' ? 'Transaksi' : 'Transactions' },
    { path: '/wallets', icon: Wallet, label: userProfile?.language === 'id' ? 'Dompet' : 'Wallets' },
    { path: '/debts', icon: HandCoins, label: userProfile?.language === 'id' ? 'Hutang' : 'Debts' },
    { path: '/settings', icon: SettingsIcon, label: userProfile?.language === 'id' ? 'Pengaturan' : 'Settings' },
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
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-300 ${isDark ? 'dark bg-background text-foreground' : 'bg-slate-50 text-slate-900'}`}>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex w-64 flex-col border-r border-border sticky top-0 h-screen z-50 ${isDark ? 'bg-card' : 'bg-white'}`}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">
              FinApp's
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
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
                      ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                      : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-secondary hover:bg-secondary/5 transition-all font-medium"
          >
            <LogOut size={20} />
            <span>{userProfile?.language === 'id' ? 'Keluar' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className={`border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40 transition-all ${isDark ? 'bg-background/80 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl'}`}>
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors border border-border"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={16} />
              </div>
              <h2 className="text-lg font-bold tracking-tight">FinApp's</h2>
            </div>
            <div className="hidden md:block">
              <p className="font-bold text-lg tracking-tight">{userProfile?.displayName || user?.email?.split('@')[0] || 'User'}</p>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {userProfile?.language === 'id' ? 'Selamat Datang Kembali' : 'Welcome back to your finances'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <button 
              onClick={toggleLanguage}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border border-border font-bold shadow-sm ${
                isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Globe size={16} className="text-primary" />
              <span className="text-xs uppercase tracking-widest">{userProfile?.language || 'en'}</span>
            </button>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all border border-border shadow-sm ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-slate-50'
              }`}
            >
              {isDark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-indigo-600" />}
            </button>
          </div>
        </header>

        <div className="p-6 pb-24 md:pb-6 flex-1 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

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

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className={`fixed inset-y-0 left-0 w-80 z-[70] p-8 flex flex-col ${isDark ? 'bg-background' : 'bg-white'}`}
            >
              <div className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-black text-primary">FinApp's</h1>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-xl">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 space-y-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : isDark ? 'text-white/50' : 'text-slate-500'
                      }`}
                    >
                      <Icon size={22} />
                      <span className="font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl text-secondary font-bold mt-auto"
              >
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
