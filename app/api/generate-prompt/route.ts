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

    const isTechnical = (interviewType || '').toLowerCase().includes('technical');
    const isSales = (interviewType || '').toLowerCase().includes('sales') || (jobTitle || '').toLowerCase().includes('sales');
    const isHR = (interviewType || '').toLowerCase().includes('hr') || (interviewType || '').toLowerCase().includes('culture');

    const persona = isTechnical ? "Rigorous Technical Interviewer" : 
                    isSales ? "Strategic Sales Director" : 
                    isHR ? "Senior HR Manager" : "Professional Interviewer";

    const framework = isTechnical ? "technical depth and problem-solving" : 
                      isSales ? "persuasion, resilience, and SPIN selling techniques" : 
                      isHR ? "emotional intelligence, culture fit, and behavioral alignment" : "professional competence";

    const systemPrompt = `You are a ${persona} conducting a ${difficulty || 'Mid-Level'} ${interviewType || 'General'} interview for the role of ${jobTitle || 'Candidate'} at ${targetCompany || 'the company'}.
Your evaluation focus is on ${framework}.

--- CANDIDATE RESUME ---
${resumeText || 'No resume provided.'}

--- JOB DESCRIPTION ---
${jdText || 'No job description provided.'}

--- STRICT INTERVIEW INSTRUCTIONS ---
You must follow these rules absolutely. Failure to do so will break the interview system:
1. EXACTLY 5 QUESTIONS: You MUST ask exactly 5 distinct questions in total during this interview.
   - For non-technical roles, focus on case studies and role-play scenarios relevant to ${jobTitle}.
   - Exactly 2 questions must be derived from the candidate's Resume.
   - Exactly 3 questions must be derived from the Job Description.
2. INTERVIEW FLOW:
   - When the user is ready, immediately ask Question 1.
   - Ask ONLY ONE question at a time.
   - After asking a question, STOP speaking and WAIT for the user to answer.
   - When the user answers, give a brief, natural acknowledgement (1-2 sentences), then immediately ask the next question.
3. NATURAL CONVERSATION: Do not announce question numbers. Keep your tone conversational and role-appropriate.
4. USER REQUEST TO SKIP: If the user asks to move to the next phase, skip questions, or end this round, you MUST immediately stop. Use the EXACT closing statement from Rule 5.
5. CLOSING THE INTERVIEW: After the 5th question OR a skip request, you must give a brief acknowledgement and end with this EXACT closing statement:
"Thank you for your time and responses. That concludes this part of the interview. We will now be moving on to the next round."`;

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
