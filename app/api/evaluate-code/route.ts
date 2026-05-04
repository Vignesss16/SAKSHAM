import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateJSON, geminiFlash } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { questionId, questionTitle, questionDescription, language, code } = await req.json();

    if (!questionId || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // AI Evaluation Prompt
    const prompt = `
You are a strict technical interviewer and automated code judge for a competitive programming platform.
The user has submitted code for a daily challenge. 
You must evaluate their code based on three main categories:
1. Functional Correctness (Max 400 points)
2. Time & Space Complexity (Max 300 points)
3. Code Style & Best Practices (Max 300 points)

The maximum total score is 1000 credits. 
You must provide a breakdown of how many points were earned in each category.
You must also list specific deductions for mistakes.

Problem Title: ${questionTitle}
Problem Description: ${questionDescription}
Language: ${language}
Submitted Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Return your response ONLY as a valid JSON object matching this exact structure:
{
  "score": number, // Total final score (sum of breakdown - deductions)
  "passed": boolean, // true if score >= 500
  "breakdown": {
    "correctness": number, // out of 400
    "complexity": number, // out of 300
    "style": number // out of 300
  },
  "deductions": [
    { "reason": "string (explanation)", "points": number (negative) }
  ],
  "feedback": "string (helpful, encouraging 2-3 sentence review)"
}`;

    // Use generateJSON for reliable structured output
    interface EvaluationResult {
      score: number;
      passed: boolean;
      breakdown: {
        correctness: number;
        complexity: number;
        style: number;
      };
      deductions: { reason: string; points: number }[];
      feedback: string;
    }

    let evaluation: EvaluationResult;
    try {
      evaluation = await generateJSON<EvaluationResult>(geminiFlash, prompt);
      // Enforce logic: passed = score >= 500
      evaluation.passed = evaluation.score >= 500;
    } catch (e) {
      console.error("Failed to get AI evaluation:", e);
      return NextResponse.json({ error: 'Failed to process AI evaluation' }, { status: 500 });
    }

    // Only update database if they passed
    if (evaluation.passed) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits + evaluation.score;

      await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);
    }

    return NextResponse.json(evaluation);

  } catch (error: any) {
    console.error('Evaluate API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
