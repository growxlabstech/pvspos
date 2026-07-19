import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearAuthCookies } from '@/lib/auth/session';
import { logoutUser } from '@/lib/auth/service';

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const refreshToken = request.cookies.get('pvs_refresh_token')?.value;

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const isMobile = /mobile/i.test(userAgent);
    const device = isMobile ? 'Mobile Device' : 'Desktop Browser';

    if (user && refreshToken) {
      await logoutUser(user.userId, refreshToken, { ip, userAgent, device });
    }

    // Clear HTTP-only cookies
    await clearAuthCookies();

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
