import type { UserRole } from '../types';
import { ROLE_LABELS, ROLE_COLORS } from '../types';

interface Props { role: UserRole; short?: boolean; }

export function RoleBadge({ role, short = false }: Props) {
  const c = ROLE_COLORS[role];
  const label = ROLE_LABELS[role];
  const display = short && label.length > 24 ? label.slice(0, 22) + '…' : label;
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {display}
    </span>
  );
}
