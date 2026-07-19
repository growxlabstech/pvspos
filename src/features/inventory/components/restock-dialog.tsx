"use client";

import { useState } from "react";
import { InventoryItem } from "../types/inventory.types";
import { useRestockMutation } from "../hooks/use-inventory";

interface RestockDialogProps {
  item: InventoryItem;
  onClose: () => void;
}

export function RestockDialog({ item, onClose }: RestockDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const { mutate, isPending } = useRestockMutation();

  const handleRestock = () => {
    if (quantity <= 0) return;
    mutate(
      { id: item.productId, quantity },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-md w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">Restock {item.product.name}</h2>
        <p className="text-sm text-muted-foreground">Current Stock: {item.quantity}</p>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity to add</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="border px-3 py-2 rounded-md w-full"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
          <button 
            onClick={handleRestock} 
            disabled={isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          >
            {isPending ? "Restocking..." : "Restock"}
          </button>
        </div>
      </div>
    </div>
  );
}
