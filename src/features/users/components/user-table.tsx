'use client';

import { useState } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserProfile } from '../types/user.types';
import { EditIcon, TrashIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface UserTableProps {
  users: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDisable: (id: string) => void;
}

export function UserTable({ users, onEdit, onDisable }: UserTableProps) {
  const [search, setSearch] = useState('');
  const [disablingId, setDisablingId] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Full Name',
      accessor: (row: UserProfile) => row.fullName,
    },
    {
      header: 'Email Address',
      accessor: (row: UserProfile) => row.email,
    },
    {
      header: 'Phone Number',
      accessor: (row: UserProfile) => row.phone || 'N/A',
    },
    {
      header: 'Role',
      accessor: (row: UserProfile) => {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {row.appRole?.name || row.role}
          </span>
        );
      },
    },
    {
      header: 'Branch Office',
      accessor: (row: UserProfile) => row.branch?.name || 'All Branches (Global)',
    },
    {
      header: 'Status',
      accessor: (row: UserProfile) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            row.isActive
              ? 'bg-success-light text-success'
              : 'bg-danger-light text-danger'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: UserProfile) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
            <EditIcon className="h-4 w-4" />
          </Button>
          {row.isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDisablingId(row.id)}
              title="Deactivate Employee"
            >
              <TrashIcon className="h-4 w-4 text-danger" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search team members by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable columns={columns} data={filteredUsers} />

      <ConfirmDialog
        open={!!disablingId}
        onOpenChange={(open) => !open && setDisablingId(null)}
        title="Deactivate Team Member"
        description="Are you sure you want to deactivate this employee account? They will be locked out of PVS POS immediately."
        onConfirm={() => {
          if (disablingId) {
            onDisable(disablingId);
            setDisablingId(null);
          }
        }}
      />
    </div>
  );
}
