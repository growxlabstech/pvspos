'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  TagsIcon,
  WarehouseIcon,
  ReceiptIcon,
  SettingsIcon,
  UserIcon,
  MenuIcon,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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


export function MobileSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer" aria-label="Open menu">
          <MenuIcon className="w-5 h-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="flex items-center h-16 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <span className="font-bold text-lg">PVS POS</span>
          </div>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-light text-primary border-l-[3px] border-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
