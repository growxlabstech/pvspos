'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  TagsIcon,
  WarehouseIcon,
  ReceiptIcon,
  SettingsIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';

const navItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
  { title: 'Billing', href: '/billing', icon: ShoppingCartIcon },
  { title: 'Products', href: '/products', icon: PackageIcon },
  { title: 'Categories', href: '/categories', icon: TagsIcon },
  { title: 'Inventory', href: '/inventory', icon: WarehouseIcon },
  { title: 'Sales', href: '/sales', icon: ReceiptIcon },
  { title: 'Users', href: '/users', icon: UserIcon },
  { title: 'Settings', href: '/settings', icon: SettingsIcon },
];


export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-lg shrink-0">
            P
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-bold text-lg whitespace-nowrap overflow-hidden"
            >
              PVS POS
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-[3px] border-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? item.title : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon className="w-5 h-5" /> : (
            <>
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
