import type { ComplaintPriority, ComplaintStatus } from '../types';

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusAccent(status: ComplaintStatus): {
  text: string;
  indicator: string;
  subtleBg: string;
} {
  switch (status) {
    case 'Pending':
      return {
        text: 'text-amber-300',
        indicator: 'text-amber-400',
        subtleBg: 'bg-amber-500/10 border-amber-500/25',
      };
    case 'Under Review':
      return {
        text: 'text-violet-300',
        indicator: 'text-violet-400',
        subtleBg: 'bg-violet-500/10 border-violet-500/25',
      };
    case 'In Progress':
      return {
        text: 'text-sky-300',
        indicator: 'text-sky-400',
        subtleBg: 'bg-sky-500/10 border-sky-500/25',
      };
    case 'Resolved':
      return {
        text: 'text-emerald-300',
        indicator: 'text-emerald-400',
        subtleBg: 'bg-emerald-500/10 border-emerald-500/25',
      };
    case 'Rejected':
      return {
        text: 'text-rose-300',
        indicator: 'text-rose-400',
        subtleBg: 'bg-rose-500/10 border-rose-500/25',
      };
  }
}

export function getPriorityAccent(priority: ComplaintPriority): {
  text: string;
  border: string;
  isUrgent: boolean;
} {
  switch (priority) {
    case 'Urgent':
      return {
        text: 'text-rose-300',
        border: 'border-rose-500/35 bg-rose-500/10',
        isUrgent: true,
      };
    case 'High':
      return {
        text: 'text-amber-300',
        border: 'border-amber-500/30 bg-amber-500/10',
        isUrgent: false,
      };
    case 'Medium':
      return {
        text: 'text-sky-300',
        border: 'border-sky-500/25 bg-sky-500/10',
        isUrgent: false,
      };
    case 'Low':
      return {
        text: 'text-slate-300',
        border: 'border-slate-600/40 bg-slate-800/40',
        isUrgent: false,
      };
  }
}
