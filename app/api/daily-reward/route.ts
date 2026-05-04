import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { questionId, code } = await req.json();

    if (!questionId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cookieStore = cookies();
    // Use Service Role Key to bypass RLS for updating credits if necessary, 
    // or just use user session if RLS allows users to update their own credits.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });

    // Authenticate user via anon key or token if passed, but since we are using cookies, 
    // we need to get the user session first.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const currentCredits = profile?.credits || 0;
    const newCredits = currentCredits + 1000;

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 });
    }

    // Log completion to prevent multiple rewards
    // Get today's date in IST
    const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })).toISOString().split('T')[0];
    const { error: insertError } = await supabase
      .from('daily_completions')
      .insert({ user_id: user.id, completed_date: today });

    if (insertError) {
      console.error('Error logging completion:', insertError);
      // We still return success since credits were added, but log the error
    }

    return NextResponse.json({ success: true, newCredits });

  } catch (error: any) {
    console.error('Daily Reward API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
