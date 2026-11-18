import { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, UserPlus, X } from 'lucide-react';
import type { UserPublic } from '../types';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserPublic) => void;
}

export function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({
              name,
              email,
              password,
              studentIdNumber,
              department,
            });
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, demoPassword);
      onSuccess(res.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Account Access"
    >
      <div className="w-full max-w-md glass-surface-elevated rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {mode === 'login' ? 'Sign in to CAMPUSCARE' : 'Create Student Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {mode === 'login'
                ? 'Access your personalized complaint dashboard'
                : 'Register with your campus email to report and track issues'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Segmented Mode Toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student Register
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Priya Verma"
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-roll" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Student Roll ID
                    </label>
                    <input
                      id="auth-roll"
                      type="text"
                      value={studentIdNumber}
                      onChange={(e) => setStudentIdNumber(e.target.value)}
                      placeholder="CS2025-084"
                      className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-dept" className="block text-xs font-medium text-slate-300 mb-1.5">
                      Department
                    </label>
                    <input
                      id="auth-dept"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Campus Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campus.edu"
                className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                required
              />
            </div>

            <div>
              <label htmlFor="auth-pass" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all"
            >
              {mode === 'login' ? (
                <Lock className="w-4 h-4" aria-hidden="true" />
              ) : (
                <UserPlus className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'login'
                  ? 'Sign In'
                  : 'Create Student Account'}
              </span>
            </button>
          </form>

          {/* Student Demo Account for Instant Verification */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <p className="text-xs text-slate-400">Quick Student Demo Access</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('aarav.sharma@campus.edu', 'student123')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors text-left flex items-center justify-between gap-3"
            >
              <div>
                <span className="block text-sky-300 font-semibold">Demo Student Account</span>
                <span className="block text-[11px] text-slate-400">
                  aarav.sharma@campus.edu
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono-data">Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
