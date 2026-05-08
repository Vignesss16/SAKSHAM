import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { geminiFlash, generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { code, language, transcript, variables } = await req.json();

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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let safeTranscript = transcript;
    if (!transcript || transcript.length === 0) {
      console.warn('Warning: Empty transcript received in generate-report');
      safeTranscript = [{ uid: 'agent', text: 'The user did not speak during this interview segment.' }];
    }
    
    // Fetch mentors to provide suggestions
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

    const isTechnical = (variables?.role || '').toLowerCase().includes('engineer') || 
                        (variables?.role || '').toLowerCase().includes('developer') || 
                        (variables?.role || '').toLowerCase().includes('tech') || 
                        (variables?.role || '').toLowerCase().includes('data');
    
    const isSales = (variables?.role || '').toLowerCase().includes('sales') || 
                    (variables?.role || '').toLowerCase().includes('marketing') || 
                    (variables?.role || '').toLowerCase().includes('business');

    const metricsLabels = isTechnical 
      ? ["Content Quality", "Clarity", "Confidence", "Technical Accuracy"]
      : isSales
        ? ["Value Proposition", "Persuasion & Negotiation", "Communication", "Strategic Thinking"]
        : ["Behavioral Alignment", "Cultural Fit", "Empathy", "Clarity"];

    const prompt = `You are an expert interviewer evaluating a candidate for a ${isTechnical ? 'Technical' : isSales ? 'Sales' : 'Professional'} role.
    
    Job Details:
    Role: ${variables?.role || 'Professional'}
    Company: ${variables?.company || 'Organization'}
    Difficulty: ${variables?.difficulty || 'Mid-Level'}
    
    Conversation Transcript:
    ${JSON.stringify(safeTranscript, null, 2)}
    
    Round 2 Submission (Language/Context: ${language || 'N/A'}):
    ${code || 'No submission.'}
    
    Analyze the candidate's performance across technical/role-specific, behavioral, and communication skills.
    Generate a detailed JSON report with the exact structure below. 
    
    IMPORTANT: Use the following metrics for the metrics array: ${JSON.stringify(metricsLabels)}
    
    Return ONLY a JSON object:
    {
      "overallScore": 85,
      "summary": "A brief 2-3 sentence summary.",
      "metrics": [
        { "label": "${metricsLabels[0]}", "score": 88, "note": "Note" },
        { "label": "${metricsLabels[1]}", "score": 75, "note": "Note" },
        { "label": "${metricsLabels[2]}", "score": 92, "note": "Note" },
        { "label": "${metricsLabels[3]}", "score": 80, "note": "Note" }
      ],
      "strengths": [
        { "title": "Strength Title", "desc": "Strength Description" }
      ],
      "improvements": [
        { "title": "Improvement Title", "desc": "Improvement Description" }
      ],
      "suggestedMentors": [
        { "id": "mentor_uuid", "name": "Mentor Name", "reason": "Reason" }
      ]
    }
    
    Available Mentors to suggest from:
    ${JSON.stringify(mentorsList || [], null, 2)}`;

    const reportData = await generateJSON<any>(geminiFlash, prompt);

    // Embed the transcript into the report data so it is permanently saved in the database
    reportData.raw_transcript = safeTranscript;

    // Save to database
    const { data: insertData, error: dbError } = await supabase
      .from('interviews')
      .insert([
        {
          user_id: user.id,
          title: `Mock Interview: ${variables?.company || 'General'} - ${variables?.role || 'Software Engineer'}`,
          score: reportData.overallScore,
          feedback: reportData.summary,
          report_data: reportData,
        }
      ])
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save interview to database');
    }

    // Calculate credits based on score
    const score = reportData.overallScore || 0;
    let creditsEarned = 100;
    if (score >= 90) creditsEarned = 1000;
    else if (score >= 70) creditsEarned = 500;
    else if (score >= 40) creditsEarned = 300;
    else creditsEarned = 100;

    // Award credits
    try {
      await supabase.rpc('increment_credits', {
        user_id_input: user.id,
        amount: creditsEarned,
      });
    } catch (creditsError) {
      console.error('Failed to award credits:', creditsError);
      // Non-fatal — don't fail the whole request
    }

    // Issue certificate if score >= 75
    let certificateId = null;
    if (reportData.overallScore >= 75) {
      const certId = 'SAKSHAM-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .insert([
          {
            certificate_id: certId,
            user_id: user.id,
            interview_id: insertData.id,
            issue_date: new Date().toISOString(),
            is_valid: true,
          }
        ])
        .select('id')
        .single();
        
      if (!certError && certData) {
        certificateId = certData.id;
      } else {
        console.error('Failed to issue certificate:', certError);
      }
    }

    // Trigger n8n webhook if URL is present
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            interviewId: insertData.id,
            report: reportData,
            variables
          }),
        });
      } catch (webhookError) {
        console.error('Failed to trigger n8n webhook:', webhookError);
      }
    }

    return NextResponse.json({ id: insertData.id, report: reportData, creditsEarned });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
