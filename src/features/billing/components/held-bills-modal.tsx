'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cart.store';
import { TrashIcon, ShoppingCartIcon } from '@/components/icons';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface HeldBillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HeldBillsModal({ open, onOpenChange }: HeldBillsModalProps) {
  const { heldBills, resumeBill, deleteHeldBill } = useCartStore();

  const handleResume = (id: string) => {
    resumeBill(id);
    toast.success('Held bill restored to active cart');
    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    deleteHeldBill(id);
    toast.info('Held bill deleted');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <span>⏸ Held Bills ({heldBills.length})</span>
          </DialogTitle>
          <DialogDescription>
            Resume or clear customer transactions held on hold.
          </DialogDescription>
        </DialogHeader>

        {heldBills.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No bills are currently on hold.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {heldBills.map((bill) => {
              const totalAmount = bill.items.reduce(
                (sum, i) => sum + i.price * i.quantity,
                0
              );
              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-xl border bg-card flex justify-between items-center hover:border-primary/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base">{bill.customerName}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {bill.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {bill.items.length} items • Total: {formatCurrency(totalAmount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleResume(bill.id)}
                      className="bg-primary text-primary-foreground font-semibold"
                    >
                      <ShoppingCartIcon className="w-3.5 h-3.5 mr-1" /> Resume
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(bill.id)}
                      className="text-danger hover:bg-danger/10"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
