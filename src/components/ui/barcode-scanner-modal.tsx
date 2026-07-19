'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onBarcodeDetected,
}: BarcodeScannerModalProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cooldownRef = useRef(false);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;

    setIsInitializing(true);
    setError(null);

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      const scanner = new Html5Qrcode('barcode-scanner-viewport', {
        verbose: false,
      });

      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Rear camera
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.5,
          disableFlip: false,
        },
        (decodedText: string) => {
          // Prevent rapid duplicate scans
          if (cooldownRef.current) return;
          cooldownRef.current = true;

          setLastScanned(decodedText);
          onBarcodeDetected(decodedText);

          // Play a subtle beep sound
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.frequency.value = 1200;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.15;
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
          } catch {}

          // Vibrate on mobile
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }

          // Cooldown to prevent rapid duplicate scans
          setTimeout(() => {
            cooldownRef.current = false;
          }, 1500);
        },
        () => {
          // Scan error (no barcode found in frame) — silent, expected
        }
      );

      setIsInitializing(false);
    } catch (err: any) {
      setIsInitializing(false);
      console.error('Barcode scanner error:', err);

      if (err?.toString?.().includes('NotAllowedError') || err?.toString?.().includes('Permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err?.toString?.().includes('NotFoundError')) {
        setError('No camera found on this device. Please use a device with a camera.');
      } else {
        setError('Could not start camera. Please check permissions and try again.');
      }
    }
  }, [onBarcodeDetected]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      // Small delay to ensure the DOM container is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
      setLastScanned(null);
      setError(null);
    }
  }, [open, startScanner, stopScanner]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl">📷</span>
            <span>Scan Barcode</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Point your camera at a product barcode to scan it automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full">
          {/* Camera Viewport */}
          <div
            id="barcode-scanner-viewport"
            ref={containerRef}
            className="w-full bg-black"
            style={{ minHeight: '300px' }}
          />

          {/* Initializing Overlay */}
          {isInitializing && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-10">
              <Loader2Icon className="w-10 h-10 text-primary animate-spin" />
              <p className="text-white text-sm font-medium animate-pulse">
                Starting camera...
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {error && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-10 p-6">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-white text-sm text-center font-medium">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Scanning Guide Overlay */}
          {!isInitializing && !error && (
            <div className="absolute inset-0 pointer-events-none z-[5]">
              {/* Corner brackets */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[150px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-primary rounded-br-lg" />

                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" style={{ top: '50%' }} />
              </div>
            </div>
          )}
        </div>

        {/* Last Scanned Result */}
        {lastScanned && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-green-600">Barcode Detected!</p>
              <p className="text-sm font-mono font-bold truncate">{lastScanned}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 pb-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
          >
            Close Scanner
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
