import { prisma } from '@/lib/prisma/client';

/**
 * Fetches all dynamic permission codes for a given user from the database.
 */
export async function getCurrentUserPermissions(userId: string): Promise<string[]> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
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

    if (!profile || !profile.appRole) {
      return [];
    }

    // If the role is SUPER_ADMIN, return all permissions from database
    if (profile.appRole.code === 'SUPER_ADMIN') {
      const allPerms = await prisma.appPermission.findMany({
        select: { code: true },
      });
      return allPerms.map((p) => p.code);
    }

    return profile.appRole.permissions.map((rp) => rp.permission.code);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
}

/**
 * Checks if a user has a specific permission code.
 */
export async function hasPermission(userId: string, permissionCode: string): Promise<boolean> {
  const permissions = await getCurrentUserPermissions(userId);
  return permissions.includes(permissionCode);
}

/**
 * Checks if a user has all of the specified permissions.
 */
export async function hasPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
  const permissions = await getCurrentUserPermissions(userId);
  return permissionCodes.every((code) => permissions.includes(code));
}

/**
 * Audit log logger. Logs security and administration events in database.
 */
export async function logAuditEvent(
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_RESET' | 'PERMISSION_CHANGE',
  entityType: string,
  entityId: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityType,
          entityId,
          oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : undefined,
          newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : undefined,
          ipAddress,
        },
      });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Enforces dynamic permission checks at the API Route level.
 */
export async function verifyPermission(permissionCode: string): Promise<{ userId: string } | null> {
  const { createSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const isAllowed = await hasPermission(user.id, permissionCode);
  if (!isAllowed) return null;

  return { userId: user.id };
}

