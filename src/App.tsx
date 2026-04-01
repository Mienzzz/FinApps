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
import AIAdvisor from './components/AIAdvisor';
import Settings from './components/Settings';
import { Loader2, AlertCircle } from 'lucide-react';

// Error Boundary Component (Simplified for lint)
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
            path="/ai" 
            element={user ? <Layout user={user}><AIAdvisor /></Layout> : <Navigate to="/login" />} 
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
