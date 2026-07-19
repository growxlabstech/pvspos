"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SalesTable } from "./sales-table";

const queryClient = new QueryClient();

export function SalesClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <SalesTable />
      </div>
    </QueryClientProvider>
  );
}
