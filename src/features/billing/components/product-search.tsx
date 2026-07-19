'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { SearchIcon, ScanBarcodeIcon } from '@/components/icons';
import { AiProductScanner } from '@/components/ui/ai-product-scanner';
import { BarcodeScannerModal } from '@/components/ui/barcode-scanner-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
}

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const addItem = useCartStore((state) => state.addItem);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Fetch Products based on search query & category filter
  useEffect(() => {
    const timer = setTimeout(() => {
      let url = '/api/products?';
      if (query.trim()) url += `search=${encodeURIComponent(query)}&`;
      if (selectedCategoryId) url += `categoryId=${selectedCategoryId}&`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            // Direct Barcode Match Auto-Add
            if (data.length === 1 && (data[0].barcode === query || data[0].sku === query)) {
              handleAddToCart(data[0]);
              setQuery('');
              toast.success(`Scanned: ${data[0].name}`);
            } else {
              setProducts(data);
              setSelectedIndex(0);
            }
          }
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, selectedCategoryId]);

  const handleAddToCart = (product: any) => {
    if (product.inventory && product.inventory.quantity <= 0) {
      toast.warning(`Warning: ${product.name} stock is depleted!`);
    }

    addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      price: Number(product.price),
      costPrice: Number(product.costPrice) || 0,
      taxRate: Number(product.taxRate) || 18,
      unit: product.unit || 'PIECE',
      maxStock: product.inventory?.quantity || 0,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && products[selectedIndex]) {
      e.preventDefault();
      handleAddToCart(products[selectedIndex]);
      toast.success(`Added ${products[selectedIndex].name}`);
    }
  };

  // Handle barcode detected from camera scanner
  const handleBarcodeDetected = useCallback(async (barcode: string) => {
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
      if (res.ok) {
        const product = await res.json();
        handleAddToCart(product);
        toast.success(`✅ Scanned: ${product.name}`);
        setIsCameraScannerOpen(false);
      } else {
        toast.error(`No product found for barcode: ${barcode}`);
      }
    } catch {
      toast.error('Failed to look up barcode. Please try again.');
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Search Input Bar */}
      <div className="p-3 border-b flex items-center gap-2 bg-card">
        <div className="relative flex-1 flex items-center">
          <SearchIcon className="absolute left-3 text-muted-foreground w-4 h-4" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name, SKU, barcode (F2)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-9 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          />
          <ScanBarcodeIcon className="absolute right-3 text-muted-foreground w-4 h-4" />
        </div>

        <Button
          onClick={() => setIsCameraScannerOpen(true)}
          variant="outline"
          size="sm"
          className="border-green-500/30 text-green-600 hover:bg-green-500/10 font-bold shrink-0 text-xs"
        >
          📷 Scan
        </Button>

        <Button
          onClick={() => setIsAiScannerOpen(true)}
          variant="outline"
          size="sm"
          className="border-primary/30 text-primary hover:bg-primary/10 font-bold shrink-0 text-xs"
        >
          🤖 AI Scan
        </Button>
      </div>

      {/* Category Touch Tabs */}
      <div className="px-3 py-2 border-b bg-muted/30 flex items-center gap-1.5 overflow-x-auto select-none shrink-0">
        <button
          onClick={() => setSelectedCategoryId(null)}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer ${
            !selectedCategoryId
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-card hover:bg-accent border-border text-foreground'
          }`}
        >
          All Items
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer ${
              selectedCategoryId === cat.id
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card hover:bg-accent border-border text-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Touch & Keyboard Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {products.map((product, idx) => {
            const isSelected = idx === selectedIndex;
            const isLowStock = (product.inventory?.quantity || 0) <= (product.lowStockThreshold || 5);

            return (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between bg-card hover:shadow-md select-none ${
                  isSelected ? 'ring-2 ring-primary border-primary shadow-md' : 'hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-foreground line-clamp-2 leading-snug">
                    {product.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                    {product.sku}
                  </div>
                </div>

                <div className="mt-2.5 flex justify-between items-end pt-2 border-t border-border/50">
                  <span className="font-bold text-sm text-primary">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isLowStock ? 'bg-danger/10 text-danger' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {product.inventory?.quantity || 0} {product.unit}
                  </span>
                </div>
              </div>
            );
          })}

          {products.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12 text-sm">
              No products found matching your search.
            </div>
          )}
        </div>
      </div>

      <AiProductScanner
        open={isAiScannerOpen}
        onOpenChange={setIsAiScannerOpen}
        onSelectProduct={(prod) => {
          handleAddToCart(prod);
          toast.success(`AI Selected: ${prod.name}`);
        }}
      />

      <BarcodeScannerModal
        open={isCameraScannerOpen}
        onOpenChange={setIsCameraScannerOpen}
        onBarcodeDetected={handleBarcodeDetected}
      />
    </div>
  );
}
