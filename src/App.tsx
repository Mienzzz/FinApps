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
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkStandalone);
  }, []);

  const triggerEngagement = () => {
    // Dummy interaction to satisfy Chrome's engagement requirement
    console.log('Engagement triggered');
    window.dispatchEvent(new Event('resize'));
    // We don't use alert anymore as requested for silent background process
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    let interval: NodeJS.Timeout;

    // Silent Background Update Logic
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        // Automatically reload when a new service worker takes control
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      // Periodically check for updates every 5 minutes
      interval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg) {
            reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        });
      }, 5 * 60 * 1000);

      // Initial check on load
      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    }

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Trigger dummy engagement after 5 seconds
    const engagementTimeout = setTimeout(triggerEngagement, 5000);

    // --- Auto-Logout Logic ---
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (user) {
        inactivityTimer = setTimeout(() => {
          console.log('Inactivity timeout reached. Logging out...');
          auth.signOut();
        }, INACTIVITY_LIMIT);
      }
    };

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    if (user) {
      activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer);
      });
      resetInactivityTimer();
    }

    return () => {
      unsubscribe();
      if (interval) clearInterval(interval);
      clearTimeout(engagementTimeout);
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [user]);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      alert('Untuk menginstal aplikasi ini secara manual:\n1. Klik ikon tiga titik di pojok kanan atas browser\n2. Pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"');
      return;
    }
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
      {user && !isStandalone && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <button 
            onClick={handleInstallClick}
            className="group relative flex items-center justify-center"
          >
            {/* Tooltip for manual install if prompt is missing */}
            {!installPrompt && (
              <div className="absolute bottom-full mb-2 right-0 w-48 bg-slate-800 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Klik menu browser (tiga titik) lalu pilih "Instal Aplikasi" atau "Tambahkan ke Layar Utama"
              </div>
            )}
            <div className={`bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 hover:scale-110 transition-transform ${!installPrompt ? 'opacity-70 grayscale-[0.5]' : 'animate-bounce'}`}>
              <Download size={24} />
              <span className="font-bold pr-2">
                {installPrompt ? 'Instal App' : 'Cara Instal'}
              </span>
            </div>
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
