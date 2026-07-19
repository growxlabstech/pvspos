import { cookies } from 'next/headers';
import { verifyAccessToken, signAccessToken, TokenPayload } from './jwt';
import { prisma } from '@/lib/prisma/client';
import crypto from 'crypto';

const ACCESS_COOKIE_NAME = 'pvs_access_token';
const REFRESH_COOKIE_NAME = 'pvs_refresh_token';

/**
 * Get user information from cookies (verifying Access Token first, then attempting Refresh Token fallback).
 */
export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      return payload;
    }
  }

  // Fallback to refresh token
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    // Look up refresh token in database
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        profile: {
          include: {
            appRole: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      return null;
    }

    const user = dbToken.profile;
    if (!user || !user.isActive) {
      return null;
    }

    // Get permissions
    let permissions: string[] = [];
    if (user.appRole) {
      if (user.appRole.code === 'SUPER_ADMIN') {
        const allPerms = await prisma.appPermission.findMany({ select: { code: true } });
        permissions = allPerms.map((p) => p.code);
      } else {
        permissions = user.appRole.permissions.map((rp) => rp.permission.code);
      }
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.appRole?.code || user.role,
      permissions,
    };

    // Sign new access token
    const newAccessToken = await signAccessToken(payload);

    // Refresh access token cookie
    cookieStore.set(ACCESS_COOKIE_NAME, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    return payload;
  } catch (error) {
    console.error('Session refresh error:', error);
    return null;
  }
}

/**
 * Write access and refresh token cookies.
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false
) {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 minutes
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30 days or 7 days
  });
}

/**
 * Remove auth cookies.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

/**
 * Helper to generate a secure random token.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(40).toString('hex');
}
