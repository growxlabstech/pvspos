"use client";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import { SaleWithItems } from "../types/sales.types";
import { ReceiptPreview } from "@/features/billing/components/receipt-preview";
import { useState } from "react";

interface SaleDetailDialogProps {
  sale: SaleWithItems;
  onClose: () => void;
}

export function SaleDetailDialog({ sale, onClose }: SaleDetailDialogProps) {
  const [showReceipt, setShowReceipt] = useState(false);

  if (showReceipt) {
    return <ReceiptPreview sale={sale} onClose={() => setShowReceipt(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold">Sale Details</h2>
            <p className="text-muted-foreground">{sale.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatDateTime(sale.createdAt)}</div>
            <div className="text-sm mt-1">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                {sale.paymentStatus}
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Product</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Tax</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-2 text-right">{formatCurrency(item.taxAmount)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span>{formatCurrency(sale.taxAmount)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount:</span>
                  <span>-{formatCurrency(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>Total:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-muted/30 flex justify-between">
          <div className="text-sm text-muted-foreground pt-2">
            Payment: <span className="font-medium text-foreground">{sale.paymentMethod}</span>
          </div>
          <div className="space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted"
            >
              Close
            </button>
            <button 
              onClick={() => setShowReceipt(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
