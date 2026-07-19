"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SalesTable } from "./sales-table";

const queryClient = new QueryClient();

export function SalesClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View and manage past transactions.</p>
        </div>
        <SalesTable />
      </div>
    </QueryClientProvider>
  );
}
