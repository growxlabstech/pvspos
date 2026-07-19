"use client";

import { useState } from "react";
import { useInventory } from "../hooks/use-inventory";
import { RestockDialog } from "./restock-dialog";
import { InventoryItem } from "../types/inventory.types";
import { cn } from "@/lib/utils";

export function InventoryTable() {
  const { data: inventory, isLoading } = useInventory();
  const [search, setSearch] = useState("");
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);

  if (isLoading) return <div>Loading...</div>;

  const filtered = inventory?.filter((item: InventoryItem) =>
    item.product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search by product name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border px-3 py-2 rounded-md w-full max-w-sm"
      />
      <div className="border rounded-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Current Stock</th>
              <th className="p-3">Reorder Point</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Restocked</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((item: InventoryItem) => {
              const isOutOfStock = item.quantity === 0;
              const isLowStock = item.quantity <= item.reorderPoint && item.quantity > 0;
              
              return (
                <tr key={item.id} className="border-t">
                  <td className="p-3">{item.product.name}</td>
                  <td className="p-3">{item.product.sku}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.reorderPoint}</td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      isOutOfStock ? "bg-red-100 text-red-800" :
                      isLowStock ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    )}>
                      {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                    </span>
                  </td>
                  <td className="p-3">
                    {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setRestockItem(item)}
                      className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
                    >
                      Restock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {restockItem && (
        <RestockDialog
          item={restockItem}
          onClose={() => setRestockItem(null)}
        />
      )}
    </div>
  );
}
