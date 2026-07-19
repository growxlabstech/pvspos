'use client';

interface HotkeysBarProps {
  onSearchFocus: () => void;
  onCustomerOpen: () => void;
  onHoldBill: () => void;
  onResumeBill: () => void;
  onPaymentOpen: () => void;
}

export function HotkeysBar({
  onSearchFocus,
  onCustomerOpen,
  onHoldBill,
  onResumeBill,
  onPaymentOpen,
}: HotkeysBarProps) {
  return (
    <div className="hidden md:flex bg-card border-t px-4 py-2 items-center justify-between text-xs text-muted-foreground overflow-x-auto gap-4 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <button
          onClick={onSearchFocus}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono font-bold text-foreground">F2</kbd>
          <span>Search</span>
        </button>
        <button
          onClick={onCustomerOpen}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono font-bold text-foreground">F3</kbd>
          <span>Customer</span>
        </button>
        <button
          onClick={onHoldBill}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono font-bold text-foreground">F4</kbd>
          <span>Hold Bill</span>
        </button>
        <button
          onClick={onResumeBill}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono font-bold text-foreground">F5</kbd>
          <span>Resume Bill</span>
        </button>
        <button
          onClick={onPaymentOpen}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px] font-mono font-bold text-foreground">F6 / Ctrl+S</kbd>
          <span>Checkout</span>
        </button>
      </div>

      <div className="hidden md:flex items-center gap-3 font-mono text-[11px]">
        <span>⚡ POS Billing Engine V2</span>
      </div>
    </div>
  );
}
