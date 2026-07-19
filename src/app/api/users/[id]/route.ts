import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { hasPermission, logAuditEvent } from '@/lib/auth/rbac';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.id, 'USERS_MANAGE');
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

    // Update in Supabase Auth if password or active status changes
    if (password || typeof isActive === 'boolean') {
      const authUpdates: any = {};
      if (password) authUpdates.password = password;
      if (typeof isActive === 'boolean') {
        // Toggle user ban/unban status in Supabase auth
        const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUserId,
          typeof isActive === 'boolean' ? { ban_duration: isActive ? 'none' : '1000h' } : {}
        );
        if (banError) {
          console.warn('Supabase Auth update error (non-fatal):', banError.message);
        }
      }
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
      },
    });

    // Log the user update audit event
    await logAuditEvent(
      user.id,
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManage = await hasPermission(user.id, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const oldProfile = await prisma.profile.findUnique({
      where: { id: targetUserId },
    });

    if (!oldProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Disable the user in both Supabase Auth and Local Profile
    await supabaseAdmin.auth.admin.updateUserById(targetUserId, { ban_duration: '1000h' });

    const disabledProfile = await prisma.profile.update({
      where: { id: targetUserId },
      data: { isActive: false },
    });

    // Log audit event
    await logAuditEvent(
      user.id,
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
