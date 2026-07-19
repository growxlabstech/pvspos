'use client';

import { useState, useEffect } from 'react';
import { ProductSearch } from './product-search';
import { CartPanel } from './cart-panel';
import { PaymentDialog } from './payment-dialog';
import { ReceiptPreview } from './receipt-preview';
import { CustomerSelectorModal } from './customer-selector-modal';
import { HeldBillsModal } from './held-bills-modal';
import { CashDrawerModal } from './cash-drawer-modal';
import { HotkeysBar } from './hotkeys-bar';
import { useCartStore } from '@/stores/cart.store';
import { toast } from 'sonner';

export function BillingScreen() {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isHeldBillsOpen, setIsHeldBillsOpen] = useState(false);
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);

  const { items, holdBill, customer } = useCartStore();

  // Keyboard Shortcuts Listener (F2, F3, F4, F5, F6, F7, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
        if (searchInput) searchInput.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsCustomerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (items.length > 0) {
          holdBill(customer?.name);
          toast.info('Bill placed on hold (F4)');
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsHeldBillsOpen(true);
      } else if (e.key === 'F6' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        if (items.length > 0) setIsPaymentOpen(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (completedSale) setIsReceiptOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, customer, holdBill, completedSale]);

  const handleSaleSuccess = (saleData: any) => {
    setCompletedSale(saleData);
    setIsReceiptOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Top Action Header */}
      <div className="px-4 py-2 bg-card border-b flex justify-between items-center text-xs shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-primary">⚡ PVS POS Terminal 01</span>
          <span className="text-muted-foreground">• Active Shift: Morning</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCashDrawerOpen(true)}
            className="px-2.5 py-1 rounded-lg border bg-accent/30 hover:bg-accent text-foreground font-semibold cursor-pointer"
          >
            💵 Cash Drawer Report
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Product Catalog Column */}
        <div className="md:col-span-7 lg:col-span-8 h-full overflow-hidden">
          <ProductSearch />
        </div>

        {/* Right Active Cart Column */}
        <div className="md:col-span-5 lg:col-span-4 h-full overflow-hidden">
          <CartPanel
            onOpenPayment={() => setIsPaymentOpen(true)}
            onOpenCustomer={() => setIsCustomerOpen(true)}
            onHoldBill={() => {
              if (items.length > 0) {
                holdBill(customer?.name);
                toast.info('Bill placed on hold');
              }
            }}
          />
        </div>
      </div>

      {/* Bottom Keyboard Hotkeys Reference Bar */}
      <HotkeysBar
        onSearchFocus={() => {
          const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search"]');
          if (searchInput) searchInput.focus();
        }}
        onCustomerOpen={() => setIsCustomerOpen(true)}
        onHoldBill={() => {
          if (items.length > 0) {
            holdBill(customer?.name);
            toast.info('Bill placed on hold');
          }
        }}
        onResumeBill={() => setIsHeldBillsOpen(true)}
        onPaymentOpen={() => {
          if (items.length > 0) setIsPaymentOpen(true);
        }}
      />

      {/* Modals & Dialogs */}
      <CustomerSelectorModal
        open={isCustomerOpen}
        onOpenChange={setIsCustomerOpen}
      />

      <HeldBillsModal
        open={isHeldBillsOpen}
        onOpenChange={setIsHeldBillsOpen}
      />

      <CashDrawerModal
        open={isCashDrawerOpen}
        onOpenChange={setIsCashDrawerOpen}
      />

      <PaymentDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        onSuccess={handleSaleSuccess}
      />

      <ReceiptPreview
        open={isReceiptOpen}
        onOpenChange={setIsReceiptOpen}
        saleData={completedSale}
      />
    </div>
  );
}
