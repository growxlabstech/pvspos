import {
  LayoutDashboardIcon,
  ShoppingCartIcon,
  PackageIcon,
  TagsIcon,
  WarehouseIcon,
  ReceiptIcon,
  SettingsIcon,
} from '@/components/icons';

export const APP_NAME = 'PVS POS';
export const APP_DESCRIPTION = 'Modern Point of Sale System for Retail Businesses';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_TAX_RATE = 18;

export const PAYMENT_METHODS = ['CASH', 'UPI'] as const;

export const UNITS = [
  { value: 'PIECE', label: 'Piece' },
  { value: 'KG', label: 'Kilogram' },
  { value: 'GRAM', label: 'Gram' },
  { value: 'LITER', label: 'Liter' },
  { value: 'ML', label: 'Milliliter' },
  { value: 'DOZEN', label: 'Dozen' },
  { value: 'BOX', label: 'Box' },
  { value: 'PACK', label: 'Pack' },
] as const;

export const NAV_ITEMS = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
  { title: 'Billing', href: '/billing', icon: ShoppingCartIcon },
  { title: 'Products', href: '/products', icon: PackageIcon },
  { title: 'Categories', href: '/categories', icon: TagsIcon },
  { title: 'Inventory', href: '/inventory', icon: WarehouseIcon },
  { title: 'Sales', href: '/sales', icon: ReceiptIcon },
  { title: 'Settings', href: '/settings', icon: SettingsIcon },
] as const;
