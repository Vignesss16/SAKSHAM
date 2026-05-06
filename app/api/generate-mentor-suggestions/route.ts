import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { geminiFlash, generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { reportId } = await req.json();

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch the interview report
    const { data: interview, error: fetchError } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const reportData = interview.report_data || {};
    const improvements = reportData.improvements || [];

    if (improvements.length === 0) {
      return NextResponse.json({ error: 'No improvement areas found to match mentors.' }, { status: 400 });
    }

    // Fetch mentors
    const { data: mentorsList } = await supabase
      .from('mentors')
      .select(`
        user_id,
        company,
        job_role,
        experience_years,
        bio,
        profiles!inner (full_name)
      `);

    const prompt = `You are a career coach. Based on these areas where a candidate needs improvement:
    ${JSON.stringify(improvements, null, 2)}
    
    Suggest the 2 best mentors from this list:
    ${JSON.stringify(mentorsList || [], null, 2)}
    
    Return EXACTLY this JSON structure:
    {
      "suggestedMentors": [
        { "id": "mentor_uuid", "name": "Mentor Name", "reason": "Specific reason why they help with the improvements." }
      ]
    }`;

    const suggestions = await generateJSON<any>(geminiFlash, prompt);

    // Update the report in the database
    const updatedReportData = {
      ...reportData,
      suggestedMentors: suggestions.suggestedMentors
    };

    const { error: updateError } = await supabase
      .from('interviews')
      .update({ report_data: updatedReportData })
      .eq('id', reportId);

    if (updateError) throw updateError;

    return NextResponse.json({ suggestedMentors: suggestions.suggestedMentors });
  } catch (error: any) {
    console.error('Error generating suggestions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
