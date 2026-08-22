import React, { useState, useEffect } from 'react';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Languages,
  Wifi,
  WifiOff,
  Stethoscope,
  Activity,
  HeartPulse
} from 'lucide-react';
import { User, Notification, SupportedLanguage } from '../types';
import { authService } from '../services/authService';
import { dbService } from '../services/dbService';
import { isMockMode } from '../services/firebase';
import { useLanguage } from '../services/i18n';

interface NavbarProps {
  user: User | null;
  currentPage: string;
  setCurrentPage: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, currentPage, setCurrentPage }) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const list = await dbService.getNotifications(user.id);
        setNotifications(list);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setCurrentPage('landing');
    } catch (err) {
      alert('Error logging out: ' + err);
    }
  };

  const handleMarkRead = async (notifId: string) => {
    try {
      await dbService.markNotificationRead(notifId);
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage('landing')}
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer text-left"
            >
              <div className="h-10 w-10 bg-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-100">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-slate-800 tracking-tight block leading-none">
                  RuralCare
                </span>
                <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block mt-0.5">
                  Connect
                </span>
              </div>
            </button>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {user && (
              <>
                {user.role === 'patient' && (
                  <>
                    <button
                      onClick={() => setCurrentPage('patient-dashboard')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === 'patient-dashboard'
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.dashboard}
                    </button>
                    <button
                      onClick={() => setCurrentPage('health-assessment')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        currentPage === 'health-assessment'
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      <Activity className="h-3.5 w-3.5 text-teal-600" />
                      <span>{t.healthAssessment}</span>
                    </button>
                    <button
                      onClick={() => setCurrentPage('specialist-search')}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === 'specialist-search'
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                      }`}
                    >
                      {t.findSpecialist}
                    </button>
                  </>
                )}
                {user.role === 'doctor' && (
                  <button
                    onClick={() => setCurrentPage('doctor-dashboard')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === 'doctor-dashboard'
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.dashboard}
                  </button>
                )}
                {user.role === 'admin' && (
                  <button
                    onClick={() => setCurrentPage('admin-dashboard')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === 'admin-dashboard'
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                    }`}
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
            )}

            {!user && (
              <button
                onClick={() => setCurrentPage('health-assessment')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentPage === 'health-assessment'
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-teal-600" />
                <span>{t.healthAssessment}</span>
              </button>
            )}

            <button
              onClick={() => setCurrentPage('landing')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentPage === 'landing'
                  ? 'bg-teal-50 text-teal-700'
                  : 'text-slate-600 hover:text-teal-600 hover:bg-slate-50'
              }`}
            >
              {t.home} & Guide
            </button>
          </div>

          {/* Right Action Items & Language Selector */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Languages className="h-4 w-4 text-slate-500 ml-1.5" />
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as SupportedLanguage)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none pr-1 cursor-pointer py-1"
                title="Select Language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="mr">मराठी (Marathi)</option>
              </select>
            </div>

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
                    title={t.notifications}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white text-center leading-4 ring-2 ring-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown panel */}
                  {showNotifications && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-2xl shadow-xl bg-white border border-slate-200 py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 font-bold text-xs text-slate-800 flex justify-between items-center">
                        <span>{t.notifications}</span>
                        {unreadCount > 0 && (
                          <span className="bg-red-50 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => handleMarkRead(notif.id)}
                              className={`px-4 py-3 hover:bg-slate-50 cursor-pointer text-left transition-colors ${
                                !notif.read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <p className="text-xs text-slate-700 font-medium leading-snug">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Widget */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="h-8 w-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-semibold capitalize">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title={t.logout}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setCurrentPage('auth')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 shadow-sm shadow-teal-100 transition-all cursor-pointer"
              >
                {t.login} / {t.register}
              </button>
            )}
          </div>

          {/* Mobile menu button & Mobile Language selector */}
          <div className="flex items-center md:hidden gap-2">
            <select
              value={language}
              onChange={e => setLanguage(e.target.value as SupportedLanguage)}
              className="bg-slate-100 text-xs font-bold text-slate-700 p-1.5 rounded-lg border border-slate-200 focus:outline-none"
            >
              <option value="en">EN</option>
              <option value="hi">हिंदी</option>
              <option value="mr">मराठी</option>
            </select>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 px-4 py-3 bg-white space-y-2 shadow-inner text-left">
          {user && (
            <div className="py-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-400 capitalize font-medium">{user.role}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-xl text-xs font-bold hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.logout}
              </button>
            </div>
          )}

          <div className="space-y-1 pt-1 pb-3">
            {user ? (
              <>
                {user.role === 'patient' && (
                  <>
                    <button
                      onClick={() => {
                        setCurrentPage('patient-dashboard');
                        setIsOpen(false);
                      }}
                      className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {t.dashboard}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('health-assessment');
                        setIsOpen(false);
                      }}
                      className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {t.healthAssessment}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPage('specialist-search');
                        setIsOpen(false);
                      }}
                      className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {t.findSpecialist}
                    </button>
                  </>
                )}
                {user.role === 'doctor' && (
                  <button
                    onClick={() => {
                      setCurrentPage('doctor-dashboard');
                      setIsOpen(false);
                    }}
                    className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  >
                    {t.dashboard}
                  </button>
                )}
                {user.role === 'admin' && (
                  <button
                    onClick={() => {
                      setCurrentPage('admin-dashboard');
                      setIsOpen(false);
                    }}
                    className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                  >
                    Admin Dashboard
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentPage('health-assessment');
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                >
                  {t.healthAssessment}
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('auth');
                    setIsOpen(false);
                  }}
                  className="w-full block text-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
                >
                  {t.login} / {t.register}
                </button>
              </>
            )}
            <button
              onClick={() => {
                setCurrentPage('landing');
                setIsOpen(false);
              }}
              className="w-full text-left block px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {t.home} & Guide
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
