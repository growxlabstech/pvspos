import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4 shadow-lg">
            P
          </div>
          <h1 className="text-2xl font-bold">PVS POS</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Modern Point of Sale System
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} PVS POS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
