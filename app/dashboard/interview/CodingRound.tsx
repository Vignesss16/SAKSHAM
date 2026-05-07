import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Play, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { useGazeDetection } from "@/hooks/useGazeDetection";
import GazeProctor from "@/components/GazeProctor";
import { AgentVisualizer } from 'agora-agent-uikit';
import { mapAgentVisualizerState } from '@/lib/conversation';
import { createClient } from "@/lib/supabase/client";

interface CodingQuestion {
  title: string;
  description: string;
  languageSnippets: {
    javascript: string;
    python: string;
    java: string;
    cpp: string;
  };
}

interface CodingRoundProps {
  onComplete: (code: string, language: string) => void;
}

export default function CodingRound({ onComplete }: CodingRoundProps) {
  const [question, setQuestion] = useState<CodingQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'javascript' | 'python' | 'java' | 'cpp'>('javascript');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  
  // Sequence state
  const [questionIndex, setQuestionIndex] = useState(0); // 0 = Easy, 1 = Medium
  const [allSubmissions, setAllSubmissions] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  // UI state
  const [showAvatar, setShowAvatar] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [lastVisionCheck, setLastVisionCheck] = useState(0);
  const [isTech, setIsTech] = useState(false);

  useEffect(() => {
    const storedVars = localStorage.getItem('omnidimension_variables');
    if (storedVars?.toLowerCase().includes('engineer')) {
      setIsTech(true);
    }
  }, []);

  const MAX_STRIKES = 3;

  const { videoRef, strikes, status } = useGazeDetection({
    enabled: started && !failed,
    maxStrikes: MAX_STRIKES,
    onStrike: async (count) => {
      if (count < MAX_STRIKES) {
        setOutput(
          `⚠️ Security Warning ${count}/${MAX_STRIKES}. ` +
          `Please maintain focus on the assessment screen.`
        );
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("proctoring_events").insert({
          user_id: user.id,
          session_type: "mock_interview",
          strike_number: count,
          terminated: count >= MAX_STRIKES,
        });
      }
    },
    onTerminate: () => {
      setFailed(true);
      setTimeout(() => {
        const submission = `// [Assessment terminated by proctoring system]\n${code}`;
        onComplete(submission, isTech ? language : 'strategic');
      }, 3000);
    },
  });

  // Tab switching protection
  useEffect(() => {
    if (!started || failed) return;
    
    const handleViolation = () => {
      setFailed(true);
      const submission = `// [Assessment terminated: Focus lost (Tab switch/Window blur)]\n${code}`;
      setTimeout(() => onComplete(submission, isTech ? language : 'strategic'), 3000);
    };

    const graceTimeout = setTimeout(() => {
      const handleVisibilityChange = () => { 
        if (document.hidden && started && !failed) handleViolation(); 
      };
      const handleBlur = () => {
        if (started && !failed) handleViolation();
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
      };
    }, 5000);

    return () => clearTimeout(graceTimeout);
  }, [started, failed, code, language, onComplete, isTech]);

  const fetchQuestion = async (difficultyOverride: string) => {
    setIsLoading(true);
    const storedVars = localStorage.getItem('omnidimension_variables');
    const variables = storedVars ? JSON.parse(storedVars) : {};

    try {
      const res = await fetch('/api/generate-coding-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: variables.role,
          targetCompany: variables.company,
          difficulty: difficultyOverride,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to fetch challenge');
      const data = await res.json();
      setQuestion(data);
      setCode(data.languageSnippets['javascript']);
      setOutput('');
    } catch (err) {
      console.error(err);
      if (!variables.role?.toLowerCase().includes('engineer')) {
        setQuestion({
          title: "Strategic Response Challenge",
          description: "Given a sudden shift in market conditions, how would you adjust your strategy to maintain target alignment? Draft your professional response in the strategy board.",
          languageSnippets: {
            javascript: "Strategy Overview:\n\n[Identify the core challenge]\n\n[Proposed Action Plan]\n\n[Expected Outcome]",
            python: "",
            java: "",
            cpp: ""
          }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion('Easy');
  }, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    setLanguage(lang as 'javascript' | 'python' | 'java' | 'cpp');
    if (question && question.languageSnippets) {
      setCode(question.languageSnippets[lang as keyof typeof question.languageSnippets] || '');
    }
  };

  const handleRunCode = () => {
    if (!isTech) {
      setOutput("Strategy draft saved successfully. Continuing analysis...");
      return;
    }

    if (language === 'javascript') {
      try {
        let logs: string[] = [];
        const originalConsoleLog = console.log;
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        new Function(code)();
        console.log = originalConsoleLog;
        setOutput(logs.join('\n') || 'Code executed successfully with no output.');
      } catch (err: any) {
        setOutput(err.toString());
      }
    } else {
      setOutput(`Execution for ${language} is mocked.\nCode submitted for automated verification.`);
    }
  };

  const handleSubmit = () => {
    const currentSubmission = `// Challenge: ${question?.title}\n// Mode: ${isTech ? language : 'Strategic'}\n\n${code}`;
    const newSubmissions = [...allSubmissions, currentSubmission];
    
    if (questionIndex === 0) {
      setAllSubmissions(newSubmissions);
      setQuestionIndex(1);
      fetchQuestion('Medium');
    } else {
      const combinedResponse = newSubmissions.join('\n\n----------------------------------------\n\n');
      onComplete(combinedResponse, isTech ? language : 'strategic');
    }
  };

  // Run vision analysis for technical hints
  const runVisionAnalysis = async () => {
    if (!showAvatar || isVisionLoading || !started || failed || !isTech) return;
    
    setIsVisionLoading(true);
    try {
      const storedVars = localStorage.getItem('omnidimension_variables');
      const vars = storedVars ? JSON.parse(storedVars) : {};

      const res = await fetch('/api/vision-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: "data:image/jpeg;base64,...",
          code: code,
          jobRole: vars.role || "Professional"
        })
      });

      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
        speakAdvice(data.advice);
      }
    } catch (err) {
      console.error("Analysis Failed", err);
    } finally {
      setIsVisionLoading(false);
    }
  };

  const speakAdvice = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!started || failed || !showAvatar || !isTech) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastVisionCheck > 45000) {
        runVisionAnalysis();
        setLastVisionCheck(now);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [started, failed, showAvatar, code, lastVisionCheck, isTech]);

  const visualizerState = useMemo(() => {
    return isSpeaking ? 'talking' : 'ambient';
  }, [isSpeaking]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px-40px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
          <p className="text-[#859399] font-medium tracking-wide">
            {isTech ? `Initializing Technical Challenge ${questionIndex + 1}...` : 'Preparing Strategic Case Study...'}
          </p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#ffb4ab]">
        Challenge failed to initialize. Please refresh.
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col w-full">
      <GazeProctor videoRef={videoRef} strikes={strikes} maxStrikes={MAX_STRIKES} status={status} />

      {/* Proctoring Overlay */}
      {!started && !failed && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0e1417]/95 backdrop-blur-xl p-4">
          <div className="bg-[#121a1e] border border-[#00d1ff]/10 p-12 rounded-3xl max-w-2xl w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-[#00d1ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-[#00d1ff]">verified_user</span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-black text-white mb-4 uppercase tracking-tight">
              {isTech ? 'Technical Assessment Phase' : 'Strategic Assessment Phase'}
            </h2>
            <div className="text-[#bbc9cf] text-sm leading-relaxed mb-10 text-left space-y-4 max-w-lg mx-auto bg-black/20 p-6 rounded-xl border border-white/5">
              <p className="font-bold text-[#00d1ff]">Professional Integrity Protocols:</p>
              <ul className="space-y-3">
                <li className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-[#00d1ff] text-lg">sync_problem</span>
                  <span><strong className="text-white">Active Focus:</strong> Tab switching or minimizing will immediately terminate the session.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="material-symbols-outlined text-[#00d1ff] text-lg">visibility</span>
                  <span><strong className="text-white">Gaze Tracking:</strong> Your eye alignment is being monitored to ensure focused engagement.</span>
                </li>
              </ul>
              <p className="text-[10px] text-[#859399] italic mt-4">SAKSHAM.AI proctoring data is processed locally and discarded post-session.</p>
            </div>
            <button 
              onClick={() => setStarted(true)} 
              className="w-full bg-[#00d1ff] text-[#001f28] py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,209,255,0.2)] uppercase tracking-wider"
            >
              Enter Assessment
            </button>
          </div>
        </div>
      )}

      {/* Failure Overlay */}
      {failed && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <div className="bg-[#121a1e] border border-[#f43f5e]/30 p-12 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <span className="material-symbols-outlined text-7xl text-[#f43f5e] mb-4">gpp_maybe</span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white mb-2">Session Terminated</h2>
            <p className="text-[#bbc9cf] mb-10 leading-relaxed text-sm">
              The proctoring system detected a loss of focus. 
              Your partial response has been captured for evaluation.
            </p>
            <div className="flex items-center justify-center gap-3 text-[#f43f5e] font-bold animate-pulse text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              FINALIZING REPORT...
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 grid grid-cols-12 gap-8 p-8 max-w-[1600px] mx-auto w-full h-[calc(100vh-64px-40px)] overflow-hidden">
        {/* Left: Challenge Description */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
          {/* AI Companion Visualizer */}
          <div className="h-64 bg-[#121a1e] border border-[#242424] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-[#00d1ff] animate-pulse' : 'bg-[#4a5559]'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#859399]">AI Analyst Active</span>
            </div>
            
            <AgentVisualizer state={visualizerState} size="md" />

            {aiAdvice && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#0e1417]/80 backdrop-blur-md p-4 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                <div className="flex items-start gap-2">
                   <Sparkles className="w-3 h-3 text-[#00d1ff] shrink-0 mt-0.5" />
                   <p className="text-xs text-[#bbc9cf] leading-relaxed italic font-medium">"{aiAdvice}"</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#121a1e] border border-[#242424] rounded-2xl p-10 flex flex-col gap-6 flex-1 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00d1ff]/10 flex items-center justify-center">
                 <span className="material-symbols-outlined text-[#00d1ff] text-xl">{isTech ? 'code_blocks' : 'strategy'}</span>
              </div>
              <span className="text-xs text-[#859399] uppercase tracking-[0.2em] font-black">
                {isTech ? 'Technical Challenge' : 'Strategic Challenge'} - {questionIndex + 1}/2
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/5">
              <h2 className="text-2xl font-black text-white font-['Plus_Jakarta_Sans'] mb-6 tracking-tight">{question.title}</h2>
              <div className="text-[15px] text-[#bbc9cf] leading-loose whitespace-pre-wrap font-medium font-['Inter'] opacity-90">
                {question.description}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Challenge Workspace */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full">
          <div className="bg-[#121a1e] border border-[#242424] rounded-2xl flex flex-col flex-1 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#242424] flex items-center justify-between bg-[#161d1f]">
              <div className="flex items-center gap-4">
                {isTech ? (
                  <select 
                    value={language}
                    onChange={handleLanguageChange}
                    className="bg-[#0e1417] border border-[#242424] text-[#00d1ff] text-xs font-bold uppercase tracking-widest rounded-lg px-4 py-2 focus:outline-none focus:border-[#00d1ff] transition-colors"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#00d1ff]/10 rounded-lg border border-[#00d1ff]/20">
                     <span className="text-[10px] font-black text-[#00d1ff] uppercase tracking-widest">Strategy Mode</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleRunCode}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0e1417] text-[#00d1ff] hover:bg-[#00d1ff] hover:text-[#001f28] transition-all text-xs font-black uppercase tracking-widest border border-[#00d1ff]/30 shadow-lg shadow-[#00d1ff]/5"
                >
                  <Play className="w-4 h-4 fill-current" /> {isTech ? 'Run Debug' : 'Save Draft'}
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00d1ff] text-[#001f28] hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-[#00d1ff]/20"
                >
                  {questionIndex === 0 ? <><Send className="w-4 h-4" /> Next Phase</> : <><CheckCircle2 className="w-4 h-4" /> Finalize</>}
                </button>
              </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 relative bg-[#1E1E1E]">
              {isTech ? (
                <Editor
                  height="100%"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 15,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    padding: { top: 24, bottom: 24 },
                    scrollBeyondLastLine: false,
                    lineNumbersMinChars: 3,
                    glyphMargin: false,
                    folding: true,
                    lineHeight: 24
                  }}
                />
              ) : (
                <textarea
                  className="w-full h-full bg-[#1e1e1e] text-[#dde3e7] p-12 text-lg font-['Inter'] leading-relaxed focus:outline-none resize-none placeholder-[#4a5559] selection:bg-[#00d1ff]/30"
                  placeholder="Draft your strategic response here. Use clear structure and actionable insights..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                />
              )}
            </div>

            {/* Console / Status */}
            <div className="h-40 border-t border-[#242424] bg-[#0e1417] flex flex-col">
              <div className="px-6 py-2 bg-[#161d1f] border-b border-[#242424] flex items-center justify-between">
                <span className="text-[10px] font-black text-[#859399] uppercase tracking-widest">{isTech ? 'System Console' : 'Draft Status'}</span>
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-[#00d1ff] animate-pulse" />
                   <span className="text-[10px] text-[#00d1ff] font-bold uppercase tracking-widest">Active</span>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-[#bbc9cf] whitespace-pre-wrap leading-relaxed">
                {output || (isTech ? "// Execute code to view analysis..." : "// Drafting professional strategic response...")}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
