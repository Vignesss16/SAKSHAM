"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface AnalysisResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
}

export default function ResumePage() {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [userName, setUserName] = useState("Student");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    if (name) setUserName(name);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setFileUploaded(true);
      setIsAnalyzing(true);
      setError("");
      setAnalysis(null);

      const formData = new FormData();
      formData.append("resume", file);

      try {
        const res = await fetch("/api/analyze-resume", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");

        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong during analysis");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const resetForm = () => {
    setFileUploaded(false);
    setFileName("");
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        {/* Upload Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">
              AI Resume Analyzer
            </h2>
            <p className="text-[#bbc9cf] text-base max-w-2xl">
              Upload your resume and our AI will analyze your profile, score it out of 100, and give you actionable tips to improve.
            </p>
          </div>

          {/* Drop Zone */}
          {!fileUploaded && (
            <div className="relative w-full h-72 border-2 border-dashed border-[#3c494e] rounded-xl bg-[#1a2123] flex flex-col items-center justify-center transition-all hover:border-[#00d1ff] group cursor-pointer">
              <input type="file" onChange={handleFileUpload} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="w-20 h-20 rounded-full bg-[#242b2e] flex items-center justify-center mb-6 group-hover:bg-[#00d1ff]/10 transition-colors">
                <span className="material-symbols-outlined text-4xl text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  upload_file
                </span>
              </div>
              <div className="text-center">
                <p className="font-['Plus_Jakarta_Sans'] text-xl font-semibold mb-2">Drag and drop your resume here</p>
                <p className="text-sm text-[#859399]">PDF only, up to 10 MB</p>
              </div>
              <button className="mt-8 px-8 py-3 bg-[#00d1ff] text-[#001f28] font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">
                Select File
              </button>
            </div>
          )}
        </section>

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <Loader2 className="w-12 h-12 text-[#00d1ff] animate-spin" />
            <p className="text-lg font-bold font-['Plus_Jakarta_Sans'] text-[#dde3e7] animate-pulse">Analyzing your resume...</p>
            <p className="text-sm text-[#859399]">Extracting skills, assessing impact, and calculating your score.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 p-6 rounded-xl flex items-start gap-4">
            <span className="material-symbols-outlined text-[#ffb4ab] mt-0.5">error</span>
            <div className="flex-1 space-y-2">
              <p className="text-base font-bold text-[#ffb4ab]">Analysis Failed</p>
              <p className="text-sm text-[#bbc9cf]">{error}</p>
              <button onClick={resetForm} className="mt-2 px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] rounded hover:bg-[#ffb4ab]/20 text-sm font-semibold transition-colors">Try Again</button>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">Analysis Complete</h2>
                <p className="text-[#bbc9cf] text-base">Here is how your resume stacks up against industry standards.</p>
              </div>
              <span className="px-4 py-1.5 rounded-full bg-[#03c6b2]/20 text-[#44e2cd] text-sm border border-[#44e2cd]/30 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Done
              </span>
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left col */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                
                {/* Profile Overview */}
                <div className="bg-[#1a2123] p-6 rounded-xl border border-[#3c494e]/30 flex justify-between items-center">
                  <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#2f3639] flex items-center justify-center">
                      <span className="text-3xl font-bold text-[#00d1ff] uppercase">{userName.charAt(0)}</span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold">{userName}</h3>
                      <p className="text-xs text-[#bbc9cf] flex items-center gap-2 mt-1">
                        <span className="material-symbols-outlined text-xs">description</span>
                        <span className="truncate max-w-[200px]" title={fileName}>{fileName}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#44e2cd] px-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span> Strengths
                  </h4>
                  <div className="bg-[#03c6b2]/5 p-6 rounded-xl border border-[#44e2cd]/20">
                    <ul className="space-y-3">
                      {analysis.strengths.map((str, i) => (
                        <li key={i} className="flex gap-3 text-[#bbc9cf] text-sm leading-relaxed">
                          <span className="text-[#44e2cd] mt-0.5">•</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#ffb4ab] px-2 flex items-center gap-2 mt-4">
                    <span className="material-symbols-outlined text-[18px]">warning</span> Lacking Areas
                  </h4>
                  <div className="bg-[#93000a]/10 p-6 rounded-xl border border-[#ffb4ab]/20">
                    <ul className="space-y-3">
                      {analysis.weaknesses.map((weak, i) => (
                        <li key={i} className="flex gap-3 text-[#bbc9cf] text-sm leading-relaxed">
                          <span className="text-[#ffb4ab] mt-0.5">•</span> {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>

              {/* Right col */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                
                {/* Score */}
                <div className="relative bg-[#1a2123] rounded-xl p-8 border border-[#3c494e]/30 flex flex-col items-center justify-center text-center overflow-hidden">
                  {analysis.score >= 80 && <div className="absolute inset-0 bg-gradient-to-b from-[#00d1ff]/10 to-transparent"></div>}
                  <p className="text-xs font-bold uppercase tracking-widest text-[#859399] mb-4 relative z-10">Overall Score</p>
                  <div className="relative z-10 w-32 h-32 rounded-full border-8 border-[#2f3639] flex items-center justify-center"
                    style={{ borderColor: analysis.score >= 80 ? 'var(--c-primary)' : analysis.score >= 60 ? 'var(--c-secondary)' : 'var(--c-error, #ffb4ab)' }}>
                    <span className="font-['Plus_Jakarta_Sans'] text-5xl font-black">{analysis.score}</span>
                  </div>
                  <p className="text-sm text-[#bbc9cf] mt-6 relative z-10">
                    {analysis.score >= 80 ? "Excellent resume! You're ready to apply." : analysis.score >= 60 ? "Good foundation, but needs some polishing." : "Needs significant improvements."}
                  </p>
                </div>

                {/* Tips */}
                <div className="bg-[#1a2123] rounded-xl p-6 border border-[#3c494e]/30 space-y-4">
                  <div className="flex items-center gap-2 text-[#00d1ff]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                    <p className="text-sm font-bold">How to Improve</p>
                  </div>
                  <ul className="space-y-4 pt-2">
                    {analysis.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-xs text-[#bbc9cf] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#00d1ff]/10 text-[#00d1ff] flex items-center justify-center shrink-0 mt-0.5 font-bold">{i+1}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Spacer for sticky bar */}
        <div className="h-24"></div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-[#0e1417]/80 backdrop-blur-lg border-t border-[#242424] flex justify-end gap-6 z-20">
        {(fileUploaded || analysis || error) && (
          <button onClick={resetForm} className="px-6 py-2.5 rounded-lg text-[#dde3e7] border border-[#3c494e] hover:bg-[#2f3639] transition-colors font-medium">
            Discard and Re-upload
          </button>
        )}
        <Link href="/dashboard/new" className="px-10 py-2.5 rounded-lg bg-[#00d1ff] text-[#001f28] font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
          {analysis ? "Start Interview" : "Proceed to Interview Setup"}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
