import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PVS POS — Modern Point of Sale',
    template: '%s | PVS POS',
  },
  description:
    'Modern, secure, lightning-fast Point of Sale system for retail businesses.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.75rem',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
