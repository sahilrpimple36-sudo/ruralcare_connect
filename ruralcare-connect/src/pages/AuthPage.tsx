import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Phone, MapPin, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { useLanguage } from '../services/i18n';

interface AuthPageProps {
  setCurrentPage: (page: string, params?: any) => void;
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ setCurrentPage, onAuthSuccess }) => {
  const { t } = useLanguage();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Patient Location states (manual entry)
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('Maharashtra');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isReset) {
        await authService.resetPassword(email);
        setMessage('A password reset link has been sent to your email.');
        setLoading(false);
        setIsReset(false);
        setIsLogin(true);
        return;
      }

      if (isLogin) {
        await authService.signIn(email, password);
        onAuthSuccess();
      } else {
        if (!name || !phone) {
          throw new Error('Name and Phone number are required.');
        }
        await authService.signUp(
          email,
          password,
          name,
          role as 'patient' | 'doctor',
          phone,
          role === 'patient' ? village : undefined,
          role === 'patient' ? district : undefined,
          role === 'patient' ? state : undefined
        );
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo1234');
    setIsLogin(true);
  };

  return (
    <div className="bg-slate-50 min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-left relative overflow-hidden space-y-6">
        
        <div>
          <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full mb-3 border border-teal-100 uppercase">
            <Sparkles className="h-3 w-3" />
            <span>RuralCare Connect Access</span>
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {isReset ? 'Reset Password' : isLogin ? t.signInTitle : t.registerTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isReset
              ? 'Enter your email to receive a password reset link'
              : isLogin
              ? 'Sign in to access your consultations, medical reports, and referrals'
              : 'Register to connect with verified specialist physicians'}
          </p>
        </div>

        {/* Quick Fill Demo Credentials Bar */}
        {isLogin && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
              {t.quickFill}
            </span>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleQuickFill('ramesh@demo.com')}
                className="py-1 px-2.5 bg-white hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all"
              >
                Patient: Ramesh
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('doc-1@demo.com')}
                className="py-1 px-2.5 bg-white hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all"
              >
                Doctor: Dr. Priya
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@demo.com')}
                className="py-1 px-2.5 bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer transition-all"
              >
                Admin Panel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector for registration */}
          {!isLogin && !isReset && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.roleLabel}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'patient'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.iAmPatient}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    role === 'doctor'
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.iAmDoctor}
                </button>
              </div>
            </div>
          )}

          {/* Name Field */}
          {!isLogin && !isReset && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.fullNameLabel}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sawant"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Phone Field */}
          {!isLogin && !isReset && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.phoneLabel}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{t.emailLabel}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50"
              />
            </div>
          </div>

          {/* Password Field */}
          {!isReset && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Patient Location Manual Panel */}
          {!isLogin && !isReset && role === 'patient' && (
            <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-700">{t.villageDistrictLabel}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Village / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Kasba"
                    value={village}
                    onChange={e => setVillage(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">{t.city} / {t.district}</label>
                  <input
                    type="text"
                    placeholder="e.g. Satara"
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-xl text-xs font-extrabold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-100 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? 'Processing...' : isReset ? 'Send Reset Link' : isLogin ? t.login : t.register}
          </button>
        </form>

        {/* Auth Subtext toggle options */}
        <div className="pt-2 border-t border-slate-100 flex flex-col items-center gap-2 text-xs">
          {isLogin ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsReset(false);
                  setIsLogin(false);
                  setError('');
                  setMessage('');
                }}
                className="text-teal-600 hover:text-teal-700 font-bold focus:outline-none cursor-pointer"
              >
                Need an account? Register here
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReset(true);
                  setError('');
                  setMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsReset(false);
                setIsLogin(true);
                setError('');
                setMessage('');
              }}
              className="text-teal-600 hover:text-teal-700 font-bold focus:outline-none cursor-pointer"
            >
              Already have an account? Sign in
            </button>
          )}

          {isReset && (
            <button
              type="button"
              onClick={() => {
                setIsReset(false);
                setIsLogin(true);
                setError('');
                setMessage('');
              }}
              className="text-teal-600 hover:text-teal-700 font-bold focus:outline-none cursor-pointer"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
