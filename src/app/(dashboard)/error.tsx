'use client';

import { useEffect } from 'react';
import { AlertTriangleIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-danger-light mb-4">
        <AlertTriangleIcon className="h-8 w-8 text-danger" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An unexpected error occurred. Please try again or contact support if the
        problem persists.
      </p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
