"use client";
import { useState, useEffect } from "react";
import { offlineAI } from "@/lib/offline-ai/engine";
import * as pdfjs from "pdfjs-dist";
import Link from "next/link";
import { Loader2, Globe, ShieldCheck, Zap } from "lucide-react";

export default function OfflineResumeClient() {
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    // This only runs on the client
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }, []);

  const initEngine = async () => {
    setIsInitializing(true);
    try {
      await offlineAI.initialize((report) => {
        setLoadingStatus(report.text);
        const match = report.text.match(/\[(\d+)\/(\d+)\]/);
        if (match) {
          setProgress(Math.round((parseInt(match[1]) / parseInt(match[2])) * 100));
        }
      });
      setIsEngineReady(true);
    } catch (err: any) {
      console.error("WebLLM Init Error:", err);
      const isWebGPUSupported = "gpu" in navigator;
      if (!isWebGPUSupported) {
        alert("🚨 WebGPU is not supported on this browser.\n\nTo fix this for your demo:\n1. Use Google Chrome.\n2. Or enable it in Brave via chrome://flags/#enable-unsafe-webgpu");
      } else {
        alert("Initialization failed. Please ensure your hardware acceleration is turned on in browser settings.");
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const extractText = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return fullText;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsAnalyzing(true);

    try {
      const text = await extractText(file);
      const analysis = await offlineAI.analyzeResume(text);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1417] text-white p-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                <Zap className="text-[#00d1ff] fill-[#00d1ff]/20" size={32} />
                Edge Intelligence
              </h1>
              <span className="bg-[#ffb4ab] text-[#690005] text-[10px] font-black px-2 py-0.5 rounded-md uppercase">Beta / WIP</span>
            </div>
            <p className="text-[#859399] mt-2">Zero-Latency, Private Offline Resume Analysis (Experimental)</p>
          </div>
          <Link href="/dashboard/resume" className="text-sm font-bold text-[#859399] hover:text-white transition-colors">
            Back to Online →
          </Link>
        </header>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#1a2123] border border-[#242b2e] p-4 rounded-2xl flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isEngineReady ? 'bg-[#03c6b2]' : 'bg-[#ffb4ab] animate-pulse'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#bbc9cf]">AI Engine: {isEngineReady ? 'Online' : 'Standby'}</span>
          </div>
          <div className="bg-[#1a2123] border border-[#242b2e] p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="text-[#00d1ff]" size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#bbc9cf]">Privacy: 100% Local</span>
          </div>
          <div className="bg-[#1a2123] border border-[#242b2e] p-4 rounded-2xl flex items-center gap-3">
            <Globe className="text-[#859399]" size={18} />
            <span className="text-xs font-bold uppercase tracking-widest text-[#bbc9cf]">Status: Offline Enabled</span>
          </div>
        </div>

        {/* Main Interaction Area */}
        {!isEngineReady ? (
          <div className="bg-[#1a2123] border border-[#00d1ff]/20 rounded-3xl p-12 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-[#00d1ff]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="text-[#00d1ff]" size={40} />
            </div>
            <h2 className="text-2xl font-bold">Prepare Local Intelligence</h2>
            <p className="text-[#859399] max-w-md mx-auto">
              We need to download a high-performance AI model (Microsoft Phi-3.5) to your browser's cache. This will only happen once.
            </p>
            
            {isInitializing ? (
              <div className="space-y-4 max-w-sm mx-auto">
                <div className="h-2 w-full bg-[#242b2e] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00d1ff] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs font-mono text-[#00d1ff]">{loadingStatus}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={initEngine}
                  className="bg-[#00d1ff] text-[#001f28] px-10 py-4 rounded-xl font-black text-lg hover:scale-105 transition-all shadow-lg shadow-[#00d1ff]/20"
                >
                  Initialize AI (WebGPU)
                </button>
                <div className="h-px w-20 bg-white/10 my-2" />
                <Link 
                  href="/dashboard/resume"
                  className="text-sm font-bold text-[#859399] hover:text-[#00d1ff] transition-colors"
                >
                  Use Online Analyzer (Fallback)
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Upload Box */}
            {!result && !isAnalyzing && (
              <div className="relative border-2 border-dashed border-[#242b2e] hover:border-[#00d1ff]/50 bg-[#1a2123] rounded-3xl p-16 text-center transition-all group">
                <input type="file" onChange={handleFile} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                <div className="w-20 h-20 bg-[#242b2e] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-4xl text-[#00d1ff]">upload_file</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Drop Resume for Offline Analysis</h3>
                <p className="text-[#859399]">No data leaves your machine. Ever.</p>
              </div>
            )}

            {/* Loading Analysis */}
            {isAnalyzing && (
              <div className="text-center py-20 space-y-6">
                <Loader2 className="w-16 h-16 text-[#00d1ff] animate-spin mx-auto" />
                <h2 className="text-2xl font-bold animate-pulse text-[#00d1ff]">Analyzing on Edge...</h2>
                <p className="text-[#859399]">Your local GPU is processing the resume text.</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                <div className="bg-gradient-to-br from-[#1a2123] to-[#0e1417] border border-[#242b2e] rounded-3xl p-8">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00d1ff] bg-[#00d1ff]/10 px-3 py-1 rounded-full">Report Generated</span>
                      <h2 className="text-3xl font-black mt-4">{fileName}</h2>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-black text-[#00d1ff]">{result.score || result.ats_score || 85}</div>
                      <div className="text-[10px] font-bold text-[#859399] uppercase tracking-widest mt-1">AI Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#03c6b2]" />
                        Key Strengths
                      </h4>
                      <div className="space-y-2">
                        {result.strengths?.map((s: string, i: number) => (
                          <div key={i} className="bg-white/5 p-4 rounded-xl text-sm border border-white/5">{s}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab]" />
                        Growth Areas
                      </h4>
                      <div className="space-y-2">
                        {result.weaknesses?.map((w: string, i: number) => (
                          <div key={i} className="bg-white/5 p-4 rounded-xl text-sm border border-white/5">{w}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setResult(null)}
                  className="w-full py-4 border border-[#242b2e] rounded-xl text-[#859399] hover:text-white hover:bg-white/5 transition-all font-bold"
                >
                  Analyze New File
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
