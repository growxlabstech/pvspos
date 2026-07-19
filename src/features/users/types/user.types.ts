export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'OWNER' | 'MANAGER' | 'CASHIER';
  roleId: string | null;
  branchId: string | null;
  avatarUrl: string | null;
  storeName: string;
  storeAddress: string | null;
  gstNumber: string | null;
  currency: string;
  taxRate: number;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  appRole?: {
    name: string;
    code: string;
  } | null;
  branch?: {
    name: string;
    code: string;
  } | null;
}

export interface AppRole {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isSystem: boolean;
  permissions?: {
    permission: AppPermission;
  }[];
}

export interface AppPermission {
  id: string;
  module: string;
  action: string;
  code: string;
  description: string | null;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
}
