import { Metadata } from 'next';
import { SettingsClient } from '@/features/settings/components/settings-client';

export const metadata: Metadata = {
  title: 'Settings - PVS POS',
  description: 'Manage store configuration, profile, and system preferences.',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure store details, default tax rates, and account preferences.
        </p>
      </div>

      <SettingsClient />
    </div>
  );
}
