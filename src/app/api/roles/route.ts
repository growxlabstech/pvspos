import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { hasPermission, logAuditEvent } from '@/lib/auth/rbac';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = await prisma.appRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('GET /api/roles error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.userId, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, permissionIds } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().replace(/\s+/g, '_');

    // Create the Role
    const newRole = await prisma.appRole.create({
      data: {
        name,
        code: cleanCode,
        description,
      },
    });

    // Assign Role-Permissions if provided
    if (Array.isArray(permissionIds) && permissionIds.length > 0) {
      const relationData = permissionIds.map((pId: string) => ({
        roleId: newRole.id,
        permissionId: pId,
      }));

      await prisma.rolePermission.createMany({
        data: relationData,
      });
    }

    await logAuditEvent(
      user.userId,
      'CREATE',
      'AppRole',
      newRole.id,
      null,
      { name, code: cleanCode, description, permissionIds }
    );

    return NextResponse.json(newRole);
  } catch (error: any) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.userId, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { roleId, name, description, permissionIds } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'roleId is required' }, { status: 400 });
    }

    const oldRole = await prisma.appRole.findUnique({
      where: { id: roleId },
      include: { permissions: true },
    });

    if (!oldRole) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Update Role details
    const updatedRole = await prisma.appRole.update({
      where: { id: roleId },
      data: {
        name: name !== undefined ? name : oldRole.name,
        description: description !== undefined ? description : oldRole.description,
      },
    });

    // Sync Permissions if provided
    if (Array.isArray(permissionIds)) {
      // Clear old permissions first
      await prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Insert new permissions
      if (permissionIds.length > 0) {
        const relationData = permissionIds.map((pId: string) => ({
          roleId,
          permissionId: pId,
        }));

        await prisma.rolePermission.createMany({
          data: relationData,
        });
      }
    }

    await logAuditEvent(
      user.userId,
      'PERMISSION_CHANGE',
      'AppRole',
      roleId,
      oldRole,
      { name, description, permissionIds }
    );

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error('PUT /api/roles error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

