import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return Response.json({ message: 'Logged out successfully' });
  } catch {
    return Response.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
