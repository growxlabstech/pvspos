import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, required, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
