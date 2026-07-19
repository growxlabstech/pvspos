'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserProfile, AppRole, AppPermission, Branch } from '../types/user.types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserProfile[]> => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async (): Promise<AppRole[]> => {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async (): Promise<AppPermission[]> => {
      const res = await fetch('/api/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    },
  });
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async (): Promise<Branch[]> => {
      const res = await fetch('/api/branches');
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json();
    },
  });
}

export function useUserMutations() {
  const queryClient = useQueryClient();

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const createRole = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const updateRole = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  return { createUser, updateUser, deleteUser, createRole, updateRole };
}
