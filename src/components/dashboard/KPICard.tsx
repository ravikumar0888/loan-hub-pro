import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'destructive' | 'info' | 'accent';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  variant = 'primary',
  trend,
  onClick,
}: KPICardProps) {
  const variantStyles = {
    primary: 'kpi-card-primary',
    success: 'kpi-card-success',
    warning: 'kpi-card-warning',
    destructive: 'kpi-card-destructive',
    info: 'kpi-card-info',
    accent: 'kpi-card-accent',
  };

  const iconBgStyles = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
    info: 'bg-info/10 text-info',
    accent: 'bg-accent/10 text-accent',
  };

  return (
    <div
      className={cn(
        'kpi-card cursor-pointer',
        variantStyles[variant]
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs sm:text-sm mt-1 sm:mt-2',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1 hidden sm:inline">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn('p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0', iconBgStyles[variant])}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
}
