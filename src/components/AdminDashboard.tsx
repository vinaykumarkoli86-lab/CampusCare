import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  EyeOff,
  Flame,
  Home,
  LayoutList,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  CAMPUS_LOCATIONS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  DEPARTMENTS,
  type Complaint,
  type OverviewStats,
  type UserPublic,
} from '../types';
import { api } from '../lib/api';
import { formatRelativeTime } from '../lib/format';
import { AnalyticsPanel } from './AnalyticsPanel';
import { CampusHeatmap } from './CampusHeatmap';
import { ComplaintDetailDrawer } from './ComplaintDetailDrawer';
import { PriorityIndicator, StatusIndicator } from './StatusText';

interface AdminDashboardProps {
  user: UserPublic;
  onLogout: () => void;
  onGoHome: () => void;
}

type AdminTab = 'queue' | 'urgent' | 'heatmap' | 'analytics';

export function AdminDashboard({ user, onLogout, onGoHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [analytics, setAnalytics] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cmpRes, anRes] = await Promise.all([
        api.listComplaints(),
        api.getAnalytics(),
      ]);
      setComplaints(cmpRes.complaints);
      setAnalytics(anRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load administrator data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const urgentQueue = useMemo(
    () =>
      complaints.filter(
        (c) => c.priority === 'Urgent' && c.status !== 'Resolved' && c.status !== 'Rejected'
      ),
    [complaints]
  );

  const filteredComplaints = useMemo(() => {
    const base = activeTab === 'urgent' ? urgentQueue : complaints;
    return base.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
      if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
      if (locationFilter !== 'All' && c.location !== locationFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const match =
          c.complaintCode.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    activeTab,
    urgentQueue,
    complaints,
    statusFilter,
    categoryFilter,
    priorityFilter,
    departmentFilter,
    locationFilter,
    search,
  ]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setDepartmentFilter('All');
    setLocationFilter('All');
  };

  const handleQuickStatusUpdate = async (
    e: React.MouseEvent,
    complaint: Complaint,
    nextStatus: 'In Progress' | 'Resolved'
  ) => {
    e.stopPropagation();
    setUpdatingId(complaint.id);
    setError(null);
    try {
      const defaultMessage =
        nextStatus === 'In Progress'
          ? 'Marked In Progress by campus administration.'
          : 'Issue verified and marked Resolved by campus administration.';
      const res = await api.updateComplaint(complaint.id, {
        status: nextStatus,
        adminComment: defaultMessage,
      });
      setComplaints((prev) =>
        prev.map((c) => (c.id === res.complaint.id ? res.complaint : c))
      );
      if (selectedComplaint?.id === res.complaint.id) {
        setSelectedComplaint(res.complaint);
      }
      api.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update complaint status.');
    } finally {
      setUpdatingId(null);
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
            <span className="inline-flex items-center gap-1 text-xs text-violet-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              Admin
            </span>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'queue'
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <LayoutList className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>All Complaints</span>
              <span className="ml-auto font-mono-data tabular-nums text-xs text-slate-400">
                {complaints.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'urgent'
                  ? 'bg-rose-500/15 text-rose-200 border border-rose-500/35'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Flame className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>Urgent Triage</span>
              <span className="ml-auto font-mono-data tabular-nums text-xs text-rose-300 font-semibold">
                {urgentQueue.length}
              </span>
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
              <span>Issue Heatmap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'analytics'
                  ? 'bg-sky-500/15 text-sky-200 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Analytics</span>
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

        {/* Admin Profile */}
        <div className="hidden lg:block p-4 border-t border-slate-800/80 space-y-3">
          <div>
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">
              {user.department || 'Campus Operations'}
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

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="px-6 py-4 border-b border-slate-800/80 bg-[#060b18]/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Admin Command</span>
            <span aria-hidden="true">/</span>
            <span className="text-white font-medium">
              {activeTab === 'queue'
                ? 'All Campus Complaints'
                : activeTab === 'urgent'
                ? 'Urgent Triage Queue'
                : activeTab === 'heatmap'
                ? 'Spatial Issue Heatmap'
                : 'Department & Resolution Analytics'}
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
              onClick={fetchAdminData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh Data</span>
            </button>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* Urgent Highlight Callout */}
          {urgentQueue.length > 0 && activeTab !== 'urgent' && (
            <div className="rounded-xl border border-rose-500/35 bg-rose-500/8 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {urgentQueue.length} Urgent Complaint{urgentQueue.length > 1 ? 's' : ''} Pending Action
                  </p>
                  <p className="text-xs text-rose-200/80">
                    High-severity electrical, safety, or lab infrastructure reports awaiting resolution.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('urgent')}
                className="px-3.5 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
              >
                Review Urgent Queue
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchAdminData}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-xs font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Top Metrics Row */}
          {analytics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs text-slate-400">Total Reports</p>
                <p className="text-2xl font-bold text-white font-mono-data tabular-nums mt-1.5">
                  {analytics.totalComplaints}
                </p>
              </div>
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs text-slate-400">Open Pipeline</p>
                <p className="text-2xl font-bold text-sky-300 font-mono-data tabular-nums mt-1.5">
                  {analytics.inProgressComplaints}
                </p>
              </div>
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs text-slate-400">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-cyan-300 font-mono-data tabular-nums mt-1.5">
                  {analytics.avgResolutionHours} hrs
                </p>
              </div>
              <div className="glass-surface rounded-xl p-4 sm:p-5">
                <p className="text-xs text-slate-400">Resolution Rate</p>
                <p className="text-2xl font-bold text-emerald-300 font-mono-data tabular-nums mt-1.5">
                  {analytics.resolutionRate}%
                </p>
              </div>
            </div>
          )}

          {(activeTab === 'queue' || activeTab === 'urgent') && (
            <section className="space-y-4">
              {/* Filter Bar */}
              <div className="glass-surface rounded-xl p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search
                      className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search ticket ID, title, student, or building..."
                      className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                    />
                  </div>

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
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    aria-label="Filter by category"
                    className="rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  >
                    <option value="All">All Categories</option>
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

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

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    aria-label="Filter by assigned department"
                    className="rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  >
                    <option value="All">All Departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    aria-label="Filter by campus zone"
                    className="rounded-lg bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-400"
                  >
                    <option value="All">All Campus Zones</option>
                    {CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc.code} value={loc.name}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* High-Density Complaints Table */}
              <div className="glass-surface rounded-xl overflow-hidden">
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 rounded-lg bg-slate-900/70 animate-pulse"
                      />
                    ))}
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <p className="text-base font-semibold text-white">No matching complaints</p>
                    <p className="text-sm text-slate-400">
                      Adjust your search query or filters to view other campus tickets.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800/80 text-xs text-slate-400 bg-slate-900/50">
                          <th className="py-3 px-4 font-medium whitespace-nowrap">Complaint ID</th>
                          <th className="py-3 px-4 font-medium">Complaint & Location</th>
                          <th className="py-3 px-4 font-medium whitespace-nowrap">Student Details</th>
                          <th className="py-3 px-4 font-medium whitespace-nowrap">Category</th>
                          <th className="py-3 px-4 font-medium whitespace-nowrap">Priority</th>
                          <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 font-medium text-right whitespace-nowrap">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {filteredComplaints.map((c) => {
                          const isUrgentOpen =
                            c.priority === 'Urgent' &&
                            c.status !== 'Resolved' &&
                            c.status !== 'Rejected';
                          const isRowUpdating = updatingId === c.id;

                          return (
                            <tr
                              key={c.id}
                              onClick={() => setSelectedComplaint(c)}
                              className={`cursor-pointer transition-colors ${
                                isUrgentOpen
                                  ? 'bg-rose-500/[0.04] hover:bg-rose-500/[0.09]'
                                  : 'hover:bg-slate-900/60'
                              }`}
                            >
                              <td className="py-3.5 px-4 font-mono-data text-xs text-sky-300 font-semibold whitespace-nowrap align-top">
                                <span>{c.complaintCode}</span>
                                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                                  {formatRelativeTime(c.updatedAt)}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 min-w-[220px] max-w-sm align-top">
                                <p className="font-medium text-white truncate">{c.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5 truncate">
                                  {c.location} · {c.department}
                                </p>
                              </td>

                              <td className="py-3.5 px-4 min-w-[170px] align-top">
                                {c.isAnonymous ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-300">
                                      <EyeOff className="w-3 h-3" aria-hidden="true" />
                                      Anonymous Student
                                    </span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                      Protected Identity
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-xs font-medium text-slate-200">
                                      {c.studentName}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-mono-data truncate max-w-[190px]">
                                      {c.studentRollNumber ? `${c.studentRollNumber} · ` : ''}
                                      {c.studentEmail}
                                    </p>
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-4 text-xs text-slate-300 whitespace-nowrap align-top">
                                {c.category}
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <PriorityIndicator priority={c.priority} />
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap align-top">
                                <StatusIndicator status={c.status} />
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap align-top">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  {(c.status === 'Pending' || c.status === 'Under Review') && (
                                    <button
                                      type="button"
                                      disabled={isRowUpdating}
                                      onClick={(e) => handleQuickStatusUpdate(e, c, 'In Progress')}
                                      className="px-2.5 py-1.5 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-[11px] font-medium text-sky-200 transition-colors disabled:opacity-50"
                                    >
                                      {isRowUpdating ? 'Saving...' : 'In Progress'}
                                    </button>
                                  )}
                                  {c.status === 'In Progress' && (
                                    <button
                                      type="button"
                                      disabled={isRowUpdating}
                                      onClick={(e) => handleQuickStatusUpdate(e, c, 'Resolved')}
                                      className="px-2.5 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-[11px] font-medium text-emerald-200 transition-colors disabled:opacity-50"
                                    >
                                      {isRowUpdating ? 'Saving...' : 'Resolve'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedComplaint(c);
                                    }}
                                    className="px-2.5 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-[11px] font-medium text-slate-200 transition-colors"
                                  >
                                    Manage
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'heatmap' && analytics && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Campus Spatial Issue Heatmap
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any campus building marker to filter and triage tickets in that zone
                  </p>
                </div>
                {locationFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('queue');
                    }}
                    className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors"
                  >
                    View Tickets in {locationFilter}
                  </button>
                )}
              </div>

              <CampusHeatmap
                zones={analytics.heatmap}
                selectedLocation={locationFilter}
                onSelectLocation={(loc) => setLocationFilter(loc)}
              />
            </section>
          )}

          {activeTab === 'analytics' && analytics && (
            <AnalyticsPanel stats={analytics} />
          )}
        </div>
      </main>

      <ComplaintDetailDrawer
        complaint={selectedComplaint}
        isAdmin={true}
        onClose={() => setSelectedComplaint(null)}
        onUpdated={(updated) => {
          setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setSelectedComplaint(updated);
          api.getAnalytics().then(setAnalytics).catch(() => {});
        }}
      />
    </div>
  );
}
