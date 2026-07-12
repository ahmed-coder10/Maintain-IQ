import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Activity, ShieldCheck, Hammer, KeyRound, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const { login, resetPassword } = useAuth();
  const { showToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome to MaintainIQ!', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      showToast('Invalid credentials. Try the demo buttons below.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { showToast('Enter your email first.', 'warning'); return; }
    try {
      await resetPassword(email);
      showToast('Password reset link sent.', 'success');
    } catch { showToast('Failed to send reset link.', 'error'); }
  };

  const handleQuickLogin = (role) => {
    if (role === 'admin') { setEmail('admin@maintainiq.com'); setPassword('admin123'); }
    else { setEmail('tech@maintainiq.com'); setPassword('tech123'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-950 relative overflow-hidden transition-colors duration-500">
      {/* Animated gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/15 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDuration:'4s'}}></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/15 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" style={{animationDuration:'6s'}}></div>
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Theme toggle */}
      <button onClick={toggleTheme} className="fixed top-5 right-5 z-50 p-2.5 rounded-xl glass-panel hover:scale-105 transition-transform text-slate-600 dark:text-slate-300">
        {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className="max-w-md w-full z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-2xl shadow-indigo-600/30 mb-5">
            <Activity className="h-9 w-9" />
          </div>
          <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tight">MaintainIQ</h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">AI-Powered QR Asset & Maintenance Platform</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-8 shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                placeholder="you@company.com" required />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">Password</label>
                <button type="button" onClick={handleForgotPassword} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Forgot?</button>
              </div>
              <div className="relative mt-1.5">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-medium"
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/35 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98]">
              {loading ? <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><KeyRound className="h-5 w-5" /><span>Sign In</span></>}
            </button>
          </form>

          {/* Quick Demo */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/40">
            <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center mb-4">Quick Demo Access</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-white/40 dark:bg-slate-800/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all">
                <ShieldCheck className="h-4 w-4 text-indigo-500" /> Administrator
              </button>
              <button onClick={() => handleQuickLogin('tech')}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/40 bg-white/40 dark:bg-slate-800/30 hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all">
                <Hammer className="h-4 w-4 text-purple-500" /> Technician
              </button>
            </div>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">SMIT Final Hackathon • Track B Firebase/Supabase</p>
      </div>
    </div>
  );
}
