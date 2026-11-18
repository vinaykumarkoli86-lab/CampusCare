import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Flame,
  ShieldAlert,
  Wrench,
  XCircle,
} from 'lucide-react';
import type { ComplaintPriority, ComplaintStatus } from '../types';
import { getPriorityAccent, getStatusAccent } from '../lib/format';

export function StatusIndicator({ status }: { status: ComplaintStatus }) {
  const style = getStatusAccent(status);
  const Icon =
    status === 'Pending'
      ? Clock
      : status === 'Under Review'
      ? Eye
      : status === 'In Progress'
      ? Wrench
      : status === 'Resolved'
      ? CheckCircle2
      : XCircle;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${style.text}`}>
      <Icon className={`w-3.5 h-3.5 shrink-0 ${style.indicator}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function PriorityIndicator({ priority }: { priority: ComplaintPriority }) {
  const style = getPriorityAccent(priority);
  const Icon =
    priority === 'Urgent'
      ? Flame
      : priority === 'High'
      ? AlertTriangle
      : priority === 'Medium'
      ? ShieldAlert
      : Clock;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${style.text}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{priority}</span>
    </span>
  );
}
