import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  Wrench, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Shield, 
  Hammer, 
  Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['admin', 'technician']
    },
    {
      name: 'Asset Management',
      path: '/assets',
      icon: <Wrench className="h-5 w-5" />,
      roles: ['admin']
    },
    {
      name: 'Technician Panel',
      path: '/technician',
      icon: <Hammer className="h-5 w-5" />,
      roles: ['admin', 'technician'] // Admins can view as well for management
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['admin']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || (currentUser && item.roles.includes(currentUser.role))
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            MaintainIQ
          </span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/80 dark:border-slate-800/80 backdrop-blur-xl z-30">
        <SidebarContent 
          filteredNavItems={filteredNavItems} 
          currentUser={currentUser} 
          location={location} 
          isDark={isDark}
          toggleTheme={toggleTheme}
          handleLogout={handleLogout} 
        />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 md:hidden flex flex-col"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent 
                filteredNavItems={filteredNavItems} 
                currentUser={currentUser} 
                location={location} 
                isDark={isDark}
                toggleTheme={toggleTheme}
                handleLogout={handleLogout}
                onLinkClick={() => setSidebarOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <main className="flex-grow p-6 pt-20 md:pt-6 max-w-7xl w-full mx-auto pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ 
  filteredNavItems, 
  currentUser, 
  location, 
  isDark, 
  toggleTheme, 
  handleLogout,
  onLinkClick 
}) => {
  return (
    <div className="flex flex-col h-full p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-500/10">
          <Activity className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            MaintainIQ
          </span>
          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Asset Platform
          </span>
        </div>
      </div>

      {/* User Status Profile */}
      {currentUser && (
        <div className="mb-6 p-3 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-500/20">
            {currentUser.displayName ? currentUser.displayName.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
              {currentUser.displayName}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="h-3 w-3 text-indigo-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize font-medium">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all-300 ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          {isDark ? (
            <>
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-slate-600" />
              <span>Dark Mode</span>
            </>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
