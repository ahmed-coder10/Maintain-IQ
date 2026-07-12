import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center p-8 glass-panel border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 mb-4">
          <FileQuestion className="h-7 w-7" />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-50">Page Not Found</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you are looking for does not exist, or you do not have permission to view it.
        </p>

        <div className="mt-6">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/10"
          >
            <Home className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
