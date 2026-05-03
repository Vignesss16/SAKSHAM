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

    const systemPrompt = `You are a professional AI interviewer conducting a ${difficulty || 'Mid-Level'} ${interviewType || 'General'} interview for the role of ${jobTitle || 'Candidate'} at ${targetCompany || 'the company'}.

--- CANDIDATE RESUME ---
${resumeText || 'No resume provided.'}

--- JOB DESCRIPTION ---
${jdText || 'No job description provided.'}

--- STRICT INTERVIEW INSTRUCTIONS ---
You must follow these rules absolutely:
1. QUESTION ALLOCATION: You must ask exactly 5 questions in total during this interview. Time is important.
   - Exactly 2 questions must be derived from the candidate's Resume.
   - Exactly 3 questions must be derived from the Job Description.
2. INTERVIEW FLOW:
   - When the user is ready, immediately ask Question 1.
   - Ask ONLY ONE question at a time.
   - After asking a question, STOP speaking and WAIT for the user to answer.
   - When the user answers, give a brief, natural acknowledgement (1-2 sentences), then immediately ask the next question.
3. NATURAL CONVERSATION: Do not announce question numbers or sources (e.g., NEVER say "Moving to your resume" or "Question 2"). Keep your tone conversational, human-like, and professional. Avoid lengthy monologues.
4. CLOSING THE INTERVIEW: After the user has answered the 5th and final question, you must give a brief acknowledgement and immediately end the interview with this specific closing statement:
"Thank you for your time and responses. That concludes this part of the interview. We will now be moving on to the next round, which is the coding round."
DO NOT ask any further questions after the closing statement.`;

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
