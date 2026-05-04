import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash } from '@/lib/gemini';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { messages, isCompare, stream: shouldStream } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

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

    let contextText = "No previous interview history available.";

    if (user) {
      // Fetch last 3 interviews to use as context
      const { data: interviews } = await supabase
        .from('interviews')
        .select('title, score, report_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (interviews && interviews.length > 0) {
        contextText = interviews.map((inv) => {
          return `[REPORT TITLE: ${inv.title}]
Score: ${inv.score}/100
Date: ${new Date(inv.created_at).toLocaleDateString()}
Metrics: ${JSON.stringify(inv.report_data?.metrics || {})}
Strengths: ${JSON.stringify(inv.report_data?.strengths?.map((s: any) => s.title) || [])}
Improvements: ${JSON.stringify(inv.report_data?.improvements?.map((i: any) => i.title) || [])}
---`;
        }).join('\n');
      }
    }

    let systemPrompt = `You are an expert AI Career Coach for SAKSHAM.AI.
Your goal is to guide the user in improving their interview performance.
Use the following context of their past interview reports to provide personalized, specific advice.
CRITICAL: Always refer to interviews by their SPECIFIC TITLES (e.g., "Mock Interview: TCS - Data analyst") instead of saying "Interview 1" or "previous interview".
CRITICAL: Address the user directly as "You". DO NOT refer to them in the third person as "the candidate" or "the individual".

PAST INTERVIEW CONTEXT:
${contextText}

Answer the user's questions concisely and directly. Maintain a supportive and professional tone. Keep responses short and impactful.`;

    if (isCompare) {
      systemPrompt = `You are an expert AI Career Coach for SAKSHAM.AI.
CRITICAL: Perform a STRICT ONE-TO-ONE comparison between ONLY the two reports provided in the user message.
DO NOT reference any other interview history, even if it is available in the context.
Refer to each of the two reports by its FULL TITLE.
CRITICAL: Address the user directly as "You". DO NOT refer to them as "the candidate" or "the individual".
Provide a motivational, specific summary of their progress between these two specific points in time.
CRITICAL: You MUST append a structured JSON array at the very end of your response, wrapped exactly in __COMPARE_DATA__ tags.
The JSON array must contain objects with "metric" (string), "past" (number), and "current" (number).
Extract these metrics from the provided reports (e.g., Content Quality, Clarity, Confidence, Technical Accuracy).

Example format:
__COMPARE_DATA__
[
  { "metric": "Content Quality", "past": 75, "current": 88 },
  { "metric": "Clarity", "past": 70, "current": 80 }
]
__COMPARE_DATA__`;
    }

    const chatHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const fullHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am ready to help.' }] },
      ...chatHistory
    ];

    // Return JSON if dashboard requested it (non-streaming)
    if (isCompare && !shouldStream) {
      const result = await geminiFlash.generateContent({
        contents: fullHistory,
      });
      return NextResponse.json({ response: result.response.text() });
    }

    // Default to streaming for chatbot and dashboard comparisons (if requested)
    const finalStream = new ReadableStream({
      async start(controller) {
        try {
          if (isCompare) {
            // For comparisons, we generate all at once but stream it for the UI
            const result = await geminiFlash.generateContent({ contents: fullHistory });
            controller.enqueue(new TextEncoder().encode(result.response.text()));
          } else {
            // Normal chat uses streaming
            const result = await geminiFlash.generateContentStream({ contents: fullHistory });
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
          controller.error(err);
        }
      }
    });

    return new Response(finalStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
