import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Loader2, Play, CheckCircle2 } from 'lucide-react';
import { useGazeDetection } from "@/hooks/useGazeDetection";
import GazeProctor from "@/components/GazeProctor";
import AvatarInterviewer from "@/components/AvatarInterviewer";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Eye, Monitor } from 'lucide-react';

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

  // Vision & Avatar state
  const [showAvatar, setShowAvatar] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [lastVisionCheck, setLastVisionCheck] = useState(0);
  const editorRef = useRef<any>(null);

  const MAX_STRIKES = 3;

  const { videoRef, strikes, status } = useGazeDetection({
    enabled: started && !failed,
    maxStrikes: MAX_STRIKES,
    onStrike: async (count) => {
      if (count < MAX_STRIKES) {
        setOutput(
          `⚠️ Eye-tracking warning ${count}/${MAX_STRIKES}. ` +
          `Please keep your eyes on the screen.`
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
      // Wait a moment so user can see the failure message before auto-submitting
      setTimeout(() => {
        const submission = `// [Session terminated by anti-cheat]\n${code}`;
        onComplete(submission, language);
      }, 3000);
    },
  });

  // Tab switching protection
  useEffect(() => {
    if (!started || failed) return;
    
    const handleViolation = () => {
      setFailed(true);
      const submission = `// [Session terminated: Tab switched or Window blurred]\n${code}`;
      setTimeout(() => onComplete(submission, language), 3000);
    };

    // Grace period to prevent false-positive cheating detections during mount
    const graceTimeout = setTimeout(() => {
      const handleVisibilityChange = () => { if (document.hidden) handleViolation(); };
      const handleBlur = () => handleViolation();

      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("blur", handleBlur);
      
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("blur", handleBlur);
      };
    }, 3000);

    return () => clearTimeout(graceTimeout);
  }, [started, failed, code, language, onComplete]);

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
      
      if (!res.ok) throw new Error('Failed to fetch coding question');
      const data = await res.json();
      setQuestion(data);
      setCode(data.languageSnippets['javascript']);
      setOutput('');
    } catch (err) {
      console.error(err);
      // Fallback for non-technical roles if API fails
      if (!variables.role?.toLowerCase().includes('engineer')) {
        setQuestion({
          title: "Strategic Response Challenge",
          description: "Given a sudden shift in market conditions, how would you adjust your strategy to maintain target alignment? Draft your response in the editor.",
          languageSnippets: {
            javascript: "// DRAFT YOUR RESPONSE BELOW\n\nStrategy Overview:\n\n[Write here]",
            python: "# Draft here",
            java: "// Draft here",
            cpp: "// Draft here"
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
      setOutput(`Execution for ${language} is mocked in this environment.\nCode submitted successfully for analysis.`);
    }
  };

  const handleSubmit = () => {
    const currentSubmission = `// Question: ${question?.title}\n// Language: ${language}\n\n${code}`;
    const newSubmissions = [...allSubmissions, currentSubmission];
    
    if (questionIndex === 0) {
      // Move to second question
      setAllSubmissions(newSubmissions);
      setQuestionIndex(1);
      fetchQuestion('Medium');
    } else {
      // Finish round
      const combinedCode = newSubmissions.join('\n\n----------------------------------------\n\n');
      onComplete(combinedCode, language);
    }
  };

  // Vision Helper: Capture screen and get AI advice
  const runVisionAnalysis = async () => {
    if (!showAvatar || isVisionLoading || !started || failed) return;
    
    setIsVisionLoading(true);
    try {
      // Capture a screenshot of the window/editor
      // Note: In a real app, we'd use getDisplayMedia, but for the hackathon
      // we'll simulate the "Sight" by sending the current code + context.
      // If we wanted real vision, we'd capture a canvas frame here.
      
      const storedVars = localStorage.getItem('omnidimension_variables');
      const vars = storedVars ? JSON.parse(storedVars) : {};

      const res = await fetch('/api/vision-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: "data:image/jpeg;base64,...", // Placeholder for actual capture
          code: code,
          jobRole: vars.role || "Developer"
        })
      });

      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
        speakAdvice(data.advice);
      }
    } catch (err) {
      console.error("Vision Check Failed", err);
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

  // Run vision check every 45 seconds if user is active
  useEffect(() => {
    if (!started || failed || !showAvatar) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastVisionCheck > 45000) {
        runVisionAnalysis();
        setLastVisionCheck(now);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [started, failed, showAvatar, code, lastVisionCheck]);

  if (isLoading) {
    const isTech = localStorage.getItem('omnidimension_variables')?.toLowerCase().includes('engineer') || false;
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px-40px)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
          <p className="text-[#859399]">
            {isTech ? `Generating ${questionIndex === 0 ? 'Easy' : 'Medium'} coding question...` : 'Preparing your Strategic Case Study...'}
          </p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#ffb4ab]">
        Failed to load coding question.
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col w-full">
      <GazeProctor
        videoRef={videoRef}
        strikes={strikes}
        maxStrikes={MAX_STRIKES}
        status={status}
      />

      {/* Strict Anti-Cheat Rules Overlay */}
      {!started && !failed && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-[#121a1e] border border-[#f59e0b]/30 p-10 rounded-2xl max-w-xl w-full text-center shadow-2xl">
            <span className="material-symbols-outlined text-6xl text-[#f59e0b] mb-4">security</span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white mb-4">Coding Round Anti-Cheat</h2>
            <div className="text-[#bbc9cf] text-sm leading-relaxed mb-8 text-left space-y-4">
              <p>To ensure interview integrity, the following rules are strictly enforced:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-white">Tab switching or minimizing</strong> the window will result in immediate termination of the coding round.</li>
                <li><strong className="text-white">Eye Tracking:</strong> Your gaze must stay on the screen. Looking away repeatedly will trigger strikes.</li>
                <li>On the 3rd strike, the session will be auto-submitted and closed.</li>
              </ul>
              <p className="text-xs text-[#859399] italic">Webcam processing happens locally. No video data is recorded.</p>
            </div>
            <button 
              onClick={() => setStarted(true)} 
              className="w-full bg-[#00d1ff] text-[#001f28] py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition-all shadow-[0_0_30px_rgba(0,209,255,0.2)]"
            >
              Understand & Start Coding
            </button>
          </div>
        </div>
      )}

      {/* Failure Overlay */}
      {failed && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4">
          <div className="bg-[#121a1e] border border-[#f43f5e]/30 p-10 rounded-2xl max-w-md w-full text-center shadow-2xl shadow-[#f43f5e]/10">
            <span className="material-symbols-outlined text-6xl text-[#f43f5e] mb-4">report_problem</span>
            <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white mb-2">Session Terminated</h2>
            <p className="text-[#bbc9cf] mb-8 leading-relaxed">
              The anti-cheat system detected a violation (tab switch or excessive gaze deviation). 
              Your current progress is being submitted and the interview will continue.
            </p>
            <div className="flex items-center justify-center gap-3 text-[#f43f5e] font-bold animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              Moving to report generation...
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 grid grid-cols-12 gap-6 p-8 max-w-7xl mx-auto w-full h-[calc(100vh-64px-40px)] overflow-hidden">
        {/* Left: Problem Description */}
      <section className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
        {/* Avatar Companion */}
        <div className={`transition-all duration-500 ${showAvatar ? 'h-64' : 'h-16'} bg-[#1A1A1A] border border-[#242424] rounded-2xl overflow-hidden relative group`}>
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setShowAvatar(!showAvatar)}
              className="p-2 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-[#00d1ff]/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">{showAvatar ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          
          {showAvatar ? (
            <AvatarInterviewer isSpeaking={isSpeaking} />
          ) : (
            <div className="h-full flex items-center px-6 gap-3">
              <Sparkles className="text-[#00d1ff] w-5 h-5 animate-pulse" />
              <span className="text-sm font-bold text-[#859399]">AI Companion Hidden</span>
            </div>
          )}

          {/* Advice Bubble */}
          {aiAdvice && showAvatar && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[10px] text-[#bbc9cf] leading-relaxed italic line-clamp-2">
                "{aiAdvice}"
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-8 flex flex-col gap-6 flex-1 shadow-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00d1ff]">
              {question.languageSnippets.javascript.includes('solve') ? 'code' : 'assignment'}
            </span>
            <span className="text-sm text-[#859399] uppercase tracking-widest font-bold">
              {question.languageSnippets.javascript.includes('solve') ? 'Coding Round' : 'Strategic Challenge'} - Question {questionIndex + 1}/2
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans'] mb-4">{question.title}</h2>
            <div className="text-sm text-[#bbc9cf] leading-relaxed whitespace-pre-wrap font-['Inter']">
              {question.description}
            </div>
          </div>
        </div>
      </section>

      {/* Right: Monaco Editor & Console */}
      <section className="col-span-12 lg:col-span-8 flex flex-col gap-6 h-full">
        <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl flex flex-col flex-1 shadow-sm overflow-hidden">
          {/* Editor Header */}
          <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#161d1f]">
            <div className="flex items-center gap-4">
              <select 
                value={language}
                onChange={handleLanguageChange}
                className="bg-[#242b2e] border border-[#242424] text-[#dde3e7] text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00d1ff]"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRunCode}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#242b2e] text-[#00d1ff] hover:bg-[#2c3437] transition-colors text-sm font-semibold border border-[#242424]"
              >
                <Play className="w-4 h-4" /> Run
              </button>
              <button 
                onClick={handleSubmit}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00d1ff] text-[#001f28] hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all text-sm font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> {questionIndex === 0 ? 'Next Question' : 'Submit All'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {/* Console Output */}
          <div className="h-48 border-t border-[#242424] bg-[#121212] flex flex-col">
            <div className="px-4 py-2 bg-[#161d1f] border-b border-[#242424] text-xs font-bold text-[#859399] uppercase tracking-wider">
              Console Output
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-[#bbc9cf] whitespace-pre-wrap">
              {output || "Run your code to see output..."}
            </div>
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}
