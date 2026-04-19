import type { PermitStatus } from '../types';
import { STATUS_LABELS, STATUS_COLORS } from '../types';

interface Props { status: PermitStatus; size?: 'sm' | 'md'; }

export function StatusBadge({ status, size = 'md' }: Props) {
  const c = STATUS_COLORS[status];
  const sz = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sz} ${c.bg} ${c.text} font-medium whitespace-nowrap`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
