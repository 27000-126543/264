import { TaskStatus, TASK_STATUS_LABELS } from '../types';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

const statusStyles: Record<TaskStatus, string> = {
  pending: 'bg-dark-600 text-dark-200',
  submitted: 'bg-primary-500/20 text-primary-300 border border-primary-500/30',
  optimizing: 'bg-accent-500/20 text-accent-300 border border-accent-500/30',
  calculating: 'bg-warning-500/20 text-warning-300 border border-warning-500/30',
  comparing: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  completed: 'bg-success-500/20 text-success-300 border border-success-500/30',
  error: 'bg-danger-500/20 text-danger-300 border border-danger-500/30',
  rollback: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
