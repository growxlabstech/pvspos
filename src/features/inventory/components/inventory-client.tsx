"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InventoryTable } from "./inventory-table";

const queryClient = new QueryClient();

export function InventoryClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <InventoryTable />
      </div>
    </QueryClientProvider>
  );
}
