import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { hasPermission, logAuditEvent } from '@/lib/auth/rbac';
import { getSessionUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/service';
import crypto from 'crypto';

export async function GET() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if caller has USERS_MANAGE permission
    const canManage = await hasPermission(user.userId, 'USERS_MANAGE');
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profiles = await prisma.profile.findMany({
      include: {
        appRole: {
          select: { name: true, code: true },
        },
        branch: {
          select: { name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(profiles);
  } catch (error: any) {
    console.error('GET /api/users error:', error);
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
    const { email, password, fullName, roleId, branchId, phone, storeName } = body;

    if (!email || !password || !fullName || !roleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const lowercaseEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.profile.findUnique({
      where: { email: lowercaseEmail },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email address already registered' }, { status: 400 });
    }

    // Hash the password with bcrypt (salt 12)
    const passwordHash = await hashPassword(password);
    const newUserId = crypto.randomUUID();

    // Create profile in database
    const profile = await prisma.profile.create({
      data: {
        id: newUserId,
        email: lowercaseEmail,
        fullName,
        roleId,
        branchId: branchId || null,
        phone: phone || null,
        storeName: storeName || 'PVS Retail Supermarket',
        passwordHash,
      },
    });

    // Log the user creation audit event
    await logAuditEvent(
      user.userId,
      'CREATE',
      'Profile',
      newUserId,
      null,
      { email: lowercaseEmail, fullName, roleId, branchId }
    );

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

