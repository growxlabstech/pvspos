'use client';

import { motion } from 'framer-motion';
import { TrendingUpIcon, TrendingDownIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
  index?: number;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  iconColor = 'text-primary',
  iconBgColor = 'bg-primary-light',
  index = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trend.isPositive ? (
                    <TrendingUpIcon className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <TrendingDownIcon className="h-3.5 w-3.5 text-danger" />
                  )}
                  <span
                    className={cn(
                      'text-xs font-medium',
                      trend.isPositive ? 'text-success' : 'text-danger'
                    )}
                  >
                    {trend.isPositive ? '+' : ''}{trend.value}%
                  </span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl', iconBgColor)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
