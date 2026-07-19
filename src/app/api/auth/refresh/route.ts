import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { signAccessToken, TokenPayload } from '@/lib/auth/jwt';
import { generateSecureToken } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { profile: { include: { appRole: true } } },
    });

    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const user = dbToken.profile;
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'User inactive' }, { status: 401 });
    }

    // Fetch user permissions
    let permissions: string[] = [];
    if (user.appRole) {
      if (user.appRole.code === 'SUPER_ADMIN') {
        const allPerms = await prisma.appPermission.findMany({ select: { code: true } });
        permissions = allPerms.map((p) => p.code);
      } else {
        const rolePerms = await prisma.rolePermission.findMany({
          where: { roleId: user.roleId || '' },
          include: { permission: true },
        });
        permissions = rolePerms.map((rp) => rp.permission.code);
      }
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.appRole?.code || user.role,
      permissions,
    };

    const newAccessToken = await signAccessToken(payload);
    
    // Rotate refresh token (generate a new one and revoke old one)
    const newRefreshTokenString = generateSecureToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: dbToken.id },
        data: { isRevoked: true },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshTokenString,
          userId: user.id,
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      accessToken: newAccessToken,
      newRefreshToken: newRefreshTokenString,
    });
  } catch (error: any) {
    console.error('Mobile Auth Token Refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
