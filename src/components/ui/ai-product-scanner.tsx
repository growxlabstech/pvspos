'use client';

import { useState, useRef, ChangeEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon, CheckIcon, AlertTriangleIcon, PlusIcon, SearchIcon, ShoppingCartIcon } from '@/components/icons';
import { toast } from 'sonner';
import { AiRecognitionResponse } from '@/lib/ai/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface AiProductScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct?: (product: any) => void;
  onPreFillForm?: (suggestion: any) => void;
}

export function AiProductScanner({
  open,
  onOpenChange,
  onSelectProduct,
  onPreFillForm,
}: AiProductScannerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AiRecognitionResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResult(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/recognize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'AI Recognition failed');
      }

      setResult(data);
      toast.success('AI Recognition complete!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to recognize product');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPreviewUrl(null);
    setResult(null);
    setIsAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-primary font-bold text-lg">🤖 AI Vision Scanner</span>
          </DialogTitle>
          <DialogDescription>
            Upload or capture a product image to instantly recognize details or match catalog items.
          </DialogDescription>
        </DialogHeader>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {!previewUrl ? (
          /* Initial Upload Trigger */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <SearchIcon className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Scan Product with AI</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Click to select a photo from your computer or camera
            </p>
            <Button type="button" variant="outline">
              <PlusIcon className="w-4 h-4 mr-2" />
              Browse / Capture Image
            </Button>
          </div>
        ) : (
          /* Recognition in Progress or Results Display */
          <div className="space-y-5">
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted border flex items-center justify-center">
              <Image
                src={previewUrl}
                alt="Scan preview"
                fill
                className="object-contain p-2"
                unoptimized
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
                  <Loader2Icon className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-semibold animate-pulse">
                    AI Vision Analyzing Product Features...
                  </p>
                </div>
              )}
            </div>

            {result && (
              <div className="space-y-4">
                {/* Confidence Badge Header */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    {result.confidenceLevel === 'HIGH' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-success-light text-success flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5" /> High Confidence ({Math.round(result.suggestion.confidence * 100)}%)
                      </span>
                    )}
                    {result.confidenceLevel === 'MEDIUM' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning-light text-warning flex items-center gap-1">
                        <AlertTriangleIcon className="w-3.5 h-3.5" /> Moderate Confidence ({Math.round(result.suggestion.confidence * 100)}%)
                      </span>
                    )}
                    {result.confidenceLevel === 'LOW' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground flex items-center gap-1">
                        Low Match Confidence
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    Scan Another
                  </Button>
                </div>

                {/* AI Detected Details */}
                <div className="p-4 rounded-xl border bg-accent/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base">{result.suggestion.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Brand: <span className="font-medium text-foreground">{result.suggestion.brand}</span> | Category: <span className="font-medium text-foreground">{result.suggestion.category}</span>
                      </p>
                    </div>
                    {typeof result.suggestion.estimatedPrice === 'number' && result.suggestion.estimatedPrice > 0 && (
                      <span className="font-bold text-primary text-lg">
                        {formatCurrency(result.suggestion.estimatedPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Matching Catalog Product */}
                {result.matchedProduct ? (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Existing Catalog Match Found
                      </span>
                      <span className="text-xs text-muted-foreground">SKU: {result.matchedProduct.sku}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{result.matchedProduct.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Price: {formatCurrency(result.matchedProduct.price)} | Stock: {result.matchedProduct.inventory?.quantity || 0} {result.matchedProduct.unit}
                        </p>
                      </div>
                      {onSelectProduct && (
                        <Button
                          size="sm"
                          onClick={() => {
                            onSelectProduct(result.matchedProduct);
                            handleClose();
                          }}
                        >
                          <ShoppingCartIcon className="w-4 h-4 mr-1.5" />
                          Add to Bill
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-dashed text-center text-xs text-muted-foreground">
                    No matching catalog record found in database.
                  </div>
                )}

                {/* Form Action */}
                {onPreFillForm && (
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        onPreFillForm({
                          name: result.suggestion.name,
                          price: result.suggestion.estimatedPrice || 0,
                          unit: result.suggestion.unit,
                        });
                        handleClose();
                      }}
                    >
                      Pre-fill Product Form with AI Data
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
