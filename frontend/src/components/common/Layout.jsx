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
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: Activity },
    { name: 'Symptom Checker', to: '/symptoms', icon: Bot },
    { name: 'AI Risk Predictor', to: '/predict', icon: TrendingUp },
    { name: 'Medical Records', to: '/records', icon: FileText },
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
        <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-white px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-800 lg:hidden p-1"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            {/* HealthStatus Banner */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Gemini API Connected
            </div>
          </div>
        </header>

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
