/**
 * AI Utility - Powered by Groq (Llama 3.3)
 * Switched to Groq because Gemini was returning persistent 404 errors.
 * maintains the same interface to keep the app working.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

async function callGroq(messages: any[], isJSON: boolean = false) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');

  console.log(`🚀 Groq Request (${isJSON ? 'JSON' : 'Text'})...`);
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages,
      temperature: 0.1,
      ...(isJSON ? { response_format: { type: "json_object" } } : {})
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Groq API Error ${response.status}`);
  }

  return data.choices[0].message.content;
}

export const geminiFlash = {
  model: MODEL,
  generateContent: async (prompt: any) => {
    const text = typeof prompt === 'string' ? prompt : (prompt.contents?.[0]?.parts?.[0]?.text || JSON.stringify(prompt));
    const resultText = await callGroq([{ role: 'user', content: text }]);
    return {
      response: {
        text: () => resultText
      }
    };
  },
  generateContentStream: async (config: any) => {
    // We'll perform a standard call for now to ensure stability, 
    // but return it as a stream to keep the Chat UI working.
    const messages = config.contents.map((c: any) => ({
      role: c.role === 'model' ? 'assistant' : 'user',
      content: c.parts[0].text
    }));

    const resultText = await callGroq(messages);

    return {
      stream: (async function* () {
        yield { text: () => resultText };
      })()
    };
  }
};

export const geminiPro = geminiFlash;

export async function generateJSON<T>(
  model: any,
  prompt: string
): Promise<T> {
  const resultText = await callGroq([{ role: 'user', content: prompt }], true);
  try {
    return JSON.parse(resultText) as T;
  } catch (e) {
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid JSON format from AI");
    return JSON.parse(jsonMatch[0]) as T;
  }
}

export async function generateText(
  model: any,
  prompt: string
): Promise<string> {
  return await callGroq([{ role: 'user', content: prompt }]);
}
