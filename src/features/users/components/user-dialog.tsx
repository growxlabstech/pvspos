'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile, AppRole, Branch } from '../types/user.types';
import { toast } from 'sonner';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  roles: AppRole[];
  branches: Branch[];
  onSubmit: (data: any) => Promise<void>;
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  roles,
  branches,
  onSubmit,
}: UserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      phone: '',
      roleId: '',
      branchId: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        password: '', // blank on edit unless reset requested
        fullName: user.fullName,
        phone: user.phone || '',
        roleId: user.roleId || '',
        branchId: user.branchId || '',
        isActive: user.isActive,
      });
    } else {
      reset({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        roleId: '',
        branchId: '',
        isActive: true,
      });
    }
  }, [user, open, reset]);

  const handleFormSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      const payload = { ...values };
      if (isEdit && !payload.password) {
        delete payload.password; // do not overwrite password with empty string
      }
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modify role access, assigned branch, and profile parameters.'
              : 'Provision a new user account with secure credentials and RBAC.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input id="fullName" {...register('fullName', { required: 'Name is required' })} />
            {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              disabled={isEdit}
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="password">{isEdit ? 'Reset Password (Optional)' : 'Security Password *'}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isEdit ? 'Leave blank to keep current' : '••••••••'}
              {...register('password', { required: !isEdit ? 'Password is required' : false })}
            />
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register('phone')} />
          </div>

          <div>
            <Label htmlFor="roleId">Dynamic Access Role *</Label>
            <select
              id="roleId"
              className="w-full border rounded-lg p-2 bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
              {...register('roleId', { required: 'Role is required' })}
            >
              <option value="">Select access role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
            {errors.roleId && <p className="text-xs text-destructive mt-1">{errors.roleId.message}</p>}
          </div>

          <div>
            <Label htmlFor="branchId">Branch Assignment</Label>
            <select
              id="branchId"
              className="w-full border rounded-lg p-2 bg-background text-sm text-foreground focus:ring-2 focus:ring-primary"
              {...register('branchId')}
            >
              <option value="">All Branches (Global Access)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                className="w-4 h-4 rounded text-primary border-border focus:ring-primary"
                {...register('isActive')}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Account Status Active
              </Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
