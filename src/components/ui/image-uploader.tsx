'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { TrashIcon, PlusIcon, Loader2Icon, CheckIcon } from '@/components/icons';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ProductImageStudio } from '@/components/ui/product-image-studio';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function ImageUploader({ value, onChange, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Product Image Studio states
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioFile, setStudioFile] = useState<File | null>(null);
  const [openCameraOnInit, setOpenCameraOnInit] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file format. Please upload JPG, PNG, or WEBP images.');
      return false;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File is too large (${formatFileSize(file.size)}). Max limit is ${MAX_SIZE_MB} MB.`);
      return false;
    }
    return true;
  };

  const handleUpload = async (file: File) => {
    if (!validateFile(file)) return;

    // Launch the AI Studio with the selected file instead of direct upload
    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size),
    });
    setStudioFile(file);
    setOpenCameraOnInit(false);
    setIsStudioOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = () => {
    onChange('');
    setFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        /* Image Preview Box */
        <div className="relative group border rounded-xl p-3 bg-card flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted shrink-0">
            <Image
              src={value}
              alt="Product Preview"
              fill
              className="object-cover"
              sizes="80px"
              unoptimized
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-success mb-1">
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Image Uploaded</span>
            </div>
            <p className="text-sm font-medium truncate">
              {fileDetails?.name || 'Product Image'}
            </p>
            {fileDetails?.size && (
              <p className="text-xs text-muted-foreground">{fileDetails.size}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setStudioFile(null);
                setOpenCameraOnInit(false);
                setIsStudioOpen(true);
              }}
              disabled={disabled || isUploading}
              className="p-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Enhance image with AI"
            >
              ✨ AI Studio
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="p-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors cursor-pointer"
              title="Replace image"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="p-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
              title="Remove image"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 text-center outline-none',
            isDragging
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/40',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 py-3">
              <Loader2Icon className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm font-medium">Uploading image...</p>
              <div className="w-48 bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <PlusIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm font-semibold">
                  <span className="text-primary hover:underline">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2.5">
                  JPG, PNG, or WEBP (Max 5 MB)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudioFile(null);
                    setOpenCameraOnInit(true);
                    setIsStudioOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  📷 Take Photo with Camera
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Product Image Studio dialog */}
      <ProductImageStudio
        open={isStudioOpen}
        onOpenChange={setIsStudioOpen}
        originalFile={studioFile}
        existingImageUrl={value}
        openCameraOnInit={openCameraOnInit}
        onEnhanced={(url) => {
          onChange(url);
          setFileDetails(prev => prev || { name: 'Enhanced Product Image', size: 'Optimized WebP' });
        }}
      />
    </div>
  );
}
