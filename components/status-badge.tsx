import { cn } from '@/lib/utils';

type StatusType = 'searching' | 'matched' | 'en-route' | 'arrived' | 'in-trip' | 'completed' | 'cancelled' | 'pending' | 'confirmed';

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  searching: { label: 'Searching', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  matched: { label: 'Matched', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  'en-route': { label: 'En Route', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  arrived: { label: 'Arrived', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'in-trip': { label: 'In Trip', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  pending: { label: 'Pending', className: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
