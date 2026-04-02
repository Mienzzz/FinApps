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

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // PWA DETECT
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      unsubscribe();
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Auth mode="login" /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Auth mode="register" /> : <Navigate to="/" />} />

          <Route path="/" element={user ? <Layout user={user}><Dashboard /></Layout> : <Navigate to="/login" />} />
          <Route path="/transactions" element={user ? <Layout user={user}><Transactions /></Layout> : <Navigate to="/login" />} />
          <Route path="/wallets" element={user ? <Layout user={user}><Wallets /></Layout> : <Navigate to="/login" />} />
          <Route path="/debts" element={user ? <Layout user={user}><Debts /></Layout> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Layout user={user}><Settings /></Layout> : <Navigate to="/login" />} />
        </Routes>
      </Router>

      {/* 🔥 INSTALL UI KEREN */}
      {showInstall && (
        <div style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
          color: "#fff",
          padding: "14px 18px",
          borderRadius: "14px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          zIndex: 9999
        }}>
          <span>📲</span>
          <div>
            <div style={{ fontWeight: "bold" }}>Install FinApp</div>
            <div style={{ fontSize: "12px" }}>Lebih cepat & offline</div>
          </div>

          <button onClick={handleInstall} style={{
            marginLeft: "10px",
            padding: "8px 12px",
            background: "#fff",
            color: "#4f46e5",
            border: "none",
            borderRadius: "8px"
          }}>
            Install
          </button>

          <button onClick={() => setShowInstall(false)} style={{
            background: "transparent",
            border: "none",
            color: "#fff"
          }}>
            ✕
          </button>
        </div>
      )}
    </ErrorBoundary>
  );
}
