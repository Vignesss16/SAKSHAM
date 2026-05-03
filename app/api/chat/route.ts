import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash } from '@/lib/gemini';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

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
        contextText = interviews.map((inv, idx) => {
          return `Interview ${idx + 1}:
Title: ${inv.title}
Score: ${inv.score}/100
Date: ${inv.created_at}
Report: ${JSON.stringify(inv.report_data?.metrics || {})}
Strengths: ${JSON.stringify(inv.report_data?.strengths || [])}
Improvements: ${JSON.stringify(inv.report_data?.improvements || [])}
---`;
        }).join('\n');
      }
    }

    const systemPrompt = `You are an expert AI Career Coach for PrepAI.
Your goal is to guide the user in improving their interview performance.
Use the following context of their past interview reports to provide personalized, specific advice.

PAST INTERVIEW CONTEXT:
${contextText}

Answer the user's questions concisely and directly. Maintain a supportive and professional tone. Keep responses short and impactful.`;

    const chatHistory = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Inject system prompt into the first user message if it's the start, or prepend it
    const fullHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am ready to help.' }] },
      ...chatHistory
    ];

    const result = await geminiFlash.generateContentStream({
      contents: fullHistory,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(new TextEncoder().encode(chunkText));
            }
          }
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
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
