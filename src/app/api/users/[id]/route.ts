import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { hasPermission, logAuditEvent } from '@/lib/auth/rbac';
import { getSessionUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/service';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.userId, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { fullName, roleId, branchId, phone, isActive, password } = body;

    const oldProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
    });

    if (!oldProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let passwordHash = undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // Update profile in database
    const updatedProfile = await prisma.profile.update({
      where: { id: targetUserId },
      data: {
        fullName: fullName !== undefined ? fullName : oldProfile.fullName,
        roleId: roleId !== undefined ? roleId : oldProfile.roleId,
        branchId: branchId !== undefined ? branchId : oldProfile.branchId,
        phone: phone !== undefined ? phone : oldProfile.phone,
        isActive: isActive !== undefined ? isActive : oldProfile.isActive,
        passwordHash: passwordHash !== undefined ? passwordHash : oldProfile.passwordHash,
      },
    });

    // Log the user update audit event
    await logAuditEvent(
      user.userId,
      'UPDATE',
      'Profile',
      targetUserId,
      oldProfile,
      updatedProfile
    );

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('PUT /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.userId, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
    });

    if (!oldProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const disabledProfile = await prisma.profile.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Log audit event
    await logAuditEvent(
      user.userId,
      'DELETE',
      'Profile',
      targetUserId,
      oldProfile,
      disabledProfile
    );

    return NextResponse.json({ message: 'User disabled successfully', profile: disabledProfile });
  } catch (error: any) {
    console.error('DELETE /api/users/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

