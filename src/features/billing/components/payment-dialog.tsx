'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cart.store';
import { formatCurrency } from '@/lib/utils';
import { Loader2Icon, CheckIcon } from '@/components/icons';
import { toast } from 'sonner';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (saleData: any) => void;
}

export function PaymentDialog({ open, onOpenChange, onSuccess }: PaymentDialogProps) {
  const { items, discount, customer, getSubtotal, getTaxAmount, getTotal, clearCart } = useCartStore();

  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount();
  const grandTotal = getTotal();

  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [cashTendered, setCashTendered] = useState(grandTotal.toString());
  const [isProcessing, setIsProcessing] = useState(false);

  const tenderedNum = Number(cashTendered) || 0;
  const changeReturn = Math.max(0, tenderedNum - grandTotal);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.price - (i.discount || 0),
          taxRate: i.taxRate,
        })),
        subtotal,
        taxAmount,
        discountAmount: discount,
        total: grandTotal,
        paymentMethod,
        customerName: customer?.name || 'Walk-in Customer',
      };

      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      toast.success('Sale completed successfully!');
      clearCart();
      onOpenChange(false);
      onSuccess(data);
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center text-lg font-bold">
            <span>💳 Complete Payment</span>
            <span className="text-primary font-extrabold text-xl">{formatCurrency(grandTotal)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`p-3 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card hover:bg-accent border-border text-foreground'
              }`}
            >
              💵 Cash Payment
            </button>
            <button
              onClick={() => setPaymentMethod('UPI')}
              className={`p-3 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                paymentMethod === 'UPI'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card hover:bg-accent border-border text-foreground'
              }`}
            >
              📱 UPI QR Code
            </button>
          </div>

          {/* Cash Tendered & Change Return */}
          {paymentMethod === 'CASH' ? (
            <div className="space-y-3 p-4 rounded-xl border bg-accent/20">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Cash Received from Customer (₹)</label>
                <Input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="text-xl font-bold bg-background text-foreground mt-1"
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t text-sm font-bold">
                <span>Change to Return:</span>
                <span className="text-emerald-600 text-lg">{formatCurrency(changeReturn)}</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border bg-accent/20 text-center space-y-2">
              <div className="w-32 h-32 mx-auto bg-white p-2 rounded-lg border flex items-center justify-center font-mono text-xs font-bold text-black shadow-sm">
                [ UPI QR CODE ]
                <br />
                ₹{grandTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ask customer to scan QR code using GPay, PhonePe, or Paytm.
              </p>
            </div>
          )}

          {/* Quick Cash Presets */}
          {paymentMethod === 'CASH' && (
            <div className="flex gap-2 justify-between">
              {[grandTotal, 100, 200, 500, 2000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setCashTendered(preset.toString())}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border bg-card hover:bg-accent cursor-pointer"
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          )}

          {/* Finalize Button */}
          <Button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full py-6 text-base font-bold bg-primary text-primary-foreground shadow-lg hover:scale-[1.01] transition-transform"
          >
            {isProcessing ? (
              <Loader2Icon className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckIcon className="w-5 h-5 mr-2" /> Complete Sale ({formatCurrency(grandTotal)})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
