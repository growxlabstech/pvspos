export interface ProfileSettings {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  storeName: string;
  storeAddress?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  currency: string;
  taxRate: number;
  gstEnabled?: boolean;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsInput {
  fullName: string;
  storeName: string;
  storeAddress?: string;
  phone?: string;
  gstNumber?: string;
  currency: string;
  taxRate: number;
  gstEnabled?: boolean;
}
