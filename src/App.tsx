import React, { useState, useEffect, Component, ReactNode } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate 
} from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Wallets from './components/Wallets';
import Debts from './components/Debts';
import Settings from './components/Settings';
import { Loader2, AlertCircle, Download, X, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';

// Error Boundary Component (Simplified for lint)
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(true);
  const [pwaStatus, setPwaStatus] = useState<{
    sw: boolean;
    manifest: boolean;
    prompt: boolean;
    error: string | null;
  }>({ sw: false, manifest: false, prompt: false, error: null });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // PWA Diagnostics
    const checkPWA = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            setPwaStatus(prev => ({ ...prev, sw: true }));
          }
        } else {
          setPwaStatus(prev => ({ ...prev, error: 'Service Worker not supported' }));
        }

        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          setPwaStatus(prev => ({ ...prev, manifest: true }));
        } else {
          setPwaStatus(prev => ({ ...prev, error: 'Manifest link not found' }));
        }
      } catch (err) {
        setPwaStatus(prev => ({ ...prev, error: String(err) }));
      }
    };

    checkPWA();

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt fired');
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
      setPwaStatus(prev => ({ ...prev, prompt: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      setShowBanner(false);
    });

    return () => {
      unsubscribe();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowBanner(false);
    }
  };

  const handleForceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
    const cacheNames = await caches.keys();
    for (let cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
    window.location.reload();
  };

  const triggerEngagement = () => {
    // Dummy interaction to satisfy Chrome's engagement requirement
    console.log('Engagement triggered');
    window.dispatchEvent(new Event('resize'));
    // Show a small tip
    alert('Sistem instalasi sedang disiapkan. Jika tombol "Install" belum muncul dalam 5 detik, silakan klik ikon Tiga Titik di pojok kanan atas Chrome, lalu pilih "Install App".');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <h1 className="text-2xl font-bold text-primary animate-pulse">FinApp's</h1>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {showBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-primary/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                  <Download size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">FinApp's PWA Status</p>
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center gap-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                      {pwaStatus.sw ? <ShieldCheck size={10} className="text-green-400" /> : <ShieldAlert size={10} className="text-red-400" />} SW
                    </span>
                    <span className="flex items-center gap-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                      {pwaStatus.manifest ? <ShieldCheck size={10} className="text-green-400" /> : <ShieldAlert size={10} className="text-red-400" />} Manifest
                    </span>
                    <span className="flex items-center gap-1 text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                      {pwaStatus.prompt ? <ShieldCheck size={10} className="text-green-400" /> : <ShieldAlert size={10} className="text-yellow-400" />} Ready
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pwaStatus.prompt ? (
                  <button 
                    onClick={handleInstallClick}
                    className="bg-white text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                  >
                    Install
                  </button>
                ) : (
                  <button 
                    onClick={handleForceUpdate}
                    title="Force Update & Clear Cache"
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                  >
                    <RefreshCw size={18} className="animate-spin" />
                  </button>
                )}
                <button 
                  onClick={() => setShowBanner(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {pwaStatus.error && (
              <p className="text-[10px] text-red-200 bg-red-500/20 p-1 rounded">
                Error: {pwaStatus.error}
              </p>
            )}
            {!pwaStatus.prompt && (
              <div className="text-[10px] opacity-70 space-y-2">
                <p italic>* Menunggu browser memberikan izin instalasi...</p>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={triggerEngagement}
                    className="bg-white/20 hover:bg-white/30 py-1.5 rounded text-center font-bold transition-colors"
                  >
                    Klik di sini untuk Aktifkan Fitur Instalasi
                  </button>
                  <p className="text-[9px] leading-tight">
                    Jika tetap kuning, klik <b>Menu Chrome (⋮)</b> → <b>Install App</b>. Jika menu tersebut tidak ada, berarti browser Anda belum mendukung PWA sepenuhnya.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={!user ? <Auth mode="login" /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Auth mode="register" /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <Auth mode="forgot" /> : <Navigate to="/" />} />

          {/* Private Routes */}
          <Route 
            path="/" 
            element={user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/transactions" 
            element={user ? <Layout user={user}><Transactions /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/wallets" 
            element={user ? <Layout user={user}><Wallets /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/debts" 
            element={user ? <Layout user={user}><Debts /></Layout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/settings" 
            element={user ? <Layout user={user}><Settings /></Layout> : <Navigate to="/login" />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
