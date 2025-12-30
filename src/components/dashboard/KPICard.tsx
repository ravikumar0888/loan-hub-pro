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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-sm mt-2',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-muted-foreground ml-1">vs last month</span>
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBgStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
