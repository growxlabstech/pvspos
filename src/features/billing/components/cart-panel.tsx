'use client';

import { useCartStore } from '@/stores/cart.store';
import { Button } from '@/components/ui/button';
import { TrashIcon, PlusIcon, MinusIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface CartPanelProps {
  onOpenPayment: () => void;
  onOpenCustomer: () => void;
  onHoldBill: () => void;
}

export function CartPanel({ onOpenPayment, onOpenCustomer, onHoldBill }: CartPanelProps) {
  const {
    items,
    discount,
    customer,
    removeItem,
    updateQuantity,
    updateItemDiscount,
    setDiscount,
    clearCart,
    getSubtotal,
    getTaxAmount,
    getRoundOff,
    getTotal,
    getItemCount,
    gstEnabled,
  } = useCartStore();

  const [billDiscountInput, setBillDiscountInput] = useState(discount.toString());

  const subtotal = getSubtotal();
  const taxAmount = getTaxAmount();
  const roundOff = getRoundOff();
  const total = getTotal();
  const itemCount = getItemCount();

  const handleBillDiscountChange = (val: string) => {
    setBillDiscountInput(val);
    const num = Number(val) || 0;
    setDiscount(num);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Customer & Cart Header */}
      <div className="p-3 border-b bg-card flex justify-between items-center gap-2">
        <div onClick={onOpenCustomer} className="cursor-pointer group flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            👤
          </div>
          <div>
            <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
              {customer ? customer.name : 'Walk-in Customer'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {customer?.phone ? `Mob: ${customer.phone}` : 'Click to change customer (F3)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-muted rounded-full text-muted-foreground">
            {itemCount} Items
          </span>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-xs text-danger hover:bg-danger/10 h-7 px-2"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Cart Items Table */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <span className="text-4xl mb-2">🛒</span>
            <p className="font-semibold text-sm">Cart is Empty</p>
            <p className="text-xs max-w-xs mt-1">
              Scan a barcode or click products from the left menu to start billing.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const itemPrice = item.price - (item.discount || 0);
            const lineTotal = itemPrice * item.quantity;

            return (
              <div
                key={item.productId}
                className="p-3 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs text-foreground">{item.productName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      ₹{item.price.toFixed(2)} / {item.unit} • Tax: {item.taxRate}%
                    </p>
                  </div>
                  <span className="font-bold text-sm text-foreground">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  {/* Quantity Controls */}
                  <div className="flex items-center border rounded-lg overflow-hidden bg-background h-8 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-full flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-75 cursor-pointer"
                    >
                      <MinusIcon className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, Number(e.target.value) || 1)}
                      className="w-8 text-center text-xs font-bold bg-transparent focus:outline-none h-full border-none p-0"
                    />
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-full flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-all active:scale-75 cursor-pointer"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Item Discount Input */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">Disc ₹:</span>
                      <input
                        type="number"
                        value={item.discount || 0}
                        onChange={(e) => updateItemDiscount(item.productId, Number(e.target.value) || 0)}
                        className="w-14 h-8 px-1.5 border rounded-lg text-xs text-center bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                      />
                    </div>

                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-8 h-8 flex items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors active:scale-75 cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary Totals & Checkout Actions */}
      <div className="p-4 border-t bg-card space-y-3 shrink-0">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {gstEnabled && (
            <div className="flex justify-between text-muted-foreground">
              <span>GST Tax (CGST + SGST)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-muted-foreground py-0.5">
            <span>Bill Discount (₹)</span>
            <input
              type="number"
              value={billDiscountInput}
              onChange={(e) => handleBillDiscountChange(e.target.value)}
              className="w-20 px-2 py-0.5 border rounded text-right font-semibold bg-background text-foreground"
            />
          </div>

          <div className="flex justify-between text-muted-foreground text-[11px]">
            <span>Round Off</span>
            <span>{roundOff >= 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t font-bold text-lg text-foreground">
            <span>Grand Total</span>
            <span className="text-primary text-xl font-extrabold">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            onClick={onHoldBill}
            disabled={items.length === 0}
            className="w-full font-semibold border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
          >
            ⏸ Hold (F4)
          </Button>
          <Button
            onClick={onOpenPayment}
            disabled={items.length === 0}
            className="w-full font-bold bg-primary text-primary-foreground text-base shadow-md hover:scale-[1.02] transition-transform"
          >
            💳 Pay (F6)
          </Button>
        </div>
      </div>
    </div>
  );
}
