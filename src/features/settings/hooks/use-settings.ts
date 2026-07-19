import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileSettings, UpdateSettingsInput } from '../types/settings.types';

export function useSettings() {
  return useQuery<ProfileSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSettingsInput) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update settings');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
