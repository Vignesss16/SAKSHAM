import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { credits } = await req.json();
    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get today's date in IST
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];

    // 1. Mark day as complete
    const { error: completeError } = await supabase
      .from('daily_completions')
      .insert({ user_id: user.id, completed_date: today });

    if (completeError) {
      if (completeError.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Already completed today' }, { status: 400 });
      }
      throw completeError;
    }

    // 2. Award credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    const currentCredits = profile?.credits || 0;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: currentCredits + credits })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Daily Complete API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
