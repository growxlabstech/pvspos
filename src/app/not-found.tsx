import Link from 'next/link';
import { FileQuestionIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
        <FileQuestionIcon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}
