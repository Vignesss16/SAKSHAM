import { CreateMLCEngine, MLCEngine, InitProgressReport } from "@mlc-ai/web-llm";

export class OfflineAIEngine {
  private engine: MLCEngine | null = null;
  private modelId = "Phi-3.5-mini-instruct-q4f16_1-MLC"; // Efficient & Powerful

  async initialize(onProgress: (report: InitProgressReport) => void) {
    if (this.engine) return this.engine;

    try {
      this.engine = await CreateMLCEngine(this.modelId, {
        initProgressCallback: onProgress,
      });
      return this.engine;
    } catch (error) {
      console.error("Offline AI Init Error:", error);
      throw error;
    }
  }

  async analyzeResume(resumeText: string) {
    if (!this.engine) throw new Error("Engine not initialized");

    const prompt = `You are a professional ATS Resume Analyzer. Analyze the following resume text and provide a JSON response with:
    1. A numerical score (0-100)
    2. List of 3 key strengths
    3. List of 3 key weaknesses
    4. 3 Actionable tips to improve.

    RESUME TEXT:
    ${resumeText}

    Return ONLY valid JSON.`;

    const messages = [
      { role: "system", content: "You are a helpful assistant that analyzes resumes. Output only JSON." },
      { role: "user", content: prompt },
    ];

    const reply = await this.engine.chat.completions.create({
      messages: messages as any,
      response_format: { type: "json_object" },
    });

    return JSON.parse(reply.choices[0].message.content || "{}");
  }
}

export const offlineAI = new OfflineAIEngine();
