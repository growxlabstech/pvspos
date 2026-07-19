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
import { useCartStore, CustomerInfo } from '@/stores/cart.store';
import { UserIcon, PlusIcon, CheckIcon } from '@/components/icons';
import { toast } from 'sonner';

interface CustomerSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SAMPLE_CUSTOMERS: CustomerInfo[] = [
  { id: 'c1', name: 'Rajesh Kumar', phone: '9876543210', loyaltyPoints: 120 },
  { id: 'c2', name: 'Priya Sharma', phone: '9812345678', loyaltyPoints: 450 },
  { id: 'c3', name: 'Anil Verma', phone: '9988776655', loyaltyPoints: 85 },
];

export function CustomerSelectorModal({ open, onOpenChange }: CustomerSelectorModalProps) {
  const { customer: currentCustomer, setCustomer } = useCartStore();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filtered = SAMPLE_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  const handleSelect = (cust: CustomerInfo | null) => {
    setCustomer(cust);
    toast.success(cust ? `Assigned Customer: ${cust.name}` : 'Reset to Walk-in Customer');
    onOpenChange(false);
  };

  const handleCreateCustomer = () => {
    if (!name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    const newCust: CustomerInfo = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || undefined,
      loyaltyPoints: 0,
    };
    handleSelect(newCust);
    setName('');
    setPhone('');
    setIsCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" />
            <span>Select Customer</span>
          </DialogTitle>
          <DialogDescription>
            Attach customer details to invoice for credit tracking & loyalty points.
          </DialogDescription>
        </DialogHeader>

        {!isCreating ? (
          <div className="space-y-4 pt-1">
            <Input
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Default Walk-in option */}
              <div
                onClick={() => handleSelect(null)}
                className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                  !currentCustomer ? 'border-primary bg-primary/5' : 'hover:border-border'
                }`}
              >
                <div>
                  <p className="font-semibold text-sm">Walk-in Customer</p>
                  <p className="text-xs text-muted-foreground">Default guest billing</p>
                </div>
                {!currentCustomer && <CheckIcon className="w-4 h-4 text-primary" />}
              </div>

              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition-all ${
                    currentCustomer?.id === c.id ? 'border-primary bg-primary/5' : 'hover:border-border'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Phone: {c.phone || 'N/A'} • Points: {c.loyaltyPoints || 0} pts
                    </p>
                  </div>
                  {currentCustomer?.id === c.id && <CheckIcon className="w-4 h-4 text-primary" />}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" /> Create New Customer
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Customer Full Name *</label>
                <Input
                  placeholder="e.g. Ramesh Shah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Mobile Phone Number</label>
                <Input
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCustomer}>Save & Select</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
