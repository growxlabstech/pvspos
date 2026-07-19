import { Metadata } from 'next';
import { SalesClient } from '@/features/sales/components/sales-client';

export const metadata: Metadata = {
  title: 'Sales History',
};

export default function SalesPage() {
  return (
    <div className="p-8">
      <SalesClient />
    </div>
  );
}
