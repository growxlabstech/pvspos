import { Metadata } from 'next';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SettingsClient } from '@/features/settings/components/settings-client';

export const metadata: Metadata = {
  title: 'Settings - PVS POS',
  description: 'Manage store configuration, profile, and system preferences.',
};

export default function SettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      description="Configure store details, default tax rates, and account preferences."
    >
      <SettingsClient />
    </DashboardShell>
  );
}
