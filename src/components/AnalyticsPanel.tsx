import { Clock, CheckCircle2, Layers, TrendingUp } from 'lucide-react';
import type { OverviewStats } from '../types';

interface AnalyticsPanelProps {
  stats: OverviewStats;
}

export function AnalyticsPanel({ stats }: AnalyticsPanelProps) {
  const maxCategoryCount = Math.max(1, ...stats.categoryBreakdown.map((c) => c.count));
  const sortedDepartments = [...stats.departments].sort(
    (a, b) => b.totalAssigned - a.totalAssigned
  );

  return (
    <div className="space-y-6">
      {/* Top Analytical Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-surface rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Resolution Time</span>
            <Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-white font-mono-data tabular-nums mt-2">
            {stats.avgResolutionHours} hrs
          </p>
          <p className="text-xs text-slate-400 mt-1">Measured across resolved tickets</p>
        </div>

        <div className="glass-surface rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resolution Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-white font-mono-data tabular-nums mt-2">
            {stats.resolutionRate}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.resolvedComplaints} of {stats.totalComplaints} total reports
          </p>
        </div>

        <div className="glass-surface rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Active Pipeline</span>
            <Layers className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-white font-mono-data tabular-nums mt-2">
            {stats.inProgressComplaints}
          </p>
          <p className="text-xs text-slate-400 mt-1">Pending, under review & in progress</p>
        </div>

        <div className="glass-surface rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Urgent Escalations</span>
            <TrendingUp className="w-4 h-4 text-rose-400" aria-hidden="true" />
          </div>
          <p className="text-2xl font-bold text-rose-300 font-mono-data tabular-nums mt-2">
            {stats.urgentOpenComplaints}
          </p>
          <p className="text-xs text-slate-400 mt-1">Open high-severity campus issues</p>
        </div>
      </div>

      {/* Department Performance Comparison + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Performance Table / Comparison */}
        <div className="lg:col-span-7 glass-surface rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-semibold text-white">
                Department Performance Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live turnaround speed and resolution efficiency by assigned team
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono-data">
              {sortedDepartments.length} units
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-xs text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Department</th>
                  <th className="py-2.5 px-3 font-medium text-right">Assigned</th>
                  <th className="py-2.5 px-3 font-medium text-right">Active</th>
                  <th className="py-2.5 px-3 font-medium text-right">Avg Time</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {sortedDepartments.map((dept) => (
                  <tr key={dept.department} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="font-medium text-slate-200">{dept.department}</span>
                      {dept.urgentCount > 0 && (
                        <span className="block text-xs text-rose-300 mt-0.5">
                          {dept.urgentCount} urgent open
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-data tabular-nums text-slate-300">
                      {dept.totalAssigned}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-data tabular-nums text-sky-300">
                      {dept.activeCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono-data tabular-nums text-slate-300">
                      {dept.avgResolutionHours > 0 ? `${dept.avgResolutionHours}h` : '—'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <div className="inline-flex items-center gap-2.5 justify-end">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                            style={{ width: `${dept.resolutionRate}%` }}
                          />
                        </div>
                        <span className="font-mono-data tabular-nums text-xs text-slate-200 w-9 text-right">
                          {dept.resolutionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category & Status Distribution */}
        <div className="lg:col-span-5 glass-surface rounded-xl p-6 flex flex-col justify-between gap-6">
          <div>
            <div className="pb-4 border-b border-slate-800/80">
              <h3 className="text-base font-semibold text-white">Issue Volume by Category</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Total submitted vs currently open across campus sectors
              </p>
            </div>

            <div className="mt-4 space-y-3.5">
              {stats.categoryBreakdown.map((item) => {
                const totalWidth = Math.round((item.count / maxCategoryCount) * 100);
                const openWidth =
                  item.count > 0 ? Math.round((item.openCount / item.count) * totalWidth) : 0;

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">{item.category}</span>
                      <span className="text-slate-400 font-mono-data tabular-nums">
                        {item.count} total · {item.openCount} open
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800/90 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-sky-500/35 transition-all duration-300"
                        style={{ width: `${Math.max(item.count > 0 ? 6 : 0, totalWidth)}%` }}
                      />
                      {openWidth > 0 && (
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 absolute left-0 top-0 transition-all duration-300"
                          style={{ width: `${Math.max(4, openWidth)}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs font-medium text-slate-400 mb-3">Status Pipeline</p>
            <div className="grid grid-cols-5 gap-2">
              {stats.statusBreakdown.map((st) => (
                <div
                  key={st.status}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800/80 text-center"
                >
                  <p className="text-base font-bold text-white font-mono-data tabular-nums">
                    {st.count}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5" title={st.status}>
                    {st.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
