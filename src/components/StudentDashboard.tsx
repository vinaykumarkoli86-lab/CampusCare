import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Clock,
  EyeOff,
  FileText,
  Flame,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Search,
} from 'lucide-react';
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  type Complaint,
  type NotificationItem,
  type OverviewStats,
  type UserPublic,
} from '../types';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/format';
import { CampusHeatmap } from './CampusHeatmap';
import { ComplaintDetailDrawer } from './ComplaintDetailDrawer';
import { PriorityIndicator, StatusIndicator } from './StatusText';
import { SubmitComplaintModal } from './SubmitComplaintModal';

interface StudentDashboardProps {
  user: UserPublic;
  onLogout: () => void;
  onGoHome: () => void;
}

type StudentTab = 'complaints' | 'notifications' | 'heatmap';

export function StudentDashboard({ user, onLogout, onGoHome }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<StudentTab>('complaints');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cmpRes, ntfRes, ovRes] = await Promise.all([
        api.listComplaints(),
        api.listNotifications(),
        api.getPublicOverview(),
      ]);
      setComplaints(cmpRes.complaints);
      setNotifications(ntfRes.notifications);
      setOverview(ovRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student workspace.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          c.complaintCode.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [complaints, statusFilter, priorityFilter, search]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const active = complaints.filter(
      (c) => c.status === 'Pending' || c.status === 'Under Review' || c.status === 'In Progress'
    ).length;
    const resolved = complaints.filter((c) => c.status === 'Resolved').length;
    const urgent = complaints.filter(
      (c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Rejected'
    ).length;
    return { total, active, resolved, urgent };
  }, [complaints]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // Ignore transient error
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignore transient error
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="w-full lg:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#070d1e] flex flex-col justify-between">
        <div>
          <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onGoHome}
              className="font-display text-lg font-bold tracking-tight text-white hover:text-sky-300 transition-colors"
            >
              CAMPUSCARE
            </button>
            <span className="text-xs text-sky-400 font-medium">Student</span>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'complaints'
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>My Complaints</span>
              <span className="ml-auto font-mono-data tabular-nums text-xs text-slate-400">
                {complaints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'notifications'
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Bell className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Updates</span>
              {unreadCount > 0 && (
                <span className="ml-auto font-mono-data tabular-nums text-xs text-sky-300 font-semibold">
                  {unreadCount} new
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'heatmap'
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Campus Heatmap</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 transition-colors whitespace-nowrap shrink-0"
            >
              <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Public Homepage</span>
            </button>
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="hidden lg:block p-4 border-t border-slate-800/80 space-y-3">
          <div>
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {user.studentIdNumber || user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/70 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Workspace Bar */}
        <header className="px-6 py-4 border-b border-slate-800/80 bg-[#060b18]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Student Portal</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">
              {activeTab === 'complaints'
                ? 'My Complaints'
                : activeTab === 'notifications'
                ? 'Status Notifications'
                : 'Campus Issue Heatmap'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="lg:hidden px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300"
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-300 hover:to-cyan-300 text-slate-950 font-semibold text-xs transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Report Issue</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Student KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-surface rounded-xl p-4 sm:p-5">
              <p className="text-xs text-slate-400">Total Submitted</p>
              <p className="text-2xl font-bold text-white font-mono-data tabular-nums mt-1.5">
                {stats.total}
              </p>
            </div>
            <div className="glass-surface rounded-xl p-4 sm:p-5">
              <p className="text-xs text-slate-400">Active In Progress</p>
              <p className="text-2xl font-bold text-sky-300 font-mono-data tabular-nums mt-1.5">
                {stats.active}
              </p>
            </div>
            <div className="glass-surface rounded-xl p-4 sm:p-5">
              <p className="text-xs text-slate-400">Resolved</p>
              <p className="text-2xl font-bold text-emerald-300 font-mono-data tabular-nums mt-1.5">
                {stats.resolved}
              </p>
            </div>
            <div className="glass-surface rounded-xl p-4 sm:p-5">
              <p className="text-xs text-slate-400">Unread Updates</p>
              <p className="text-2xl font-bold text-violet-300 font-mono-data tabular-nums mt-1.5">
                {unreadCount}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200 flex items-center justify-between gap-4">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchData}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {activeTab === 'complaints' && (
            <section className="space-y-4">
              {/* Filter Toolbar */}
              <div className="glass-surface rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search
                    className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by ticket ID, title, or building..."
                    className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-slate-800 overflow-x-auto">
                    {['All', ...COMPLAINT_STATUSES].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          statusFilter === st
                            ? 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    aria-label="Filter by priority"
                    className="rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  >
                    <option value="All">All Priorities</option>
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Complaints List */}
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-xl bg-slate-900/60 border border-slate-800/70 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredComplaints.length === 0 ? (
                <div className="glass-surface rounded-xl p-12 text-center space-y-3">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto" aria-hidden="true" />
                  <h3 className="text-base font-semibold text-white">No complaints found</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {complaints.length === 0
                      ? 'You have not submitted any campus complaints yet. Report an issue to track it in real time.'
                      : 'No complaints match your active search or status filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (complaints.length === 0) {
                        setSubmitOpen(true);
                      } else {
                        setSearch('');
                        setStatusFilter('All');
                        setPriorityFilter('All');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    {complaints.length === 0 ? 'Submit First Complaint' : 'Reset Filters'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredComplaints.map((c) => {
                    const isUrgentOpen =
                      c.priority === 'Urgent' &&
                      c.status !== 'Resolved' &&
                      c.status !== 'Rejected';

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedComplaint(c)}
                        className={`w-full text-left glass-surface rounded-xl p-5 transition-all hover:border-sky-500/40 ${
                          isUrgentOpen ? 'border-rose-500/35 bg-rose-950/10' : ''
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono-data">
                              <span className="text-sky-300 font-semibold">{c.complaintCode}</span>
                              <span aria-hidden="true">·</span>
                              <span>{c.category}</span>
                              <span aria-hidden="true">·</span>
                              <span>{c.location}</span>
                              {c.isAnonymous && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="inline-flex items-center gap-1 text-violet-300">
                                    <EyeOff className="w-3 h-3" aria-hidden="true" />
                                    Anonymous
                                  </span>
                                </>
                              )}
                            </div>

                            <h3 className="text-base font-semibold text-white truncate pr-4">
                              {c.title}
                            </h3>

                            <p className="text-xs text-slate-400 line-clamp-1">
                              {c.adminComment
                                ? `Admin update: ${c.adminComment}`
                                : c.description}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                            <StatusIndicator status={c.status} />
                            <div className="flex items-center gap-3">
                              {isUrgentOpen ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-300">
                                  <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                                  Urgent
                                </span>
                              ) : (
                                <PriorityIndicator priority={c.priority} />
                              )}
                              <span className="text-xs text-slate-500 font-mono-data">
                                {formatRelativeTime(c.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="glass-surface rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-base font-semibold text-white">Status Notifications</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time alerts when administrators review, assign, or resolve your tickets
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-sky-300 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  No status notifications yet. Updates appear here when your complaints progress.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        !n.isRead ? 'opacity-100' : 'opacity-70'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-mono-data text-sky-300 font-semibold">
                            {n.complaintCode}
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <StatusIndicator status={n.status} />
                          {!n.isRead && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <span className="text-sky-400 font-medium">Unread</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white">{n.title}</p>
                        <p className="text-xs text-slate-300">{n.message}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-mono-data">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(n.id)}
                            className="px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs text-sky-200 transition-colors"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === 'heatmap' && overview && (
            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-white">Live Campus Issue Heatmap</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Anonymized aggregate complaint density across campus buildings
                </p>
              </div>
              <CampusHeatmap zones={overview.heatmap} />
            </section>
          )}
        </div>
      </main>

      <SubmitComplaintModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onCreated={(created) => {
          setComplaints((prev) => [created, ...prev]);
          fetchData();
        }}
      />

      <ComplaintDetailDrawer
        complaint={selectedComplaint}
        isAdmin={false}
        onClose={() => setSelectedComplaint(null)}
        onUpdated={(updated) => {
          setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedComplaint(updated);
        }}
      />
    </div>
  );
}
