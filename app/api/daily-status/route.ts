import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if there is a completion for today
    // Check if there is a completion for today in IST
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
    
    const { data: completion, error } = await supabase
      .from('daily_completions')
      .select('id')
      .eq('user_id', user.id)
      .eq('completed_date', today)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching completion:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ completed: !!completion });

  } catch (error: any) {
    console.error('Daily Status API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
