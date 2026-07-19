import { NextResponse } from 'next/server';
import { productService } from '@/features/products/services/product.service';
import { updateProductSchema } from '@/features/products/schemas/product.schema';
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
    const product = await productService.getById(resolvedParams.id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(product);
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
    const validatedData = updateProductSchema.parse(body);

    const product = await productService.update(resolvedParams.id, validatedData);
    return NextResponse.json(product);
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
    await productService.delete(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
