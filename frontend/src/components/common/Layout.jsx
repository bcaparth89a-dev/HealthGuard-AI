import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  User,
  ShieldAlert,
  ClipboardList,
  Users,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Footer } from '../Footer';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: Activity },
    { name: 'New Assessment', to: '/assessment', icon: ClipboardList },
    { name: 'Family Members', to: '/family-members', icon: Users },
    { name: 'Medical Reports', to: '/reports', icon: FileText },
    { name: 'Analytics', to: '/analytics', icon: TrendingUp },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleSidebarCollapse = () => {
    const nextCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(nextCollapsed);
    localStorage.setItem('sidebar_collapsed', String(nextCollapsed));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200 text-slate-800 dark:text-slate-100">
      {/* Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Collapsible Sidebar Shell */}
      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/60 transition-all duration-300 lg:translate-x-0 lg:static lg:z-auto ${
        sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72 lg:translate-x-0'
      } ${
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
      }`}>
        
        {/* Sidebar Header Brand Area */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-50 dark:border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-premium">
              <ShieldAlert size={22} />
            </div>
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col"
              >
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight whitespace-nowrap">HealthGuard AI</h1>
                <span className="text-[9px] text-brand-600 dark:text-brand-400 font-bold tracking-wider uppercase whitespace-nowrap">Clinical EMR Platform</span>
              </motion.div>
            )}
          </div>
          
          {/* Collapse Icon Button for Desktop */}
          <button
            onClick={toggleSidebarCollapse}
            className="hidden lg:flex p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Navigation Sidebar Links */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-premium'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-100'
                }`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <item.icon size={18} className="shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                
                {/* Tooltip for collapsed view */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 whitespace-nowrap pointer-events-none shadow-md">
                    {item.name}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapsible User Profile Area */}
        <div className="border-t border-slate-50 dark:border-slate-700/50 p-4 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-slate-700 text-brand-700 dark:text-brand-300 font-bold text-sm uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Guest User'}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-450 truncate">{user?.email || 'healthguard.ai'}</p>
              </motion.div>
            )}
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Universal Top Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 shadow-sm">
          
          {/* Header Left: Drawer Trigger for Mobile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 lg:hidden p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 tracking-tight leading-tight select-none">
                🛡️ HealthGuard AI
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-none tracking-normal">
                Clinical Diagnostics Dashboard
              </span>
            </div>
          </div>

          {/* Header Center: Calendar Date Info (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Hospital Portal</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-colors border border-slate-200/40 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={16} className="text-amber-400 animate-pulse" /> : <Moon size={16} />}
            </motion.button>
          </div>
        </header>

        {/* Scrollable Main Viewport Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-6 sm:py-8 lg:px-8 custom-scrollbar">
          <div className="mx-auto max-w-7xl flex flex-col min-h-full">
            <div className="flex-grow pb-8">
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
