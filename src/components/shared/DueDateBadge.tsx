"use client";

import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Timestamp } from '@/lib/types';
import { getDueDateStatus, formatDueDate, type DueDateStatus } from '@/lib/date-utils';

interface DueDateBadgeProps {
  dueDate?: Timestamp;
  isCompleted?: boolean;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact';
}

export function DueDateBadge({ 
  dueDate, 
  isCompleted = false, 
  className,
  showIcon = true,
  variant = 'default'
}: DueDateBadgeProps) {
  if (!dueDate) return null;

  const status = getDueDateStatus(dueDate, isCompleted);
  const formattedDate = formatDueDate(dueDate);

  // Don't show badge if not due and completed
  if (status === 'not-due' && isCompleted) return null;

  const getStatusConfig = (status: DueDateStatus) => {
    switch (status) {
      case 'overdue':
        return {
          variant: 'destructive' as const,
          icon: AlertTriangle,
          className: 'bg-destructive text-destructive-foreground',
        };
      case 'due-today':
        return {
          variant: 'default' as const,
          icon: Clock,
          className: 'bg-amber-500 text-white hover:bg-amber-600',
        };
      case 'due-soon':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200',
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Calendar,
          className: 'border-muted-foreground/20',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <Badge 
        variant={config.variant}
        className={cn(
          'text-xs',
          config.className,
          className
        )}
      >
        {showIcon && <Icon className="w-3 h-3 mr-1" />}
        {status === 'due-today' ? 'Today' : 
         status === 'overdue' ? 'Overdue' :
         formattedDate}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'flex items-center gap-1',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {formattedDate}
    </Badge>
  );
}