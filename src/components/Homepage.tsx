import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  EyeOff,
  Flame,
  Layers,
  MapPin,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import type { OverviewStats, UserPublic } from '../types';
import { CampusHeatmap } from './CampusHeatmap';
import { AnalyticsPanel } from './AnalyticsPanel';

interface HomepageProps {
  user: UserPublic | null;
  overview: OverviewStats | null;
  loadingOverview: boolean;
  onGetStarted: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenAdminLogin: () => void;
  onEnterDashboard: () => void;
  onQuickStudentDemo: () => void;
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const duration = 650;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = value * eased;
      setDisplay(Number.isInteger(value) ? Math.round(current) : Number(current.toFixed(1)));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className="font-mono-data tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function Homepage({
  user,
  overview,
  loadingOverview,
  onGetStarted,
  onOpenAuth,
  onOpenAdminLogin,
  onEnterDashboard,
  onQuickStudentDemo,
}: HomepageProps) {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [atriumImgFailed, setAtriumImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#050914]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <a
            href="#overview"
            className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            CAMPUSCARE
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="flex items-center gap-5 md:gap-7 text-sm font-medium text-slate-300">
            <a
              href="#overview"
              className="hidden md:inline-block hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-sky-400"
            >
              Overview
            </a>
            <a
              href="#how-it-works"
              className="hidden md:inline-block hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-sky-400"
            >
              How It Works
            </a>
            <a
              href="#capabilities"
              className="hidden lg:inline-block hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-sky-400"
            >
              Capabilities
            </a>
            <a
              href="#heatmap"
              className="hidden md:inline-block hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-sky-400"
            >
              Campus Map
            </a>
            {user?.role === 'admin' ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="text-violet-300 hover:text-violet-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
              >
                Admin Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="text-violet-300 hover:text-violet-200 transition-colors whitespace-nowrap shrink-0 py-1 border-b border-transparent hover:border-violet-400"
              >
                Admin Login
              </button>
            )}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            {user ? (
              <button
                type="button"
                onClick={onEnterDashboard}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-semibold text-xs transition-all whitespace-nowrap shrink-0"
              >
                Open Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={onGetStarted}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-semibold text-xs transition-all whitespace-nowrap shrink-0"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="overview" className="relative overflow-hidden border-b border-slate-800/70">
          {/* Subtle ambient radial gradient */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[920px] h-[520px] rounded-full bg-gradient-to-tr from-sky-500/14 via-cyan-400/10 to-violet-500/14 blur-3xl"
          />

          <div className="max-w-7xl mx-auto px-6 py-14 lg:py-20 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              {/* Hero Copy */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 flex flex-col justify-center space-y-6"
              >
                <p className="text-xs font-medium text-sky-300 tracking-wide">
                  Every Voice Matters. Every Issue Counts.
                </p>

                <h1
                  style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
                  className="font-display font-bold tracking-tight text-white leading-[1.08]"
                >
                  Your Campus. Your Voice. Our Responsibility.
                </h1>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                  A smarter way to report, track and resolve campus problems. Built for students and campus operations teams to eliminate maintenance blind spots with transparent accountability.
                </p>

                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={user ? onEnterDashboard : onGetStarted}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-semibold text-sm transition-all whitespace-nowrap shrink-0"
                  >
                    <span>{user ? 'Open My Dashboard' : 'Get Started'}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>

                  <a
                    href="#heatmap"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg glass-surface hover:border-sky-400/40 text-slate-100 font-medium text-sm transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Explore Dashboard</span>
                  </a>
                </div>

                {!user && (
                  <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                    <span>Already registered?</span>
                    <button
                      type="button"
                      onClick={() => onOpenAuth('login')}
                      className="text-sky-300 hover:text-sky-200 underline underline-offset-4 transition-colors"
                    >
                      Student Sign In
                    </button>
                    <button
                      type="button"
                      onClick={onQuickStudentDemo}
                      className="text-slate-300 hover:text-white underline underline-offset-4 transition-colors"
                    >
                      Try Student Demo
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Hero Visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-slate-800/90 bg-[#081024] min-h-[300px] lg:min-h-[420px]"
              >
                {!heroImgFailed ? (
                  <img
                    src="/src/assets/images/hero_campus_command_1794640020453.jpg"
                    alt="Modern university campus quadrangle at twilight"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="w-full h-full campus-grid-bg bg-gradient-to-br from-slate-900 via-[#0a1636] to-[#050914] flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <ShieldCheck className="w-10 h-10 text-sky-400 mx-auto" aria-hidden="true" />
                      <p className="text-sm font-medium text-slate-300">CAMPUSCARE Operations</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050914]/90 via-[#050914]/20 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 glass-surface rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-400">Live Campus Accountability</p>
                    <p className="text-sm font-semibold text-white mt-0.5">
                      Real-time ticket routing across 8 campus sectors
                    </p>
                  </div>
                  <div className="text-right font-mono-data">
                    <p className="text-xs text-slate-400">Avg Turnaround</p>
                    <p className="text-sm font-semibold text-cyan-300 tabular-nums">
                      {overview ? `${overview.avgResolutionHours} hrs` : '—'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Full-Width Animated KPI Strip Below Hero Split */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-surface rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Complaints Logged</span>
                  <Layers className="w-4 h-4 text-sky-400" aria-hidden="true" />
                </div>
                <p className="text-3xl font-bold text-white mt-2">
                  {loadingOverview || !overview ? (
                    '—'
                  ) : (
                    <AnimatedNumber value={overview.totalComplaints} />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">Tracked end-to-end in database</p>
              </div>

              <div className="glass-surface rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Issues Resolved</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                </div>
                <p className="text-3xl font-bold text-emerald-300 mt-2">
                  {loadingOverview || !overview ? (
                    '—'
                  ) : (
                    <AnimatedNumber value={overview.resolvedComplaints} />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {overview ? `${overview.resolutionRate}% completion rate` : 'Calculating...'}
                </p>
              </div>

              <div className="glass-surface rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Avg Resolution Time</span>
                  <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                </div>
                <p className="text-3xl font-bold text-cyan-300 mt-2">
                  {loadingOverview || !overview ? (
                    '—'
                  ) : (
                    <AnimatedNumber value={overview.avgResolutionHours} suffix="h" />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">Verified ticket timestamps</p>
              </div>

              <div className="glass-surface rounded-xl p-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Urgent Escalations</span>
                  <Flame className="w-4 h-4 text-rose-400" aria-hidden="true" />
                </div>
                <p className="text-3xl font-bold text-rose-300 mt-2">
                  {loadingOverview || !overview ? (
                    '—'
                  ) : (
                    <AnimatedNumber value={overview.urgentOpenComplaints} />
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">Prioritized for rapid dispatch</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-16 lg:py-20 border-b border-slate-800/70">
          <div className="max-w-2xl space-y-3 mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              How CAMPUSCARE Works
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Every issue moves from student submission to verified departmental closure with zero lost emails or silent queues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-surface rounded-xl p-6 space-y-3">
              <p className="font-mono-data text-xs font-semibold text-sky-400">01. Report & Verify</p>
              <h3 className="text-lg font-semibold text-white">Submit with Duplicate Check</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Students log issues with building location, priority, optional photo evidence, and anonymous protection. Live duplicate detection highlights similar active tickets immediately.
              </p>
            </div>

            <div className="glass-surface rounded-xl p-6 space-y-3">
              <p className="font-mono-data text-xs font-semibold text-cyan-400">02. Triage & Route</p>
              <h3 className="text-lg font-semibold text-white">Departmental Assignment</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Administrators inspect urgent escalations, assign complaints to Electrical, IT, Facilities, or Security units, and post transparent remediation remarks.
              </p>
            </div>

            <div className="glass-surface rounded-xl p-6 space-y-3">
              <p className="font-mono-data text-xs font-semibold text-violet-400">03. Track & Resolve</p>
              <h3 className="text-lg font-semibold text-white">Audited Closure & Alerts</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Every status change appends to an immutable history timeline, notifies the reporting student, and updates campus heatmaps and resolution SLA metrics.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Showcase Asymmetric Bento Grid */}
        <section id="capabilities" className="max-w-7xl mx-auto px-6 py-16 lg:py-20 border-b border-slate-800/70">
          <div className="max-w-2xl space-y-3 mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Built for Modern Campus Operations
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Spatial intelligence, privacy-preserving reporting, and accountable analytics engineered into one unified workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Marquee Wide Card */}
            <div className="lg:col-span-7 glass-surface rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-12 items-stretch">
              <div className="sm:col-span-6 p-6 flex flex-col justify-between gap-4">
                <div className="space-y-2.5">
                  <MapPin className="w-5 h-5 text-sky-400" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-white">
                    Campus Spatial Issue Heatmap
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Visualize recurring infrastructure bottlenecks and safety hotspots across hostels, lecture halls, and laboratories on an interactive campus blueprint.
                  </p>
                </div>
                <a
                  href="#heatmap"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-300 hover:text-sky-200 transition-colors"
                >
                  <span>Inspect Live Heatmap</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
              <div className="sm:col-span-6 min-h-[220px] bg-slate-950 relative">
                {!atriumImgFailed ? (
                  <img
                    src="/src/assets/images/feature_campus_atrium_1794640020865.jpg"
                    alt="Contemporary university commons atrium"
                    referrerPolicy="no-referrer"
                    onError={() => setAtriumImgFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full campus-grid-bg bg-slate-900" />
                )}
              </div>
            </div>

            {/* Duplicate Detection Card */}
            <div className="lg:col-span-5 glass-surface rounded-2xl p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <SearchCheck className="w-5 h-5 text-amber-400" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-white">
                  Smart Duplicate Detection
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Automatically compares incoming complaint titles, categories, and building locations against open records to prevent redundant maintenance tickets.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs text-slate-300 font-mono-data">
                CC-2026-0102 · Central Library · 78% similarity match
              </div>
            </div>

            {/* Anonymous Submission */}
            <div className="lg:col-span-4 glass-surface rounded-2xl p-6 space-y-2.5">
              <EyeOff className="w-5 h-5 text-violet-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-white">Anonymous Whistleblowing</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Students can file sensitive security or hostel complaints anonymously—masking identity from admins while preserving private status tracking.
              </p>
            </div>

            {/* Urgent Escalation */}
            <div className="lg:col-span-4 glass-surface rounded-2xl p-6 space-y-2.5">
              <Flame className="w-5 h-5 text-rose-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-white">Urgent Safety Prioritization</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Electrical sparks, water leaks, and perimeter lighting failures automatically surface in a dedicated Urgent Triage queue for rapid response.
              </p>
            </div>

            {/* Department Analytics */}
            <div className="lg:col-span-4 glass-surface rounded-2xl p-6 space-y-2.5">
              <BarChart3 className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-white">Department SLA Comparison</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Compare average resolution hours and completion rates across IT Services, Electrical Engineering, Hostel Administration, and Facilities.
              </p>
            </div>
          </div>
        </section>

        {/* Live Interactive Campus Heatmap Explorer */}
        <section id="heatmap" className="max-w-7xl mx-auto px-6 py-16 lg:py-20 border-b border-slate-800/70">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Live Campus Issue Heatmap
              </h2>
              <p className="text-sm text-slate-400">
                Interactive spatial breakdown computed from current database records. Select any building marker to inspect load.
              </p>
            </div>
            {!user && (
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-4 py-2 rounded-lg border border-sky-500/35 bg-sky-500/10 hover:bg-sky-500/20 text-sky-200 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Report an Issue in Your Building
              </button>
            )}
          </div>

          {overview ? (
            <CampusHeatmap zones={overview.heatmap} />
          ) : (
            <div className="h-[380px] rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          )}
        </section>

        {/* Live Department Performance & Resolution Analytics */}
        <section id="analytics" className="max-w-7xl mx-auto px-6 py-16 lg:py-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div className="space-y-2">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Transparent Resolution Analytics
              </h2>
              <p className="text-sm text-slate-400">
                Real-time average resolution duration and departmental performance metrics across campus.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  Go to {user.role === 'admin' ? 'Admin Console' : 'Student Portal'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  Sign In to Manage Tickets
                </button>
              )}
            </div>
          </div>

          {overview ? (
            <AnalyticsPanel stats={overview} />
          ) : (
            <div className="h-[300px] rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          )}
        </section>
      </main>

      {/* Quiet Modern Footer */}
      <footer className="border-t border-slate-800/80 bg-[#040711]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-bold text-white">CAMPUSCARE</p>
            <p className="text-xs text-slate-400 mt-1">
              Every Voice Matters. Every Issue Counts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#overview" className="hover:text-white transition-colors">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#heatmap" className="hover:text-white transition-colors">
              Campus Map
            </a>
            <a href="#analytics" className="hover:text-white transition-colors">
              Analytics
            </a>
          </div>

          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} CAMPUSCARE Smart Campus Systems
          </p>
        </div>
      </footer>
    </div>
  );
}
