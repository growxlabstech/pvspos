import { UsersClient } from '@/features/users/components/users-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Management | PVS POS',
  description: 'Manage branches, roles, permissions, and cashier user credentials.',
};

export default function UsersPage() {
  return (
    <div className="container mx-auto py-2">
      <UsersClient />
    </div>
  );
}
