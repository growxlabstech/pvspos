'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2Icon, CheckIcon } from '@/components/icons';
import { toast } from 'sonner';

interface ProductImageStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFile: File | null;
  existingImageUrl?: string;
  onEnhanced: (url: string) => void;
}

export function ProductImageStudio({
  open,
  onOpenChange,
  originalFile,
  existingImageUrl,
  onEnhanced,
}: ProductImageStudioProps) {
  const [step, setStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'after' | 'before'>('after');

  // Enhancement controls
  const [bgType, setBgType] = useState<'white' | 'transparent'>('white');
  const [brightness, setBrightness] = useState<number>(0); // -100 to 100
  const [contrast, setContrast] = useState<number>(0); // -100 to 100
  const [sharpen, setSharpen] = useState<number>(30); // 0 to 100
  const [tolerance, setTolerance] = useState<number>(35); // 10 to 100 (for bg removal)

  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const finalBlobRef = useRef<Blob | null>(null);

  // Load image preview url
  useEffect(() => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile);
      setOriginalPreviewUrl(url);
      setPreviewUrl('');
      setActiveTab('after');
      return () => URL.revokeObjectURL(url);
    } else if (existingImageUrl) {
      setOriginalPreviewUrl(existingImageUrl);
      setPreviewUrl('');
      setActiveTab('after');
    }
  }, [originalFile, existingImageUrl]);

  const processImage = async () => {
    if (!originalPreviewUrl) return;

    setIsProcessing(true);
    setStep('1. Loading image structure...');
    setProgress(15);

    // Create an image object to load
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = originalPreviewUrl;

    img.onload = () => {
      try {
        setStep('2. Analyzing product boundaries...');
        setProgress(35);

        const canvas = canvasRef.current || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');

        // Draw original image to sample pixels
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) throw new Error('Could not get temp context');
        tempCtx.drawImage(img, 0, 0);

        const width = img.naturalWidth;
        const height = img.naturalHeight;
        const imgData = tempCtx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample background from 4 corners (top-left, top-right, bottom-left, bottom-right)
        const sampleBgColor = (x: number, y: number) => {
          const idx = (y * width + x) * 4;
          return {
            r: data[idx] ?? 240,
            g: data[idx + 1] ?? 240,
            b: data[idx + 2] ?? 240,
          };
        };

        const bgSamples = [
          sampleBgColor(2, 2),
          sampleBgColor(width - 3, 2),
          sampleBgColor(2, height - 3),
          sampleBgColor(width - 3, height - 3),
        ];

        // 3. Find product bounding box (pixels that differ significantly from background samples)
        setStep('3. Extracting background & shadows...');
        setProgress(50);

        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;

        const isBackground = (r: number, g: number, b: number) => {
          return bgSamples.some((bg) => {
            const dist = Math.sqrt((r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2);
            return dist < tolerance;
          });
        };

        // Scan pixels to find bounding box of the product
        for (let y = 0; y < height; y += 4) { // step by 4 for performance
          for (let x = 0; x < width; x += 4) {
            const idx = (y * width + x) * 4;
            const r = data[idx] ?? 0;
            const g = data[idx + 1] ?? 0;
            const b = data[idx + 2] ?? 0;

            if (!isBackground(r, g, b)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Fallback if no bounds detected
        if (maxX <= minX || maxY <= minY) {
          minX = 0;
          minY = 0;
          maxX = width;
          maxY = height;
        }

        const prodW = maxX - minX;
        const prodH = maxY - minY;

        // 4. Center and scale onto 1024x1024 square canvas
        setStep('4. Centering product in catalog frame...');
        setProgress(70);

        const size = 1024;
        canvas.width = size;
        canvas.height = size;

        // Set background color
        if (bgType === 'white') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, size, size);
        } else {
          ctx.clearRect(0, 0, size, size);
        }

        // Calculate fitting scale (85% size)
        const maxDim = Math.max(prodW, prodH);
        const scale = (size * 0.85) / maxDim;
        const targetW = prodW * scale;
        const targetH = prodH * scale;
        const targetX = (size - targetW) / 2;
        const targetY = (size - targetH) / 2;

        // Draw cropped product onto square canvas
        ctx.drawImage(tempCanvas, minX, minY, prodW, prodH, targetX, targetY, targetW, targetH);

        // 5. Image Enhancement filters (Brightness, Contrast, Sharpness)
        setStep('5. Enhancing lighting and text clarity...');
        setProgress(85);

        const canvasData = ctx.getImageData(0, 0, size, size);
        const pixels = canvasData.data;

        // Apply Brightness/Contrast
        const bOffset = brightness;
        const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < pixels.length; i += 4) {
          const a = pixels[i + 3] ?? 255;
          if (a === 0) continue; // skip transparent background

          // Apply contrast/brightness per RGB channel
          for (let c = 0; c < 3; c++) {
            const val = pixels[i + c] ?? 0;
            let newVal = (val - 128) * cFactor + 128 + bOffset;
            pixels[i + c] = Math.max(0, Math.min(255, newVal));
          }
        }

        ctx.putImageData(canvasData, 0, 0);

        // Apply Sharpen Convolution Filter if enabled
        if (sharpen > 0) {
          const strength = sharpen / 100;
          const kEdge = -0.5 * strength;
          const kCenter = 1 + 2 * strength;
          // Sharpen Kernel
          const weights = [
             0,    kEdge, 0,
             kEdge, kCenter, kEdge,
             0,    kEdge, 0
          ];
          const side = 3;
          const halfSide = 1;

          const shData = ctx.getImageData(0, 0, size, size);
          const shPixels = shData.data;
          const outData = ctx.createImageData(size, size);
          const outPixels = outData.data;

          for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
              const sy = y;
              const sx = x;
              const dstOff = (y * size + x) * 4;

              // Copy alpha
              outPixels[dstOff + 3] = shPixels[dstOff + 3] ?? 255;
              if (outPixels[dstOff + 3] === 0) continue; // skip transparent bg

              let r = 0, g = 0, b = 0;
              for (let cy = 0; cy < side; cy++) {
                for (let cx = 0; cx < side; cx++) {
                  const scy = Math.min(size - 1, Math.max(0, sy + cy - halfSide));
                  const scx = Math.min(size - 1, Math.max(0, sx + cx - halfSide));
                  const srcOff = (scy * size + scx) * 4;
                  const wt = weights[cy * side + cx] ?? 0;

                  r += (shPixels[srcOff] ?? 0) * wt;
                  g += (shPixels[srcOff + 1] ?? 0) * wt;
                  b += (shPixels[srcOff + 2] ?? 0) * wt;
                }
              }

              outPixels[dstOff] = Math.max(0, Math.min(255, r));
              outPixels[dstOff + 1] = Math.max(0, Math.min(255, g));
              outPixels[dstOff + 2] = Math.max(0, Math.min(255, b));
            }
          }
          ctx.putImageData(outData, 0, 0);
        }

        // Save preview url
        canvas.toBlob((blob) => {
          if (blob) {
            finalBlobRef.current = blob;
            const preview = URL.createObjectURL(blob);
            setPreviewUrl(preview);
          }
          setIsProcessing(false);
          setStep('');
          setProgress(100);
        }, 'image/webp', 0.85);

      } catch (err: any) {
        console.error('[ImageStudio] Error processing image:', err.message);
        toast.error('Image processing failed: ' + err.message);
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      toast.error('Failed to load target image asset.');
      setIsProcessing(false);
    };
  };

  // Run automatically when first opening or parameters change
  useEffect(() => {
    if (open && originalPreviewUrl && !previewUrl && !isProcessing) {
      processImage();
    }
  }, [open, originalPreviewUrl]);

  const handleSave = async () => {
    const blob = finalBlobRef.current;
    if (!blob) {
      toast.error('No processed image to save.');
      return;
    }

    setIsProcessing(true);
    setStep('6. Uploading optimized WebP to store catalog...');
    setProgress(90);

    try {
      const fileName = originalFile ? originalFile.name.replace(/\.[^/.]+$/, '') : 'product';
      const file = new File([blob], `${fileName}_enhanced.webp`, { type: 'image/webp' });

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload enhanced image.');
      }

      onEnhanced(data.url);
      toast.success('✨ Product image enhanced successfully!');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload enhanced image.');
    } finally {
      setIsProcessing(false);
      setStep('');
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = `pvs_product_${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded WebP image locally!');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isProcessing && onOpenChange(v)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>✨ AI Product Image Studio</span>
          </DialogTitle>
        </DialogHeader>

        {isProcessing && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 bg-muted/20 border border-dashed rounded-xl my-4">
            <Loader2Icon className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold">{step || 'Processing image...'}</p>
            <div className="w-64 bg-muted rounded-full h-2 overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-4 flex-1">
            {/* 1. Preview Area */}
            <div className="md:col-span-2 flex flex-col space-y-3">
              <div className="flex bg-muted/40 p-1 rounded-lg self-start">
                <button
                  onClick={() => setActiveTab('after')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeTab === 'after'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Enhanced (After)
                </button>
                <button
                  onClick={() => setActiveTab('before')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    activeTab === 'before'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Original (Before)
                </button>
              </div>

              <div className="relative w-full aspect-square bg-muted/30 border rounded-xl overflow-hidden flex items-center justify-center">
                {activeTab === 'after' && previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Enhanced Product preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                {activeTab === 'before' && originalPreviewUrl && (
                  <img
                    src={originalPreviewUrl}
                    alt="Original Product"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
                {activeTab === 'after' && !previewUrl && (
                  <p className="text-xs text-muted-foreground">Generating preview...</p>
                )}
              </div>
            </div>

            {/* 2. Adjustment Controls */}
            <div className="flex flex-col space-y-4 border p-4 rounded-xl bg-card/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-2">Studio Controls</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Background Color</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={bgType === 'white' ? 'default' : 'outline'}
                    onClick={() => setBgType('white')}
                    className="flex-1 text-xs h-8"
                  >
                    White (#FFF)
                  </Button>
                  <Button
                    size="sm"
                    variant={bgType === 'transparent' ? 'default' : 'outline'}
                    onClick={() => setBgType('transparent')}
                    className="flex-1 text-xs h-8"
                  >
                    Transparent
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Background Tolerance</span>
                  <span className="font-mono text-primary">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Brightness</span>
                  <span className="font-mono text-primary">{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Contrast</span>
                  <span className="font-mono text-primary">{contrast > 0 ? `+${contrast}` : contrast}</span>
                </div>
                <input
                  type="range"
                  min="-60"
                  max="60"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Edge Sharpening</span>
                  <span className="font-mono text-primary">{sharpen}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sharpen}
                  onChange={(e) => setSharpen(Number(e.target.value))}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <Button onClick={processImage} variant="secondary" size="sm" className="w-full text-xs font-semibold h-8 mt-2 cursor-pointer">
                🔄 Re-enhance Image
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing || !previewUrl}
              onClick={handleDownload}
              className="text-xs font-medium cursor-pointer"
            >
              📥 Download WebP
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={() => onOpenChange(false)}
              className="text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isProcessing || !previewUrl}
              onClick={handleSave}
              className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Use Enhanced Image</span>
            </Button>
          </div>
        </div>
      </DialogContent>
      <canvas ref={canvasRef} className="hidden" />
    </Dialog>
  );
}
