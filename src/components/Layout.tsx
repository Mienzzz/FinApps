import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function Layout({ children }: any) {
  const location = useLocation();

  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  }, []);

  const handleInstall = async () => {
    const prompt = (window as any).deferredPrompt;
    if (!prompt) return;
    prompt.prompt();
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <h1 className="font-bold">FinApp</h1>

        <div className="flex gap-2">
          {!isOnline && (
            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
              Offline
            </span>
          )}

          <button
            onClick={handleInstall}
            className="bg-primary text-white px-3 py-1 rounded"
          >
            Install
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {children}
      </div>

    </div>
  );
}
