import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { updateSettingsSchema } from '@/features/settings/schemas/settings.schema';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || '',
          fullName: user.user_metadata?.full_name || 'Store Admin',
          storeName: 'PVS Retail Supermarket',
          currency: 'INR',
          taxRate: 18.0,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        fullName: validation.data.fullName,
        storeName: validation.data.storeName,
        storeAddress: validation.data.storeAddress || null,
        phone: validation.data.phone || null,
        gstNumber: validation.data.gstNumber || null,
        currency: validation.data.currency,
        taxRate: validation.data.taxRate,
      },
      create: {
        id: user.id,
        email: user.email || '',
        fullName: validation.data.fullName,
        storeName: validation.data.storeName,
        storeAddress: validation.data.storeAddress || null,
        phone: validation.data.phone || null,
        gstNumber: validation.data.gstNumber || null,
        currency: validation.data.currency,
        taxRate: validation.data.taxRate,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error: any) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
