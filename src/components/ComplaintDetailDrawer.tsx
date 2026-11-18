import { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  EyeOff,
  FileImage,
  MapPin,
  MessageSquare,
  Send,
  User,
  X,
} from 'lucide-react';
import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  DEPARTMENTS,
  type Complaint,
  type ComplaintPriority,
  type ComplaintStatus,
  type DepartmentName,
} from '../types';
import { api } from '../lib/api';
import { formatDateTime } from '../lib/format';
import { PriorityIndicator, StatusIndicator } from './StatusText';

interface ComplaintDetailDrawerProps {
  complaint: Complaint | null;
  isAdmin: boolean;
  onClose: () => void;
  onUpdated: (updated: Complaint) => void;
}

export function ComplaintDetailDrawer({
  complaint,
  isAdmin,
  onClose,
  onUpdated,
}: ComplaintDetailDrawerProps) {
  const [status, setStatus] = useState<ComplaintStatus>('Pending');
  const [department, setDepartment] = useState<DepartmentName>('Unassigned');
  const [priority, setPriority] = useState<ComplaintPriority>('Medium');
  const [adminComment, setAdminComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status);
      setDepartment(complaint.department);
      setPriority(complaint.priority);
      setAdminComment('');
      setError(null);
      setSuccessMsg(null);
      setImgFailed(false);
    }
  }, [complaint]);

  if (!complaint) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.updateComplaint(complaint.id, {
        status,
        department,
        priority,
        adminComment: adminComment.trim() || undefined,
      });
      onUpdated(res.complaint);
      setAdminComment('');
      setSuccessMsg('Complaint updated and student notified.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update complaint.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Complaint details ${complaint.complaintCode}`}
    >
      <div className="w-full max-w-2xl bg-[#080f23] border-l border-slate-800/90 h-full overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between gap-4 px-6 py-4 bg-[#080f23]/95 backdrop-blur-md border-b border-slate-800/80">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono-data">
              <span className="text-sky-300 font-semibold">{complaint.complaintCode}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDateTime(complaint.createdAt)}</span>
            </div>
            <h2 className="text-lg font-semibold text-white truncate mt-0.5">
              {complaint.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors shrink-0"
            aria-label="Close complaint details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Primary Metadata Strip (zero-pill unboxed typography) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-5 border-b border-slate-800/70">
            <div>
              <p className="text-xs text-slate-400 mb-1">Status</p>
              <StatusIndicator status={complaint.status} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Priority</p>
              <PriorityIndicator priority={complaint.priority} />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Category</p>
              <p className="text-xs font-medium text-slate-200">{complaint.category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Assigned Unit</p>
              <p className="text-xs font-medium text-slate-200 truncate" title={complaint.department}>
                {complaint.department}
              </p>
            </div>
          </div>

          {/* Location & Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/55 border border-slate-800/80 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs text-slate-400">Campus Location</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5">{complaint.location}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/55 border border-slate-800/80 flex items-start gap-3">
              {complaint.isAnonymous ? (
                <EyeOff className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" aria-hidden="true" />
              ) : (
                <User className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="text-xs text-slate-400">Submitted By</p>
                <p className="text-sm font-medium text-slate-100 mt-0.5 truncate">
                  {complaint.isAnonymous && isAdmin
                    ? 'Anonymous Student (Identity Protected)'
                    : complaint.studentName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {complaint.isAnonymous && isAdmin
                    ? 'Privacy shield active'
                    : `${complaint.studentEmail}${
                        complaint.studentRollNumber ? ` · ${complaint.studentRollNumber}` : ''
                      }`}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-medium text-slate-400 mb-2">Issue Description</h3>
            <p className="text-sm leading-relaxed text-slate-200 bg-slate-900/45 border border-slate-800/75 rounded-xl p-4 whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Attached Evidence Image */}
          {complaint.imageUrl && (
            <div>
              <h3 className="text-xs font-medium text-slate-400 mb-2">Attached Photo Evidence</h3>
              {!imgFailed ? (
                <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950">
                  <img
                    src={complaint.imageUrl}
                    alt={`Attachment for ${complaint.complaintCode}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgFailed(true)}
                    className="w-full max-h-72 object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex items-center gap-3 text-xs text-slate-400">
                  <FileImage className="w-5 h-5 text-slate-500" aria-hidden="true" />
                  <span>Attachment preview unavailable</span>
                </div>
              )}
            </div>
          )}

          {/* Latest Admin Response */}
          {complaint.adminComment && (
            <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
              <div className="flex items-center gap-2 text-xs font-medium text-sky-300 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Latest Administrative Remark</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{complaint.adminComment}</p>
            </div>
          )}

          {/* Admin Triage Controls */}
          {isAdmin && (
            <form
              onSubmit={handleSave}
              className="glass-surface-elevated rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-semibold text-white">
                  Administrative Triage & Assignment
                </h3>
                <Building2 className="w-4 h-4 text-sky-400" aria-hidden="true" />
              </div>

              {error && (
                <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" htmlFor="admin-status">
                    Update Status
                  </label>
                  <select
                    id="admin-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    {COMPLAINT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" htmlFor="admin-dept">
                    Assign Department
                  </label>
                  <select
                    id="admin-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as DepartmentName)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5" htmlFor="admin-priority">
                    Priority
                  </label>
                  <select
                    id="admin-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                    className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
                  >
                    {COMPLAINT_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5" htmlFor="admin-comment">
                  Response Message to Student (delivered to student notification feed)
                </label>
                <textarea
                  id="admin-comment"
                  rows={3}
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Write your response to the student, action taken, or resolution update..."
                  className="w-full rounded-lg bg-slate-900 border border-slate-700/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{saving ? 'Sending...' : 'Update Status & Send Response'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Status History Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-slate-400">Audit & Status History</h3>
              <span className="text-xs text-slate-500 font-mono-data">
                {complaint.statusHistory.length} events
              </span>
            </div>
            <div className="space-y-3">
              {complaint.statusHistory
                .slice()
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/75 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <StatusIndicator status={entry.status} />
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono-data">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-200">{entry.comment}</p>
                    <p className="text-xs text-slate-400">
                      {entry.updatedBy} · {entry.department}
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
