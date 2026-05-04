import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateJSON, geminiFlash } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing answers' }, { status: 400 });
    }

    const prompt = `
You are a senior hiring manager and behavioral interview coach.
Evaluate the following behavioral interview answers.
Use the STAR method (Situation, Task, Action, Result) as the gold standard.

Categories:
1. STAR Method Usage (Max 400)
2. Professionalism & Communication (Max 300)
3. Depth & Specificity (Max 300)

Max total score: 1000 credits.

Answers to Evaluate:
${answers.map((a, i) => `
Q${i+1}: ${a.question}
A${i+1}: ${a.answer}
`).join('\n')}

Return your response ONLY as a valid JSON object:
{
  "score": number,
  "passed": boolean, // true if score >= 500
  "breakdown": {
    "correctness": number, // Map STAR usage here
    "complexity": number, // Map Communication here
    "style": number // Map Depth here
  },
  "deductions": [
    { "reason": "string", "points": number (negative) }
  ],
  "feedback": "string (helpful coach advice)"
}`;

    const result = await generateJSON<any>(geminiFlash, prompt);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Evaluate Behavioral API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
