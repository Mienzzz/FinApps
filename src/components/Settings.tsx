import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { 
  Settings as SettingsIcon, 
  User,
  Mail,
  Coins,
  Shield,
  Bell,
  Smartphone,
  Save,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as UserProfile;
        setProfile(data);
        setDisplayName(data.displayName || '');
        setCurrency(data.currency || 'IDR');
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName,
        currency,
        theme: profile.theme,
        language: profile.language
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleTheme = async (newTheme: 'light' | 'dark') => {
    if (!auth.currentUser || !profile) return;
    setProfile({ ...profile, theme: newTheme });
  };

  const toggleLanguage = async (newLang: 'en' | 'id') => {
    if (!auth.currentUser || !profile) return;
    setProfile({ ...profile, language: newLang });
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary" size={48} />
      <p className="text-white/40 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Settings...</p>
    </div>
  );

  const isDark = profile?.theme !== 'light';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
            <SettingsIcon size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{profile?.language === 'id' ? 'Pengaturan' : 'Settings'}</h2>
            <p className={`text-sm font-medium mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {profile?.language === 'id' ? 'Kelola profil dan preferensi aplikasimu' : 'Manage your profile and app preferences'}
            </p>
          </div>
        </div>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-accent font-bold bg-accent/10 px-4 py-2 rounded-full border border-accent/20"
          >
            <CheckCircle2 size={18} />
            <span>{profile?.language === 'id' ? 'Tersimpan!' : 'Saved!'}</span>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-8 space-y-8 rounded-3xl border border-border shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary shadow-inner">
                <User size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight">{profile?.language === 'id' ? 'Profil Pengguna' : 'User Profile'}</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-xs font-black mb-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {profile?.language === 'id' ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input-field w-full pl-16 py-4 text-lg rounded-2xl shadow-sm border-border focus:ring-4 focus:ring-primary/10 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black mb-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="email"
                    value={profile?.email}
                    disabled
                    className="input-field w-full pl-16 py-4 text-lg rounded-2xl opacity-50 cursor-not-allowed bg-slate-100 dark:bg-white/5 border-border"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black mb-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {profile?.language === 'id' ? 'Mata Uang' : 'Currency'}
                </label>
                <div className="relative group">
                  <Coins className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field w-full pl-16 py-4 text-lg rounded-2xl shadow-sm border-border focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                  >
                    <option value="IDR">IDR - Indonesian Rupiah</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="SGD">SGD - Singapore Dollar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-xs font-black mb-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {profile?.language === 'id' ? 'Bahasa' : 'Language'}
                  </label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-border shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleLanguage('id')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        profile?.language === 'id' 
                          ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Indonesia
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLanguage('en')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        profile?.language === 'en' 
                          ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-black mb-2 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {profile?.language === 'id' ? 'Tema' : 'Theme'}
                  </label>
                  <div className="flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-border shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleTheme('light')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        profile?.theme === 'light' 
                          ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleTheme('dark')}
                      className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        profile?.theme === 'dark' 
                          ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-3 py-5 shadow-xl shadow-primary/20 rounded-2xl"
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
              <span className="font-black text-lg tracking-tight">{saving ? 'Saving...' : (profile?.language === 'id' ? 'Simpan Perubahan' : 'Save Changes')}</span>
            </button>
          </form>

          <div className="glass-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-secondary/20 rounded-2xl text-secondary">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold">{profile?.language === 'id' ? 'Keamanan' : 'Security'}</h3>
            </div>
            <button className="text-white/60 hover:text-white font-medium flex items-center gap-2 transition-colors">
              {profile?.language === 'id' ? 'Ubah Kata Sandi' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Bell size={20} className="text-accent" />
              {profile?.language === 'id' ? 'Notifikasi' : 'Notifications'}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{profile?.language === 'id' ? 'Pengingat Harian' : 'Daily Reminders'}</span>
                <div className="w-10 h-5 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{profile?.language === 'id' ? 'Peringatan Anggaran' : 'Budget Alerts'}</span>
                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Smartphone size={20} className="text-primary" />
              App Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDark ? 'text-white/40' : 'text-slate-400'}>Version</span>
                <span className="font-bold">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-white/40' : 'text-slate-400'}>Build</span>
                <span className="font-bold">2026.04.01</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
