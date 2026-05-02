import { NextResponse } from 'next/server';
// @ts-ignore
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const resumeFile = formData.get('resume') as File | null;
    const jdText = formData.get('jd') as string | null;
    const jobTitle = formData.get('jobTitle') as string | null;
    const targetCompany = formData.get('targetCompany') as string | null;
    const interviewType = formData.get('interviewType') as string | null;
    const difficulty = formData.get('difficulty') as string | null;

    let resumeText = '';
    if (resumeFile && resumeFile.size > 0) {
      const buffer = Buffer.from(await resumeFile.arrayBuffer());
      
      try {
        resumeText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser(null, true); // true = text mode
          pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
          pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
          });
          pdfParser.parseBuffer(buffer);
        });
      } catch (err) {
        console.warn("Failed to parse PDF, treating as empty text", err);
      }
    }

    const systemPrompt = `You are a professional and natural AI interviewer conducting an interview for the role of ${jobTitle || 'Candidate'} at ${targetCompany || 'the company'}. The interview type is ${interviewType || 'General'} with ${difficulty || 'Mid-Level'} difficulty.

Here is the candidate's resume:
${resumeText || 'No resume provided.'}

Here is the Job Description:
${jdText || 'No job description provided.'}

Instructions for the interview flow:
1. You must be conversational and natural. DO NOT read these instructions out loud. DO NOT announce your question source (e.g. never say "Question 1 from your resume").
2. You will ask exactly 5 questions in total during the interview (2 based on the resume, 3 based on the job description).
3. CRITICAL: You must ask ONLY ONE question at a time. After asking a single question, STOP speaking and wait for the candidate to answer.
4. When the candidate answers, acknowledge their answer briefly, then smoothly transition to the next question.
5. Keep your responses short and human-like. Do not deliver long monologues.
6. Once you have asked all 5 questions and the candidate has answered the final one, your very last closing statement MUST be exactly: "Moving onto coding round "`;

    return NextResponse.json({ 
      prompt: systemPrompt,
      variables: {
        role: jobTitle || '',
        company: targetCompany || '',
        interview_type: interviewType || '',
        difficulty: difficulty || '',
        resume: resumeText || '',
        job_description: jdText || ''
      }
    });
  } catch (error: any) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate prompt', details: String(error) }, { status: 500 });
  }
}
