import { NextRequest, NextResponse } from 'next/server';
import { generateJSON, geminiFlash } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
    }

    const prompt = `
You are an expert interview coach. Analyze the following interview transcript.
Identify each question asked by the interviewer and the student's answer.
For each pair, provide:
1. The Question.
2. What the student actually said (summarized if very long).
3. The "Optimal Answer" (What they should have said to be placed at a top-tier company).
4. A brief "Coach's Note" on the gap between the two.

Transcript:
${transcript}

Return your response ONLY as a valid JSON object with the following structure:
{
  "comparisons": [
    {
      "question": "string",
      "studentSaid": "string",
      "optimalAnswer": "string",
      "coachNote": "string"
    }
  ]
}`;

    const result = await generateJSON<any>(geminiFlash, prompt);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Analyze Transcript API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
