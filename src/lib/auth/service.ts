import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma/client';
import { signAccessToken } from './jwt';
import { generateSecureToken } from './session';
import { logAuditEvent } from './rbac';

const SALT_ROUNDS = 12;

/**
 * Encrypt a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare plain text password against stored hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

interface ClientMeta {
  ip?: string;
  userAgent?: string;
  device?: string;
}

/**
 * Authenticates a user by email and password, checks for lockouts, and generates custom JWT tokens.
 */
export async function authenticateUser(
  email: string,
  password: string,
  meta: ClientMeta
) {
  const lowercaseEmail = email.toLowerCase().trim();

  // 1. Account Lockout Check
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const recentAttempts = await prisma.loginHistory.findMany({
    where: {
      email: lowercaseEmail,
      createdAt: { gte: fifteenMinutesAgo },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const consecutiveFailures = recentAttempts.filter((att) => att.status !== 'SUCCESS').length;
  if (consecutiveFailures >= 5 && recentAttempts[0]?.status !== 'SUCCESS') {
    // Log failure attempt with LOCKOUT status
    await prisma.loginHistory.create({
      data: {
        email: lowercaseEmail,
        status: 'LOCKOUT',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        device: meta.device,
      },
    });
    throw new Error('Account locked due to consecutive login failures. Try again in 15 minutes.');
  }

  // 2. Fetch User Profile
  const profile = await prisma.profile.findUnique({
    where: { email: lowercaseEmail },
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
  });

  if (!profile) {
    // Log failed login
    await prisma.loginHistory.create({
      data: {
        email: lowercaseEmail,
        status: 'FAILED',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        device: meta.device,
      },
    });
    throw new Error('Invalid email or password.');
  }

  if (!profile.isActive) {
    throw new Error('Account is suspended. Please contact your system administrator.');
  }

  // 3. Verify Password Hash
  const isMatch = profile.passwordHash
    ? await comparePassword(password, profile.passwordHash)
    : false;

  if (!isMatch) {
    // Log failed attempt
    await prisma.loginHistory.create({
      data: {
        userId: profile.id,
        email: lowercaseEmail,
        status: 'FAILED',
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
        device: meta.device,
      },
    });
    throw new Error('Invalid email or password.');
  }

  // 4. Generate custom Access Token and Refresh Token
  let permissions: string[] = [];
  if (profile.appRole) {
    if (profile.appRole.code === 'SUPER_ADMIN') {
      const allPerms = await prisma.appPermission.findMany({ select: { code: true } });
      permissions = allPerms.map((p) => p.code);
    } else {
      permissions = profile.appRole.permissions.map((rp) => rp.permission.code);
    }
  }

  const payload = {
    userId: profile.id,
    email: profile.email,
    role: profile.appRole?.code || profile.role,
    permissions,
  };

  const accessToken = await signAccessToken(payload);
  const refreshTokenString = generateSecureToken();

  // Refresh token expires in 7 days
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId: profile.id,
      token: refreshTokenString,
      expiresAt: refreshExpires,
    },
  });

  // Store active Session record
  const sessionTokenString = generateSecureToken();
  const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Session cookie active for 1 day
  await prisma.session.create({
    data: {
      userId: profile.id,
      token: sessionTokenString,
      expiresAt: sessionExpires,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      device: meta.device,
    },
  });

  // Update lastLogin
  await prisma.profile.update({
    where: { id: profile.id },
    data: { lastLogin: new Date() },
  });

  // Log dynamic login success history
  await prisma.loginHistory.create({
    data: {
      userId: profile.id,
      email: lowercaseEmail,
      status: 'SUCCESS',
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
      device: meta.device,
    },
  });

  // Log successful login audit log
  await logAuditEvent(
    profile.id,
    'LOGIN',
    'Profile',
    profile.id,
    null,
    { email: lowercaseEmail, role: payload.role },
    meta.ip,
    meta.userAgent,
    meta.device
  );

  return {
    user: {
      id: profile.id,
      fullName: profile.fullName,
      email: profile.email,
      role: payload.role,
    },
    accessToken,
    refreshToken: refreshTokenString,
  };
}

/**
 * Handle custom secure logout, invalidating sessions.
 */
export async function logoutUser(userId: string, refreshToken: string, meta: ClientMeta) {
  try {
    // Revoke refresh token
    await prisma.refreshToken.updateMany({
      where: { userId, token: refreshToken },
      data: { isRevoked: true },
    });

    // Clean active sessions matching user & device
    await prisma.session.deleteMany({
      where: { userId, ipAddress: meta.ip },
    });

    await logAuditEvent(
      userId,
      'LOGOUT',
      'Profile',
      userId,
      null,
      null,
      meta.ip,
      meta.userAgent,
      meta.device
    );
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Generate password reset token and save in database.
 */
export async function forgotPassword(email: string): Promise<string | null> {
  const lowercaseEmail = email.toLowerCase().trim();
  const profile = await prisma.profile.findUnique({
    where: { email: lowercaseEmail },
  });

  if (!profile) return null;

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour token expiration

  await prisma.passwordResetToken.create({
    data: {
      userId: profile.id,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Reset user password with token verification.
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
    return false;
  }

  const newHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.profile.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { isUsed: true },
    }),
  ]);

  await logAuditEvent(
    resetRecord.userId,
    'PASSWORD_RESET',
    'Profile',
    resetRecord.userId,
    null,
    { status: 'SUCCESS' }
  );

  return true;
}

/**
 * Change profile password inside the app.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (!profile || !profile.passwordHash) return false;

  const isMatch = await comparePassword(currentPassword, profile.passwordHash);
  if (!isMatch) return false;

  const newHash = await hashPassword(newPassword);

  await prisma.profile.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await logAuditEvent(
    userId,
    'PASSWORD_RESET',
    'Profile',
    userId,
    null,
    { status: 'PASSWORD_CHANGE' }
  );

  return true;
}
