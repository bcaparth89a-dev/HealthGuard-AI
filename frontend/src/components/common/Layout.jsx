import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Bot, 
  TrendingUp, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldAlert,
  ClipboardList,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Footer } from '../Footer';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: Activity },
    { name: 'New Assessment', to: '/assessment', icon: ClipboardList },
    { name: 'Family Members', to: '/family-members', icon: Users },
    { name: 'Medical Reports', to: '/reports', icon: FileText },
    { name: 'Analytics', to: '/analytics', icon: TrendingUp },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Sidebar Back-drop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <div className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-100 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center px-6 gap-3 border-b border-slate-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-premium">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 className="text-md font-bold text-slate-800 tracking-tight leading-tight">HealthGuard AI</h1>
            <span className="text-[10px] text-brand-600 font-semibold tracking-wider uppercase">Security & Analytics</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-premium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Account / Signout area */}
        <div className="border-t border-slate-50 p-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50/50">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-700">
              <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Guest User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'healthguard.ai'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 transition-colors p-1"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-150/60 bg-white/80 backdrop-blur-md px-6 shadow-sm">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-800 lg:hidden p-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-1.5 tracking-tight leading-tight select-none">
                <span>🛡️</span> HealthGuard AI
              </span>
              <span className="text-[9px] text-slate-400 font-bold leading-none tracking-normal">
                AI Powered Family Healthcare
              </span>
            </div>
          </div>

          {/* Center: Welcome Info (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Welcome back</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                document.documentElement.classList.toggle('dark');
              }}
              className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition-colors border border-slate-200/40 bg-slate-50/50"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={16} className="text-amber-500 animate-spin-slow" /> : <Moon size={16} />}
            </motion.button>

          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl flex flex-col min-h-[calc(100vh-8rem)]">
            <div className="flex-grow">
              <Outlet />
            </div>
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
