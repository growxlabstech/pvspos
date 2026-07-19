import { NextResponse } from 'next/server';
import { productService } from '@/features/products/services/product.service';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const product = await productService.getByBarcode(resolvedParams.code);
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
