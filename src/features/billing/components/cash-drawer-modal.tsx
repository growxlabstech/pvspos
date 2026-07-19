'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface CashDrawerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashDrawerModal({ open, onOpenChange }: CashDrawerModalProps) {
  const [openingBalance, setOpeningBalance] = useState('2000');
  const [cashIn, setCashIn] = useState('0');
  const [cashOut, setCashOut] = useState('0');
  const [notes, setNotes] = useState('');

  const systemCashSales = 4500.0;
  const expectedTotal = Number(openingBalance) + Number(cashIn) - Number(cashOut) + systemCashSales;

  const handleSaveDrawer = () => {
    toast.success('Cash Drawer Shift Report updated!');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>💵 Cash Drawer Shift Management</span>
          </DialogTitle>
          <DialogDescription>
            Record shift opening cash, pay-ins, float withdrawals, and check register balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold">Opening Float (₹)</label>
              <Input
                type="number"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Today's Cash Sales (System)</label>
              <Input value={formatCurrency(systemCashSales)} disabled className="bg-muted font-bold" />
            </div>
            <div>
              <label className="text-xs font-semibold">Cash In / Add Float (₹)</label>
              <Input
                type="number"
                value={cashIn}
                onChange={(e) => setCashIn(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold">Cash Out / Drop (₹)</label>
              <Input
                type="number"
                value={cashOut}
                onChange={(e) => setCashOut(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border bg-accent/30 space-y-1">
            <p className="text-xs text-muted-foreground uppercase font-bold">Expected Drawer Balance</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(expectedTotal)}</p>
          </div>

          <div>
            <label className="text-xs font-semibold">Shift Audit Notes</label>
            <Input
              placeholder="e.g. Mid-day cash drop of ₹500 to safe"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDrawer}>Update Shift Report</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
