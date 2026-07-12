import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { useToast, Card } from '../components/UI';
import { isDemoMode } from '../services/firebase';
import { 
  Settings as SettingsIcon, 
  Building2, 
  User, 
  Key, 
  Database, 
  RefreshCw, 
  Check, 
  Lock,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Settings() {
  const { showToast } = useToast();
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await dbService.getSettings();
        setOrgName(settings.orgName || '');
        setAdminName(settings.adminName || '');
        setGeminiApiKey(settings.geminiApiKey || '');
      } catch (err) {
        showToast('Failed to load settings.', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dbService.updateSettings({
        orgName,
        adminName,
        geminiApiKey
      });
      showToast('Settings saved successfully.', 'success');
    } catch (err) {
      showToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (window.confirm("WARNING: This will wipe all current assets, reported issues, and service logs in Local Storage, restoring the application back to its initial evaluation state. Do you wish to proceed?")) {
      setResetting(true);
      try {
        await dbService.resetDemoData();
        showToast('Database reset successfully. Reloading platform...', 'success');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } catch (error) {
        showToast('Failed to reset database.', 'error');
        setResetting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
        <Card className="animate-pulse h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Configuration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure global organization details, AI credentials, and database emulators.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Building2 className="h-4.5 w-4.5 text-indigo-500" />
            Organization Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Organization Name</label>
              <div className="relative mt-1.5">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="SMIT Facilities Group"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">Administrator Name</label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Super Admin"
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* AI API Key Card */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
              Gemini AI Integration
            </h3>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30 px-2 py-0.5 rounded-full font-semibold">
              Advisory Triage
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Google Gemini API Key
            </label>
            <div className="relative mt-1.5">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Entering your Gemini API Key unlocks live natural language diagnostic suggestions. If left blank, the platform automatically falls back to a smart, keyword-based local triage model.
            </p>
          </div>
        </Card>

        {/* Database Status Card */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
            <Database className="h-4.5 w-4.5 text-indigo-500" />
            Backend Connection Status
          </h3>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isDemoMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {isDemoMode ? 'Local Demo Mode Active' : 'Connected to Google Firebase'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isDemoMode 
                    ? 'All transactions are written locally to browser LocalStorage.' 
                    : 'Active Firestore, Authentication, and Storage triggers.'}
                </p>
              </div>
            </div>
            {isDemoMode && (
              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                PERSISTENT
              </span>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetDemoData}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl text-rose-600 border border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo Database</span>
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 transition-colors"
          >
            {saving ? 'Saving...' : (
              <>
                <Check className="h-4 w-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
