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
import { Loader2Icon, CheckIcon } from '@/components/icons';
import { toast } from 'sonner';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkImportDialog({ open, onOpenChange }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappedCount, setMappedCount] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setMappedCount(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      // Simulate AI Column Auto-Mapping & Duplicate Validation
      await new Promise((res) => setTimeout(res, 1200));
      setMappedCount(12);
      toast.success('AI mapped 12 products cleanly from import file!');
    } catch {
      toast.error('Failed to parse file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    toast.success('Successfully imported 12 products to catalog!');
    onOpenChange(false);
    setFile(null);
    setMappedCount(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📥 AI Bulk Import Catalog</DialogTitle>
          <DialogDescription>
            Upload a CSV, Excel, or PDF catalog. AI will automatically map product name, SKU, price, and tax columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.pdf"
            className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />

          {file && !mappedCount && (
            <Button onClick={handleAnalyze} disabled={isProcessing} className="w-full">
              {isProcessing && <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />}
              {isProcessing ? 'AI Auto-Mapping Columns...' : 'Analyze & Map Columns'}
            </Button>
          )}

          {mappedCount && (
            <div className="p-4 rounded-xl border bg-success/5 border-success/30 space-y-3">
              <div className="flex items-center gap-2 text-success font-bold text-sm">
                <CheckIcon className="w-4 h-4" />
                <span>12 Products Ready for Import</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Columns Mapped: Name → Product Name, MRP → Retail Price, HSN → HSN Code, Stock → Inventory Qty. 0 duplicates detected.
              </p>
              <Button onClick={handleImport} className="w-full bg-success text-success-foreground hover:bg-success/90">
                Confirm & Import 12 Products
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
