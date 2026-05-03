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

    const prompt = `You are an expert technical interviewer evaluating a candidate.
    
    Job Details:
    Role: ${variables?.role || 'Software Engineer'}
    Company: ${variables?.company || 'Tech Company'}
    Difficulty: ${variables?.difficulty || 'Mid-Level'}
    
    Conversation Transcript:
    ${JSON.stringify(safeTranscript, null, 2)}
    
    Coding Round Submission (Language: ${language || 'N/A'}):
    ${code || 'No code submitted.'}
    
    Analyze the candidate's performance across technical, behavioral, and communication skills.
    Generate a detailed JSON report with the exact structure below. Do not include markdown formatting or backticks around the JSON.
    {
      "overallScore": 85,
      "summary": "A brief 2-3 sentence summary of the candidate's performance. Mention if they didn't speak or code.",
      "metrics": [
        { "label": "Content Quality", "score": 88, "note": "Short note" },
        { "label": "Clarity", "score": 75, "note": "Short note" },
        { "label": "Confidence", "score": 92, "note": "Short note" },
        { "label": "Technical Accuracy", "score": 80, "note": "Short note" }
      ],
      "strengths": [
        { "title": "Strength 1", "desc": "Description" },
        { "title": "Strength 2", "desc": "Description" },
        { "title": "Strength 3", "desc": "Description" }
      ],
      "improvements": [
        { "title": "Improvement 1", "desc": "Description" },
        { "title": "Improvement 2", "desc": "Description" },
        { "title": "Improvement 3", "desc": "Description" }
      ]
    }`;

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
      const { data: certData, error: certError } = await supabase
        .from('certificates')
        .insert([
          {
            user_id: user.id,
            interview_id: insertData.id,
            issue_date: new Date().toISOString(),
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
