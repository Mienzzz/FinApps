import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';

// Error Boundary (simple)
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 PWA STATE
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  const triggerEngagement = () => {
    console.log('Engagement triggered');
    window.dispatchEvent(new Event('resize'));
  };

  useEffect(() => {
    // AUTH
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // 🔥 PWA INSTALL LISTENER
    const installHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      console.log("PWA install ready");
    };

    window.addEventListener("beforeinstallprompt", installHandler);

    // SERVICE WORKER UPDATE LOGIC
    let interval: NodeJS.Timeout;

    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

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

      navigator.serviceWorker.getRegistration().then(reg => {
        if (reg) {
          reg.update();
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    }

    // trigger engagement
    const engagementTimeout = setTimeout(triggerEngagement, 5000);

    // AUTO LOGOUT
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 15 * 60 * 1000;

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (user) {
        inactivityTimer = setTimeout(() => {
          console.log('Auto logout');
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

      // cleanup PWA
      window.removeEventListener("beforeinstallprompt", installHandler);
    };
  }, [user]);

  // 🔥 HANDLE INSTALL CLICK
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    console.log("User choice:", choice);

    setDeferredPrompt(null);
    setShowInstall(false);
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
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={!user ? <Auth mode="login" /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Auth mode="register" /> : <Navigate to="/" />} />
          <Route path="/forgot-password" element={!user ? <Auth mode="forgot" /> : <Navigate to="/" />} />

          {/* Private */}
          <Route path="/" element={user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />} />
          <Route path="/transactions" element={user ? <Layout user={user}><Transactions /></Layout> : <Navigate to="/login" />} />
          <Route path="/wallets" element={user ? <Layout user={user}><Wallets /></Layout> : <Navigate to="/login" />} />
          <Route path="/debts" element={user ? <Layout user={user}><Debts /></Layout> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Layout user={user}><Settings /></Layout> : <Navigate to="/login" />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>

      {/* 🔥 INSTALL BUTTON */}
      {showInstall && (
        <button
          onClick={handleInstallClick}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "12px 16px",
            backgroundColor: "#8b5cf6",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            zIndex: 9999
          }}
        >
          Install App
        </button>
      )}
    </ErrorBoundary>
  );
}
