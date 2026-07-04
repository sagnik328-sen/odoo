import { useAuth } from '../context/AuthContext';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import { LogOut, User, Activity, Menu, X, Settings, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Role Theme Color Indicators
  const getRoleTheme = (role) => {
    switch (role) {
      case 'admin':
        return {
          border: 'border-purple-500',
          text: 'text-purple-600',
          bg: 'bg-purple-50 text-purple-700',
          badge: 'Administrator'
        };
      case 'hr':
        return {
          border: 'border-emerald-500',
          text: 'text-emerald-600',
          bg: 'bg-emerald-50 text-emerald-700',
          badge: 'HR Operations'
        };
      default:
        return {
          border: 'border-indigo-500',
          text: 'text-indigo-600',
          bg: 'bg-indigo-50 text-indigo-700',
          badge: 'Employee Portal'
        };
    }
  };

  const theme = getRoleTheme(user?.role);

  const renderDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'hr':
        return <HRDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans antialiased text-slate-800">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-650 to-teal-550 text-white shadow-md shadow-indigo-200">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight block">PeopleFlow</span>
                <span className="text-[10px] text-slate-400 block -mt-1 font-semibold uppercase tracking-wider">HRMS</span>
              </div>
            </div>

            {/* Desktop User Info & Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/leave" className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50">Leave & Time Off</Link>
              <Link to="/settings" className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 px-3 py-2 text-sm font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">Settings</Link>
              
              {/* Dark Mode toggle button */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
              </button>

              <div className="flex items-center gap-3 pr-3 border-r border-slate-100 dark:border-slate-800">
                <div className="text-right">
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-150">{user?.full_name}</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 mt-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.bg}`}>
                    {theme.badge}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                  {user?.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-650 dark:text-slate-350 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-red-650 active:scale-98"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-xl p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 md:hidden space-y-4 animate-in slide-in-from-top-5 duration-200">
            <div className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-900">
              <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-350">
                {user?.full_name?.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <span className="block text-sm font-bold text-slate-900 dark:text-slate-150">{user?.full_name}</span>
                <span className="block text-xs text-slate-500 truncate max-w-[200px]">{user?.email}</span>
                <span className={`inline-block rounded-full px-2 py-0.5 mt-1 text-[9px] font-bold uppercase tracking-wider ${theme.bg}`}>
                  {theme.badge}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 py-3 text-sm font-bold transition active:scale-95"
            >
              <LogOut className="h-4 w-4" /> Logout from Session
            </button>
            <Link to="/leave" className="flex w-full items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 py-3 text-sm font-bold text-emerald-700 dark:text-emerald-400">Leave & Time Off</Link>
            <Link to="/settings" className="flex w-full items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-400">Settings</Link>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 py-3 text-sm font-bold transition"
            >
              {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400 font-medium">
            PeopleFlow HRMS Suite v1.0.0 &bull; Secure Session Active for <strong className="text-slate-500 capitalize">{user?.role}</strong> &bull; &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
