import { useState } from 'react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import type { UserPublic } from '../types';
import { api } from '../lib/api';

interface AdminLoginPageProps {
  currentUser: UserPublic | null;
  onSuccess: (adminUser: UserPublic) => void;
  onBackHome: () => void;
  onGoToStudentDashboard: () => void;
}

export function AdminLoginPage({
  currentUser,
  onSuccess,
  onBackHome,
  onGoToStudentDashboard,
}: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid administrator email address.');
      return;
    }
    if (password.length < 6) {
      setError('Please enter your administrator password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin(email.trim(), password);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col campus-grid-bg">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#050914]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={onBackHome}
            className="font-display text-lg font-bold tracking-tight text-white hover:text-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            CAMPUSCARE
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/70 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Homepage</span>
          </button>
        </div>
      </header>

      {/* Main Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute w-[540px] h-[340px] rounded-full bg-gradient-to-tr from-violet-500/12 via-sky-500/10 to-cyan-500/10 blur-3xl"
        />

        <div className="relative z-10 w-full max-w-md glass-surface-elevated rounded-2xl p-7 sm:p-8 space-y-6">
          <div className="space-y-2 border-b border-slate-800/80 pb-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-300">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Restricted Administrator Portal</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">
              Admin Sign In
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Authorized CAMPUSCARE operations personnel only. Student accounts do not have permission to access administrative triage tools.
            </p>
          </div>

          {currentUser && currentUser.role === 'student' && (
            <div className="flex items-start justify-between gap-3 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
                <p className="text-amber-100/90 leading-relaxed">
                  Currently signed in as student <span className="font-mono-data">{currentUser.email}</span>. Enter administrator credentials below to open the Admin Dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToStudentDashboard}
                className="text-[11px] font-medium text-amber-200 underline underline-offset-2 shrink-0"
              >
                Student Portal
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="admin-login-email"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Administrator Email
                </label>
                <input
                  id="admin-login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter administrator email"
                  className="w-full rounded-lg bg-slate-900/95 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="admin-login-password"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrator password"
                    className="w-full rounded-lg bg-slate-900/95 border border-slate-700/80 px-3.5 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-400"
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
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-violet-400 to-sky-400 hover:from-violet-300 hover:to-sky-300 disabled:opacity-50 text-slate-950 font-semibold text-sm transition-all"
              >
                <Lock className="w-4 h-4" aria-hidden="true" />
                <span>{loading ? 'Verifying Role...' : 'Sign In to Admin Dashboard'}</span>
              </button>
            </form>
        </div>
      </main>
    </div>
  );
}
