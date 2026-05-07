import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { image, code, jobRole } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // Convert base64 to parts for Gemini
    const imageData = image.split(",")[1];
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a helpful AI interview companion. 
    Look at the screen capture provided (this is the candidate's coding screen).
    The candidate is applying for the role: ${jobRole}.
    Current code written so far:
    \`\`\`
    ${code}
    \`\`\`

    Provide a VERY BRIEF, encouraging piece of advice (max 2 sentences). 
    If they are doing well, encourage them. If they seem stuck or are making a clear algorithmic error, suggest a small hint WITHOUT giving the full solution.
    Keep the tone like a supportive mentor.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    return NextResponse.json({ advice: response.text() });
  } catch (error: any) {
    console.error("Vision AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
