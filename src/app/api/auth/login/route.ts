import { createSupabaseServerClient } from '@/lib/supabase/server';
import { loginSchema } from '@/features/auth/schemas/auth.schema';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid credentials', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
