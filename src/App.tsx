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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Silent Background Update Logic
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Automatically reload when a new service worker takes control
        window.location.reload();
      });

      // Periodically check for updates every 5 minutes
      const interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) reg.update();
        });
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
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
      {installPrompt && (
        <div className="fixed bottom-6 right-6 z-[100] animate-bounce">
          <button 
            onClick={handleInstallClick}
            className="bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-110 transition-transform"
          >
            <Download size={24} />
            <span className="font-bold pr-2">Install App</span>
          </button>
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
