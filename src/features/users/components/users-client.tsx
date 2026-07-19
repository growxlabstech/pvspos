'use client';

import { useState } from 'react';
import { useUsers, useRoles, useBranches, useUserMutations } from '../hooks/use-users';
import { UserTable } from './user-table';
import { UserDialog } from './user-dialog';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import { UserProfile } from '../types/user.types';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export function UsersClient() {
  const { data: users, isLoading, error } = useUsers();
  const { data: roles } = useRoles();
  const { data: branches } = useBranches();
  const { createUser, updateUser, deleteUser } = useUserMutations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleDisable = async (id: string) => {
    try {
      await deleteUser.mutateAsync(id);
      toast.success('User deactivated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate user');
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (selectedUser) {
      await updateUser.mutateAsync({ id: selectedUser.id, data: values });
      toast.success('Team member profile updated successfully!');
    } else {
      await createUser.mutateAsync(values);
      toast.success('New team member provisioned successfully!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading employee catalog...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48 text-danger text-sm font-semibold">
        Failed to load users database.
      </div>
    );
  }

  return (
    <DashboardShell
      title="User Management"
      description="Configure dynamic RBAC roles, security permissions, branches, and manage employee login accounts."
      action={
        <Button onClick={handleAddUser} className="font-bold">
          <PlusIcon className="h-4 w-4 mr-2" /> Add Team Member
        </Button>
      }
    >
      <div className="bg-card p-4 rounded-xl border">
        <UserTable
          users={users || []}
          onEdit={handleEdit}
          onDisable={handleDisable}
        />
      </div>

      <UserDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        roles={roles || []}
        branches={branches || []}
        onSubmit={handleFormSubmit}
      />
    </DashboardShell>
  );
}
