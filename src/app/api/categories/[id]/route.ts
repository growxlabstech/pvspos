import { NextResponse } from 'next/server';
import { categoryService } from '@/features/categories/services/category.service';
import { updateCategorySchema } from '@/features/categories/schemas/category.schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const category = await categoryService.getById(resolvedParams.id);
    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const body = await req.json();
    const validatedData = updateCategorySchema.parse(body);

    const category = await categoryService.update(resolvedParams.id, validatedData);
    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    await categoryService.delete(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
