'use client';

import { useRouter } from 'next/navigation';
import { LogOutIcon, SettingsIcon, UserIcon } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MobileSidebar } from './mobile-sidebar';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to logout');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <MobileSidebar />
      </div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors cursor-pointer" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  U
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <SettingsIcon className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOutIcon className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
