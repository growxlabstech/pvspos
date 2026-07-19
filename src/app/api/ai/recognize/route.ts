import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { analyzeProductImage } from '@/lib/ai/vision-service';
import { prisma } from '@/lib/prisma/client';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Only JPG, PNG, and WEBP images are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5 MB.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform AI Recognition & Catalog Fuzzy Matching
    const result = await analyzeProductImage(buffer, file.type);

    // Save Recognition Attempt Log in Database
    let logId: string | undefined;
    try {
      const log = await prisma.aiRecognitionLog.create({
        data: {
          aiSuggestedName: result.suggestion.name,
          aiBrand: result.suggestion.brand,
          aiCategory: result.suggestion.category,
          aiConfidence: result.suggestion.confidence,
          matchedProductId: result.matchedProduct?.id || null,
        },
      });
      logId = log.id;
    } catch (logErr) {
      console.error('Failed to save AI recognition log:', logErr);
    }

    return NextResponse.json({
      ...result,
      logId,
    });
  } catch (error: any) {
    console.error('POST /api/ai/recognize error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
