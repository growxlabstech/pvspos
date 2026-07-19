export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'OWNER' | 'MANAGER' | 'CASHIER';
  avatarUrl: string | null;
  storeName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}
