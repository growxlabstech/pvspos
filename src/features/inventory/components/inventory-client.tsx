"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InventoryTable } from "./inventory-table";

const queryClient = new QueryClient();

export function InventoryClient() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your product stock levels.</p>
        </div>
        <InventoryTable />
      </div>
    </QueryClientProvider>
  );
}
