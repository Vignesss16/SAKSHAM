import { NextRequest, NextResponse } from 'next/server';

// JDoodle Language Mapping
const JDOODLE_MAP: Record<string, { language: string, versionIndex: string }> = {
  "JavaScript": { language: "nodejs",  versionIndex: "4" }, // Node.js 18.15.0
  "Python":     { language: "python3", versionIndex: "4" }, // Python 3.10.0
  "Java":       { language: "java",    versionIndex: "4" }, // JDK 17.0.1
  "C++":        { language: "cpp17",   versionIndex: "1" }, // g++ 17
  "Go":         { language: "go",      versionIndex: "4" }, // Go 1.19
  "Rust":       { language: "rust",    versionIndex: "4" }, // Rust 1.68.2
};

export async function POST(req: NextRequest) {
  try {
    const { language, code } = await req.json();

    if (!language || !code) {
      return NextResponse.json({ error: 'Missing language or code' }, { status: 400 });
    }

    const jdoodleConfig = JDOODLE_MAP[language];
    if (!jdoodleConfig) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const clientId = process.env.JDOODLE_CLIENT_ID;
    const clientSecret = process.env.JDOODLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ error: 'JDoodle credentials not configured.' }, { status: 500 });
    }

    // JDoodle Execution API
    const response = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: clientId,
        clientSecret: clientSecret,
        script: code,
        language: jdoodleConfig.language,
        versionIndex: jdoodleConfig.versionIndex,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `JDoodle Error: ${errText}` }, { status: response.status });
    }

    const result = await response.json();

    // JDoodle returns { output, statusCode, memory, cpuTime }
    // If there's a compilation error, it's usually in the output string
    return NextResponse.json({
      stdout: result.statusCode === 200 ? result.output : null,
      stderr: result.statusCode !== 200 ? result.output : null,
      status: result.statusCode === 200 ? 'Accepted' : 'Error',
      time: result.cpuTime,
      memory: result.memory,
    });

  } catch (error: any) {
    console.error('Run Code API Error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }
}
