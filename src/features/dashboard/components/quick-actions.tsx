'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingCartIcon, PackageIcon, TagsIcon, BarChart3Icon } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    title: 'New Bill',
    description: 'Start billing a customer',
    href: '/billing',
    icon: ShoppingCartIcon,
    color: 'text-primary',
    bgColor: 'bg-primary-light',
  },
  {
    title: 'Add Product',
    description: 'Add a new product',
    href: '/products?action=new',
    icon: PackageIcon,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    title: 'Categories',
    description: 'Manage categories',
    href: '/categories',
    icon: TagsIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Sales Report',
    description: 'View sales history',
    href: '/sales',
    icon: BarChart3Icon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-border hover:bg-accent/50 transition-all duration-200 group"
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
                      action.bgColor
                    )}
                  >
                    <Icon className={cn('h-5 w-5', action.color)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {action.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
