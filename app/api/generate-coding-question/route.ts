import { NextResponse } from 'next/server';
import { geminiFlash, generateJSON } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { jobTitle, targetCompany, difficulty } = await req.json();

    const isTechnical = (jobTitle || '').toLowerCase().includes('engineer') || 
                        (jobTitle || '').toLowerCase().includes('developer') || 
                        (jobTitle || '').toLowerCase().includes('tech') || 
                        (jobTitle || '').toLowerCase().includes('data');

    const prompt = isTechnical 
    ? `You are a technical interviewer for ${targetCompany || 'a tech company'}. 
    Generate a coding interview question for a ${difficulty || 'mid-level'} ${jobTitle || 'Software Engineer'} role.
    
    IMPORTANT: You must ONLY provide the function signature/boilerplate. DO NOT provide the actual solution logic. Leave the inside of the function empty with a comment like "// Write your code here".

    Return ONLY a JSON object with the exact following structure, no other text:
    {
      "title": "Problem Title",
      "description": "Full problem description, including any constraints and examples. Use markdown.",
      "languageSnippets": {
        "javascript": "function solve(args) {\\n  // Write your code here\\n}",
        "python": "def solve(args):\\n    # Write your code here\\n    pass",
        "java": "class Solution {\\n    public void solve() {\\n        // Write your code here\\n    }\\n}",
        "cpp": "#include <iostream>\\n\\nusing namespace std;\\n\\nint main() {\\n    // Write your code here\\n    return 0;\\n}"
      }
    }`
    : `You are a professional interviewer for ${targetCompany || 'the company'}. 
    Generate a written case study or professional challenge for a ${difficulty || 'mid-level'} ${jobTitle || 'Professional'} role.
    
    IMPORTANT: The user should draft a response, email, or strategy. 
    Provide a professional text template for them to fill out.

    Return ONLY a JSON object with the exact following structure, no other text:
    {
      "title": "Case Study Title",
      "description": "Full case study scenario or challenge description. Use markdown.",
      "languageSnippets": {
        "javascript": "// DRAFT YOUR RESPONSE BELOW\\n\\nDear Team,\\n\\n[Write your strategic response here]\\n\\nBest regards,\\nCandidate",
        "python": "# [ROLE-PLAY SCENARIO]\\n\\n# Draft your strategy or response here...",
        "java": "// [PROFESSIONAL CHALLENGE]\\n\\n// Draft your response here...",
        "cpp": "// [CASE STUDY RESPONSE]\\n\\n// Draft your response here..."
      }
    }`;

    const question = await generateJSON<any>(geminiFlash, prompt);

    return NextResponse.json(question);
  } catch (error: any) {
    console.error('Error generating coding question:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate coding question' }, { status: 500 });
  }
}
