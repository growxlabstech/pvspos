import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  productName: string;
  sku?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  taxRate: number;
  quantity: number;
  unit: string;
  maxStock: number;
  discount?: number; // item level discount in currency or %
  notes?: string;
}

export interface CustomerInfo {
  id?: string;
  name: string;
  phone?: string;
  loyaltyPoints?: number;
}

export interface HeldBill {
  id: string;
  customerName?: string;
  timestamp: string;
  items: CartItem[];
  discount: number;
  customer: CustomerInfo | null;
}

interface CartStore {
  items: CartItem[];
  discount: number;
  customer: CustomerInfo | null;
  heldBills: HeldBill[];
  
  // Cart Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePrice: (productId: string, newPrice: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  setDiscount: (discount: number) => void;
  setCustomer: (customer: CustomerInfo | null) => void;
  clearCart: () => void;
  
  // Held Bills Actions
  holdBill: (customerName?: string) => void;
  resumeBill: (heldBillId: string) => void;
  deleteHeldBill: (heldBillId: string) => void;

  // Calculation Helpers
  getSubtotal: () => number;
  getItemDiscountsTotal: () => number;
  getTaxAmount: () => number;
  getRoundOff: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      discount: 0,
      customer: null,
      heldBills: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          const qtyToAdd = item.quantity || 1;

          if (existing) {
            const newQty = Math.min(existing.quantity + qtyToAdd, existing.maxStock > 0 ? existing.maxStock : 9999);
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: newQty } : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: Math.min(qtyToAdd, item.maxStock > 0 ? item.maxStock : 9999),
                discount: item.discount || 0,
                originalPrice: item.price,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId) {
              const maxAllowed = i.maxStock > 0 ? i.maxStock : 9999;
              return { ...i, quantity: Math.max(1, Math.min(quantity, maxAllowed)) };
            }
            return i;
          }),
        }));
      },

      updatePrice: (productId, newPrice) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, price: Math.max(0, newPrice) } : i
          ),
        }));
      },

      updateItemDiscount: (productId, discount) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, discount: Math.max(0, discount) } : i
          ),
        }));
      },

      updateItemNotes: (productId, notes) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, notes } : i
          ),
        }));
      },

      setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
      setCustomer: (customer) => set({ customer }),

      clearCart: () => set({ items: [], discount: 0, customer: null }),

      holdBill: (customerName) => {
        const state = get();
        if (state.items.length === 0) return;

        const newHeld: HeldBill = {
          id: `HOLD-${Date.now()}`,
          customerName: customerName || state.customer?.name || 'Walk-in Customer',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          items: [...state.items],
          discount: state.discount,
          customer: state.customer,
        };

        set((s) => ({
          heldBills: [...s.heldBills, newHeld],
          items: [],
          discount: 0,
          customer: null,
        }));
      },

      resumeBill: (heldBillId) => {
        const state = get();
        const target = state.heldBills.find((h) => h.id === heldBillId);
        if (!target) return;

        set((s) => ({
          items: target.items,
          discount: target.discount,
          customer: target.customer,
          heldBills: s.heldBills.filter((h) => h.id !== heldBillId),
        }));
      },

      deleteHeldBill: (heldBillId) => {
        set((s) => ({
          heldBills: s.heldBills.filter((h) => h.id !== heldBillId),
        }));
      },

      getSubtotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
          const itemPrice = item.price - (item.discount || 0);
          return sum + itemPrice * item.quantity;
        }, 0);
      },

      getItemDiscountsTotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + (item.discount || 0) * item.quantity, 0);
      },

      getTaxAmount: () => {
        const { items } = get();
        return items.reduce((sum, item) => {
          const itemSubtotal = (item.price - (item.discount || 0)) * item.quantity;
          return sum + (itemSubtotal * item.taxRate) / 100;
        }, 0);
      },

      getRoundOff: () => {
        const state = get();
        const rawTotal = state.getSubtotal() + state.getTaxAmount() - state.discount;
        const roundedTotal = Math.round(rawTotal);
        return Number((roundedTotal - rawTotal).toFixed(2));
      },

      getTotal: () => {
        const state = get();
        const rawTotal = state.getSubtotal() + state.getTaxAmount() - state.discount;
        return Math.max(0, Math.round(rawTotal));
      },

      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'pvs-pos-cart-storage',
      partialize: (state) => ({ heldBills: state.heldBills }),
    }
  )
);
