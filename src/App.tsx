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
  const [showBanner, setShowBanner] = useState(false);
  const [pwaStatus, setPwaStatus] = useState<{
    sw: boolean;
    manifest: boolean;
    prompt: boolean;
  }>({ sw: false, manifest: false, prompt: false });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // PWA Diagnostics
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setPwaStatus(prev => ({ ...prev, sw: true }));
      });
    }

    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      setPwaStatus(prev => ({ ...prev, manifest: true }));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowBanner(true);
      setPwaStatus(prev => ({ ...prev, prompt: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

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
      {(showBanner || !pwaStatus.sw) && (
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
                {pwaStatus.prompt && (
                  <button 
                    onClick={handleInstallClick}
                    className="bg-white text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
                  >
                    Install
                  </button>
                )}
                <button 
                  onClick={handleForceUpdate}
                  title="Force Update & Clear Cache"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70"
                >
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={() => setShowBanner(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            {!pwaStatus.prompt && (
              <p className="text-[10px] opacity-70 italic">
                * Jika "Ready" belum hijau, silakan klik ikon Refresh di atas atau tunggu beberapa detik.
              </p>
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
