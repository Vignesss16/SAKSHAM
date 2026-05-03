import { NextResponse } from 'next/server';
import { geminiFlash, generateJSON } from '@/lib/gemini';
// @ts-ignore
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;

    if (!resumeFile) {
      return NextResponse.json({ error: 'No resume uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    
    let resumeText = '';
    try {
      resumeText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, true);
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
      });
    } catch (err) {
      console.error("Failed to parse PDF", err);
      return NextResponse.json({ error: 'Failed to parse PDF file. Ensure it is a valid PDF document.' }, { status: 400 });
    }

    const prompt = `You are an expert AI recruiter and ATS system evaluator.
    Analyze the following resume text and provide a structured JSON response.
    
    Calculate an ATS score from 0-100 based on impact, keywords, structure, and formatting.
    Identify 3-5 key strengths of the candidate.
    Identify 3-5 lacking areas or weaknesses (e.g., missing metrics, generic descriptions).
    Provide 3-5 actionable tips to improve the resume.

    Resume Text:
    ${resumeText}

    Return ONLY a JSON object with the exact following structure, no other text or markdown block formatting around the JSON:
    {
      "score": 85,
      "strengths": ["Strong action verbs", "Clear project experience"],
      "weaknesses": ["Missing quantitative metrics", "Formatting might not be ATS friendly"],
      "tips": ["Add impact metrics (e.g., increased efficiency by X%)", "Use a standard font"]
    }`;

    const analysisResult = await generateJSON<any>(geminiFlash, prompt);

    return NextResponse.json(analysisResult);
  } catch (error: any) {
    console.error('Error analyzing resume:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze resume' }, { status: 500 });
  }
}
