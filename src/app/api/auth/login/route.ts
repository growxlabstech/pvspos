import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/features/auth/schemas/auth.schema';
import { authenticateUser } from '@/lib/auth/service';
import { setAuthCookies } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Get IP and user-agent metadata
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const isMobile = /mobile/i.test(userAgent);
    const device = isMobile ? 'Mobile Device' : 'Desktop Browser';

    const { user, accessToken, refreshToken } = await authenticateUser(
      parsed.data.email,
      parsed.data.password,
      { ip, userAgent, device }
    );

    // Set HTTP-only secure cookies
    await setAuthCookies(accessToken, refreshToken, true);

    return NextResponse.json({
      data: {
        user,
      },
    });
  } catch (error: any) {
    console.error('Custom Auth POST Login error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 401 });
  }
}
