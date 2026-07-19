import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { hasPermission, logAuditEvent } from '@/lib/auth/rbac';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Initialize admin client for creating/managing users
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if caller has USERS_MANAGE permission
    const canManage = await hasPermission(user.id, 'USERS_MANAGE');
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
    const { email, password, fullName, roleId, branchId, phone, storeName } = body;

    if (!email || !password || !fullName || !roleId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Supabase Auth using admin client
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !authData.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create user in Auth' }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Create profile in database
    const profile = await prisma.profile.create({
      data: {
        id: newUserId,
        email,
        fullName,
        roleId,
        branchId: branchId || null,
        phone: phone || null,
        storeName: storeName || 'PVS Retail Supermarket',
      },
    });

    // Log the user creation audit event
    await logAuditEvent(
      user.id,
      'CREATE',
      'Profile',
      newUserId,
      null,
      { email, fullName, roleId, branchId }
    );

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('POST /api/users error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
