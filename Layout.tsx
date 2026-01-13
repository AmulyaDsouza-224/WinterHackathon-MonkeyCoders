import React, { useState } from 'react';
import NotificationBell from './NotificationBell';
import { User, UserRole } from '../types';
import { Icons } from '../constants';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  activePage,
  onNavigate,
  darkMode,
  toggleDarkMode,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Define navigation items based on role
  const getNavItems = () => {
    if (!user) return [];

    const common = [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    ];

    switch (user.role) {
      case UserRole.PATIENT:
        return [
          { id: 'appointments', label: 'Appointments', icon: Icons.Calendar },
          { id: 'records', label: 'Medical Records', icon: Icons.FileText },
          { id: 'billing', label: 'Billing', icon: Icons.CreditCard },
          ...common,
        ];
      case UserRole.DOCTOR:
        return [
          ...common,
          { id: 'appointments', label: 'Appointments', icon: Icons.Calendar },
          { id: 'patients', label: 'My Patients', icon: Icons.Users },
        ];
      case UserRole.ADMIN:
        return [
          ...common,
          { id: 'users', label: 'User Management', icon: Icons.Users },
          { id: 'inventory', label: 'Pharmacy Ledger', icon: Icons.FileText }, // Using FileText as proxy for inventory/list
          { id: 'settings', label: 'System Settings', icon: Icons.Settings },
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 fixed h-full z-30 border-r frost-glass ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg snow-glow">
            <span className="font-bold text-xl">M</span>
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600">
              MonkeyCoders
            </h1>
            <p className="text-xs text-slate-500 font-medium">HMS Arctic</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${activePage === item.id
                  ? 'bg-sky-500/10 text-sky-500 shadow-sm border border-sky-500/20'
                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
            >
              <item.icon />
              <span className="font-medium">{item.label}</span>
              {activePage === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
              )}
            </button>
          ))}
        </nav>


      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full z-40 px-4 py-3 frost-glass border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-lg">
            <span className="font-bold">M</span>
          </div>
          <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600">MonkeyCoders</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-500">
          <Icons.Menu />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-slate-900 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activePage === item.id
                    ? 'bg-sky-500/10 text-sky-500'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <item.icon />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
              <button onClick={toggleDarkMode} className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500">
                {darkMode ? <span>Light Mode</span> : <span>Dark Mode</span>}
              </button>
              <button onClick={onLogout} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500">
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 md:ml-64 relative z-0`}>
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-end px-8 py-4 sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <div className="relative">
              {user && <NotificationBell userId={user.id} />}
            </div>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              )}
            </button>

            {/* User Info - Clickable Profile */}
            <div
              onClick={() => onNavigate('profile')}
              className="flex items-center space-x-3 pl-2 cursor-pointer group"
            >
              <div className="text-right hidden lg:block transition-opacity group-hover:opacity-80">
                <p className="text-sm font-bold text-slate-700 dark:text-white leading-none">{user?.name}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 overflow-hidden ring-2 ring-transparent group-hover:ring-sky-400 transition-all">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  user?.name?.charAt(0)
                )}
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Sign Out"
            >
              <Icons.LogOut />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
