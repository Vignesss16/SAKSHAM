"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useGazeDetection } from "@/hooks/useGazeDetection";
import GazeProctor from "@/components/GazeProctor";
import { createClient } from "@/lib/supabase/client";

const DAILY_SETS = [
  {
    id: 1,
    dsa: [
      {
        id: "dsa1",
        title: "Two Sum",
        difficulty: "Easy",
        functionName: "twoSum",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
        examples: [
          { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", args: "([2,7,11,15], 9)" }
        ],
        codeTemplates: {
          "JavaScript": "function twoSum(nums, target) {\n  \n}",
          "Python": "def twoSum(nums, target):\n    pass"
        }
      },
      {
        id: "dsa2",
        title: "Valid Parentheses",
        difficulty: "Easy",
        functionName: "isValid",
        description: "Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        examples: [
          { input: "s = \"()\"", output: "true", args: "(\"()\")" }
        ],
        codeTemplates: {
          "JavaScript": "function isValid(s) {\n  \n}",
          "Python": "def isValid(s):\n    pass"
        }
      }
    ],
    behavioral: [
      {
        id: "b1",
        question: "Tell me about a time you had a conflict with a teammate. How did you resolve it?",
        focus: "Conflict Resolution & Teamwork"
      },
      {
        id: "b2",
        question: "Why do you want to join our company?",
        focus: "Motivation & Research"
      }
    ]
  },
  {
    id: 2,
    dsa: [
      {
        id: "dsa3",
        title: "Best Time to Buy and Sell Stock",
        difficulty: "Medium",
        functionName: "maxProfit",
        description: "Maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.",
        examples: [
          { input: "prices = [7,1,5,3,6,4]", output: "5", args: "([7,1,5,3,6,4])" }
        ],
        codeTemplates: {
          "JavaScript": "function maxProfit(prices) {\n  \n}",
          "Python": "def maxProfit(prices):\n    pass"
        }
      },
      {
        id: "dsa4",
        title: "Contains Duplicate",
        difficulty: "Easy",
        functionName: "containsDuplicate",
        description: "Given an integer array `nums`, return `true` if any value appears at least twice in the array.",
        examples: [
          { input: "nums = [1,2,3,1]", output: "true", args: "([1,2,3,1])" }
        ],
        codeTemplates: {
          "JavaScript": "function containsDuplicate(nums) {\n  \n}",
          "Python": "def containsDuplicate(nums):\n    pass"
        }
      }
    ],
    behavioral: [
      {
        id: "b3",
        question: "Describe a difficult project you worked on. What were the challenges and how did you overcome them?",
        focus: "Problem Solving & Resilience"
      },
      {
        id: "b4",
        question: "Where do you see yourself in five years?",
        focus: "Ambition & Growth"
      }
    ]
  }
];

export default function DailyChallengePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dailySet, setDailySet] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  const [dsa1Code, setDsa1Code] = useState("");
  const [dsa2Code, setDsa2Code] = useState("");
  const [language, setLanguage] = useState("Python");
  const [behavioralAnswers, setBehavioralAnswers] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<"Testcases" | "Result">("Testcases");
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [sessionCredits, setSessionCredits] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { videoRef, suspicionScore, status } = useGazeDetection({
    enabled: started && !failed && completedSteps.length < 3,
    mode: "relaxed", // DSA/Daily is always relaxed to allow thinking
    onViolation: async (score, message) => {
      console.warn(`Proctoring event: ${message} (Score: ${score})`);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("proctoring_events").insert({
          user_id: user.id,
          session_type: "daily",
          suspicion_score: score,
          event_type: "behavioral_deviation"
        });
      }
    },
    onTerminate: () => {
      setFailed(true);
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/daily-status');
        if (res.ok) {
          const data = await res.json();
          if (data.completed) setAlreadyCompletedToday(true);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setMounted(true);
      }
    };
    checkStatus();

    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const selectedSet = DAILY_SETS[dayOfYear % DAILY_SETS.length];
    setDailySet(selectedSet);

    // Load persisted state
    const saved = localStorage.getItem(`daily_progress_${dayOfYear}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCompletedSteps(parsed.completedSteps || []);
      setBehavioralAnswers(parsed.behavioralAnswers || {});
      setDsa1Code(parsed.dsa1Code || (selectedSet?.dsa[0].codeTemplates["Python"] || ""));
      setDsa2Code(parsed.dsa2Code || (selectedSet?.dsa[1].codeTemplates["Python"] || ""));
      setStarted(parsed.started || false);
      setSessionCredits(parsed.sessionCredits || 0);
    } else if (selectedSet) {
      setDsa1Code(selectedSet.dsa[0].codeTemplates["Python"] || "");
      setDsa2Code(selectedSet.dsa[1].codeTemplates["Python"] || "");
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    if (!dailySet) return;
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const state = { completedSteps, behavioralAnswers, dsa1Code, dsa2Code, started, sessionCredits };
    localStorage.setItem(`daily_progress_${dayOfYear}`, JSON.stringify(state));
  }, [completedSteps, behavioralAnswers, dsa1Code, dsa2Code, started, sessionCredits, dailySet]);

  const getCurrentQuestion = () => {
    if (!dailySet) return null;
    if (currentStep === 1) return dailySet.dsa[0];
    if (currentStep === 2) return dailySet.dsa[1];
    return null;
  };

  const getCurrentCode = () => currentStep === 1 ? dsa1Code : dsa2Code;
  const setCurrentCode = (val: string) => {
    if (currentStep === 1) setDsa1Code(val);
    else if (currentStep === 2) setDsa2Code(val);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (dailySet) {
      setDsa1Code(dailySet.dsa[0].codeTemplates[newLang] || "");
      setDsa2Code(dailySet.dsa[1].codeTemplates[newLang] || "");
    }
  };

  useEffect(() => {
    if (!started || failed || completedSteps.length === 3) return;
    const handleVisibilityChange = () => { if (document.hidden) { setFailed(true); if (timerRef.current) clearInterval(timerRef.current); } };
    const handleBlur = () => { setFailed(true); if (timerRef.current) clearInterval(timerRef.current); };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [started, failed, completedSteps]);

  useEffect(() => {
    if (started && !failed && completedSteps.length < 3 && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { setFailed(true); clearInterval(timerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, failed, completedSteps, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRunCode = async () => {
    const question = getCurrentQuestion();
    if (!question) return;
    setRunning(true);
    setActiveTab("Result");
    setEvaluation(null);
    let wrappedCode = getCurrentCode();
    const testArgs = question.examples[selectedTestCase].args;
    if (language === "Python") wrappedCode += `\n\nprint(${question.functionName}${testArgs})`;
    else if (language === "JavaScript") wrappedCode += `\n\nconsole.log(${question.functionName}${testArgs})`;
    try {
      const res = await fetch("/api/run-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: wrappedCode }),
      });
      const data = await res.json();
      if (!res.ok) setRunResult({ stderr: data.error || "Failed to run code." });
      else setRunResult(data);
    } catch (e) {
      setRunResult({ stderr: "Failed to connect to the code execution service." });
    } finally { setRunning(false); }
  };

  const handleSubmit = async () => {
    if (currentStep === 3) { handleBehavioralSubmit(); return; }
    const question = getCurrentQuestion();
    const code = getCurrentCode();
    setSubmitting(true);
    setActiveTab("Result");
    setRunResult(null);
    try {
      const res = await fetch('/api/evaluate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, questionTitle: question.title, questionDescription: question.description, language, code })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluation(data);
        if (data.passed) {
          setCompletedSteps((prev) => Array.from(new Set([...prev, currentStep])));
          setSessionCredits(prev => prev + data.score);
        }
      }
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleBehavioralSubmit = async () => {
    setSubmitting(true);
    setActiveTab("Result");
    const answers = dailySet.behavioral.map((b: any) => ({ question: b.question, answer: behavioralAnswers[b.id] || "" }));
    try {
      const res = await fetch('/api/evaluate-behavioral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluation(data);
        if (data.passed) {
          // We don't add to completedSteps yet, let the user review then click "Final Submit"
          setSessionCredits(prev => prev + data.score);
        }
      }
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/daily-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits: sessionCredits })
      });
      if (res.ok) {
        setCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
        // Clear local storage for this day as it's done
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
        localStorage.removeItem(`daily_progress_${dayOfYear}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit challenge');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while submitting.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !dailySet) return <div className="min-h-screen bg-[#0e1417] flex items-center justify-center text-[var(--c-text)]"><Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" /></div>;

  if (alreadyCompletedToday) {
    return (
      <div className="min-h-screen bg-[#0e1417] text-[var(--c-text)] flex flex-col items-center justify-center p-8">
        <div className="glass p-10 max-w-lg w-full text-center border-[#00d1ff]/30">
          <span className="material-symbols-outlined text-6xl text-[#00d1ff] mb-4">task_alt</span>
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-black mb-2">Daily Challenge Complete!</h1>
          <p className="text-[var(--c-muted)] mb-8">You've earned your credits for today. Check the leaderboard to see your rank, and come back tomorrow for a new challenge!</p>
          <button onClick={() => router.push('/dashboard/leaderboard')} className="btn-primary w-full justify-center mb-3">View Leaderboard</button>
          <button onClick={() => router.push('/dashboard')} className="btn-ghost w-full justify-center">Exit to Dashboard</button>
        </div>
      </div>
    );
  }

  const completed = completedSteps.length === 3;

  return (
    <div className="min-h-screen h-screen bg-[#0e1417] text-[var(--c-text)] flex flex-col overflow-hidden font-['Plus_Jakarta_Sans']">
      <header className="flex justify-between items-center px-6 py-4 border-b border-[var(--c-border)] bg-[#121a1e] z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-[#bbc9cf] hover:text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-black text-[#dde3e7] m-0">Daily Challenge</h1>
            <p className="text-[var(--c-muted)] text-xs">Earn up to 1000 credits</p>
          </div>
        </div>

        {started && !failed && !completed && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#f43f5e] font-mono font-bold bg-[#f43f5e]/10 px-3 py-1.5 rounded-lg border border-[#f43f5e]/30">
              <span className="material-symbols-outlined text-sm">timer</span>
              {formatTime(timeLeft)}
            </div>
            {currentStep < 3 && (
              <>
                <button onClick={handleRunCode} disabled={running || submitting} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-[#242424] text-white hover:bg-[#2a2a2a] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">play_arrow</span> Run
                </button>
                <button onClick={handleSubmit} disabled={running || submitting} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-[#10b981] text-white hover:bg-[#10b981]/80 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">cloud_upload</span> {submitting ? 'Evaluating...' : 'Submit'}
                </button>
              </>
            )}
          </div>
        )}
        <GazeProctor
          videoRef={videoRef}
          suspicionScore={suspicionScore}
          status={status}
          mode="relaxed"
        />
      </header>

      <main className="flex-1 p-6 overflow-hidden relative flex flex-col gap-6">
        {started && !failed && !completed && (
          <div className="flex items-center gap-4 bg-[#1a1a1a] p-2 rounded-xl border border-white/5 shrink-0">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => { setCurrentStep(step); setEvaluation(null); setRunResult(null); setActiveTab("Testcases"); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${currentStep === step ? 'bg-[#00d1ff] text-black shadow-[0_0_15px_rgba(0,209,255,0.4)]' : 'text-[#bbc9cf] hover:text-white'}`}
              >
                {completedSteps.includes(step) && <span className="material-symbols-outlined text-sm">check_circle</span>}
                {step === 3 ? 'Behavioral' : `DSA ${step}`}
              </button>
            ))}
          </div>
        )}

        {!started && !failed && !completed && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="glass max-w-xl w-full p-8 rounded-2xl border border-[#f59e0b]/30 bg-[#121a1e] flex flex-col items-center text-center shadow-2xl">
              <span className="material-symbols-outlined text-6xl text-[#f59e0b] mb-4">gavel</span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white mb-3">Strict Anti-Cheat Enforced</h2>
              <div className="text-[#bbc9cf] text-base leading-relaxed mb-8 text-left">
                <p className="mb-2">Once you click start:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong className="text-white">You cannot switch tabs or minimize the window.</strong></li>
                  <li>Your webcam will be activated for intelligence proctoring.</li>
                  <li>Our AI uses behavioral analysis to ensure a fair assessment for everyone.</li>
                </ul>
              </div>
              <button onClick={() => setStarted(true)} className="btn-primary text-xl px-12 py-4 w-full justify-center rounded-xl shadow-[0_0_40px_rgba(0,209,255,0.2)] hover:scale-105 transition-transform">Start Challenge Now</button>
            </div>
          </div>
        )}

        {failed && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-[#121a1e] border border-[#f43f5e]/30 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl shadow-[#f43f5e]/10">
              <span className="material-symbols-outlined text-6xl text-[#f43f5e] mb-4">cancel</span>
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-white mb-2">Challenge Failed</h2>
              <p className="text-[#bbc9cf] mb-6">You either ran out of time, switched tabs, or the AI detected high suspicion patterns. Every session is tracked for fairness.</p>
              <button onClick={() => router.push('/dashboard')} className="btn-ghost w-full justify-center border border-[#242424] py-3 rounded-xl text-white hover:bg-white/5">Back to Dashboard</button>
            </div>
          </div>
        )}

        {completed && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-[#121a1e] border border-[#10b981]/30 p-10 rounded-3xl text-center max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-in fade-in zoom-in duration-300">
              <div className="w-24 h-24 bg-[#10b981]/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <span className="material-symbols-outlined text-6xl text-[#10b981]">workspace_premium</span>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-[#10b981] rounded-full flex items-center justify-center border-4 border-[#121a1e]">
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                </div>
              </div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-4xl font-black text-white mb-2 tracking-tight">Magnificent!</h2>
              <p className="text-[#10b981] font-bold text-lg mb-2 uppercase tracking-widest">Challenge Fully Mastered</p>
              <p className="text-[#bbc9cf] mb-8 leading-relaxed">You've successfully conquered all tasks. Your performance has earned you a spot among today's top candidates.</p>
              
              <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
                <div className="text-4xl font-black text-white mb-1">+{sessionCredits}</div>
                <div className="text-[10px] text-[#10b981] font-bold uppercase tracking-[0.2em]">Total Session Credits</div>
              </div>

              <button onClick={() => router.push('/dashboard/leaderboard')} className="btn-primary w-full justify-center bg-[#10b981] hover:bg-[#10b981]/80 border-none py-4 rounded-xl text-black font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] transition-all">Check Your Rank</button>
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar">
              {currentStep < 3 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">DSA Task {currentStep}</span>
                      <h2 className="text-xl font-bold text-white">{getCurrentQuestion()?.title}</h2>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getCurrentQuestion()?.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{getCurrentQuestion()?.difficulty}</span>
                  </div>
                  <p className="text-[#bbc9cf] text-sm leading-relaxed mb-6">{getCurrentQuestion()?.description}</p>
                  <div className="space-y-6">
                    {getCurrentQuestion()?.examples.map((ex: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <p className="text-xs font-bold text-white">Example {i + 1}:</p>
                        <div className="bg-[#242424] rounded-xl p-4 border border-white/5 font-mono text-xs space-y-2">
                          <p><span className="text-[#00d1ff]">Input:</span> <span className="text-white">{ex.input}</span></p>
                          <p><span className="text-[#00d1ff]">Output:</span> <span className="text-white">{ex.output}</span></p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider">Behavioral Task</span>
                    <h2 className="text-xl font-bold text-white">Soft Skills Assessment</h2>
                  </div>
                  {dailySet.behavioral.map((b: any, i: number) => (
                    <div key={b.id} className="space-y-4">
                      <div className="flex items-center gap-3"><span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#00d1ff]/20 text-[#00d1ff] text-xs font-bold">{i + 1}</span><p className="text-white font-medium text-sm">{b.question}</p></div>
                      <textarea value={behavioralAnswers[b.id] || ""} onChange={(e) => setBehavioralAnswers(prev => ({ ...prev, [b.id]: e.target.value }))} placeholder="Apply the STAR method (Situation, Task, Action, Result) for the best score..." className="w-full h-32 bg-[#242424] border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#00d1ff]/50 transition-all placeholder:text-[#5c6b75] resize-none" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="flex-1 bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
              {currentStep < 3 ? (
                <>
                  <div className="h-[60%] flex flex-col border-b border-white/5">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a1a] border-b border-white/5">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#00d1ff] shadow-[0_0_8px_#00d1ff]" /><span className="text-[10px] font-bold text-white uppercase tracking-wider">Code Editor</span></div>
                      <select value={language} onChange={handleLanguageChange} className="bg-[#242424] border border-white/10 rounded-md text-[10px] px-2 py-1 text-white focus:outline-none cursor-pointer"><option>Python</option><option>JavaScript</option></select>
                    </div>
                    <textarea value={getCurrentCode()} onChange={(e) => setCurrentCode(e.target.value)} className="flex-1 w-full bg-transparent p-4 text-[#bbc9cf] font-mono text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar" spellCheck="false" />
                  </div>
                  <div className="h-[40%] flex flex-col overflow-hidden">
                    <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 bg-[#1a1a1a]">
                      <button onClick={() => setActiveTab("Testcases")} className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === "Testcases" ? 'text-[#00d1ff]' : 'text-[#5c6b75] hover:text-white'}`}>Test Cases</button>
                      <button onClick={() => setActiveTab("Result")} className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === "Result" ? 'text-[#00d1ff]' : 'text-[#5c6b75] hover:text-white'}`}>Test Result</button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                      {activeTab === "Testcases" && (
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2">{getCurrentQuestion()?.examples?.map((_: any, i: number) => (<button key={i} onClick={() => setSelectedTestCase(i)} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${selectedTestCase === i ? 'bg-[#242424] text-[#00d1ff]' : 'bg-transparent text-[#bbc9cf] hover:text-white'}`}>Case {i + 1}</button>))}</div>
                          <div className="space-y-4">
                            <div><p className="text-xs text-[#bbc9cf] mb-1">Input</p><div className="bg-[#242424]/50 rounded-lg p-3 font-mono text-xs text-white">{getCurrentQuestion()?.examples?.[selectedTestCase]?.input}</div></div>
                            <div><p className="text-xs text-[#bbc9cf] mb-1">Expected Output</p><div className="bg-[#242424]/50 rounded-lg p-3 font-mono text-xs text-white">{getCurrentQuestion()?.examples?.[selectedTestCase]?.output}</div></div>
                          </div>
                        </div>
                      )}
                      {activeTab === "Result" && (
                        <div className="h-full">
                          {running ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#00d1ff]"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">Running Code...</p></div>
                          ) : submitting ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-purple-400"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">AI Judge is Evaluating...</p></div>
                          ) : evaluation ? (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`p-2 rounded-full ${evaluation.passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}><span className="material-symbols-outlined text-3xl">{evaluation.passed ? 'check_circle' : 'cancel'}</span></div><div><h3 className={`text-2xl font-bold ${evaluation.passed ? 'text-green-500' : 'text-red-500'}`}>{evaluation.passed ? 'Accepted' : 'Failed'}</h3><p className="text-xs text-[#bbc9cf]">Evaluation Complete</p></div></div><div className="text-right"><div className="text-3xl font-bold text-white">{evaluation.score}</div><p className="text-[10px] text-[#bbc9cf] uppercase tracking-wider">Total Credits</p></div></div>
                              <div className="grid grid-cols-3 gap-4">{['Correctness', 'Complexity', 'Style'].map((k, i) => (<div key={k} className="bg-[#242424] rounded-xl p-4 border border-white/5 text-center"><p className="text-[10px] text-[#bbc9cf] uppercase mb-1">{k}</p><p className={`text-xl font-bold ${i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : 'text-purple-400'}`}>+{evaluation.breakdown?.[k.toLowerCase()] || 0}</p></div>))}</div>
                              {evaluation.deductions?.length > 0 && (<div className="bg-red-500/5 rounded-xl p-4 border border-red-500/10"><p className="text-xs font-bold text-red-400 mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-sm">warning</span> Deductions</p><div className="space-y-2">{evaluation.deductions.map((d: any, i: number) => (<div key={i} className="flex justify-between items-start text-xs"><span className="text-[#bbc9cf]">• {d.reason}</span><span className="text-red-400 font-mono font-bold">-{Math.abs(d.points)}</span></div>))}</div></div>)}
                              <div className="bg-white/5 rounded-xl p-4"><p className="text-xs font-bold text-white mb-2">AI Feedback</p><p className="text-sm text-[#bbc9cf] leading-relaxed italic">"{evaluation.feedback}"</p></div>
                            </div>
                          ) : runResult ? (
                            <div className="font-mono text-xs space-y-4"><div className="flex items-center justify-between"><div className={`px-2 py-1 rounded font-bold uppercase ${runResult.stderr ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{runResult.stderr ? 'Runtime Error' : 'Accepted'}</div></div><div className="space-y-2"><p className="text-[#5c6b75]">Output:</p><div className={`bg-[#242424] p-4 rounded-xl border border-white/5 whitespace-pre-wrap ${runResult.stderr ? 'text-red-400' : 'text-white'}`}>{runResult.stdout || runResult.stderr || "No output"}</div></div></div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#5c6b75] gap-2"><span className="material-symbols-outlined text-4xl opacity-20">play_circle</span><p className="text-xs font-medium italic">Run your code to see results here</p></div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full bg-[#1a1a1a] p-6 flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white">Interview Results</h3><button onClick={handleBehavioralSubmit} disabled={submitting} className="px-6 py-2 bg-[#00d1ff] text-black rounded-lg font-bold hover:scale-105 transition-all disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Answers'}</button></div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {submitting ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-purple-400"><Loader2 className="w-8 h-8 animate-spin" /><p className="text-xs font-bold uppercase tracking-widest animate-pulse">AI is grading your interview...</p></div>
                    ) : evaluation ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${evaluation.passed ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              <span className="material-symbols-outlined text-3xl">{evaluation.passed ? 'check_circle' : 'error'}</span>
                            </div>
                            <div>
                              <h3 className={`text-2xl font-bold ${evaluation.passed ? 'text-green-500' : 'text-red-500'}`}>
                                {evaluation.passed ? 'Interview Complete' : 'Needs Improvement'}
                              </h3>
                              {!evaluation.passed && <p className="text-xs text-[#bbc9cf]">Score at least 500 to pass</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-white">{evaluation.score}</div>
                            <p className="text-[10px] text-[#bbc9cf] uppercase tracking-wider">Session Credits</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          {['Correctness', 'Complexity', 'Style'].map((k, i) => (
                            <div key={k} className="bg-[#242424] rounded-xl p-4 border border-white/5 text-center">
                              <p className="text-[10px] text-[#bbc9cf] uppercase mb-1">{k}</p>
                              <p className={`text-xl font-bold ${i === 0 ? 'text-green-400' : i === 1 ? 'text-blue-400' : 'text-purple-400'}`}>
                                +{evaluation.breakdown?.[k.toLowerCase()] || 0}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                          <p className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-[#00d1ff]">chat_bubble</span>
                            Coach Feedback
                          </p>
                          <p className="text-sm text-[#bbc9cf] leading-relaxed italic">"{evaluation.feedback}"</p>
                        </div>

                        {evaluation.passed ? (
                          <div className="pt-4 border-t border-white/5">
                            <button 
                              onClick={handleFinalSubmit} 
                              className="w-full py-4 bg-[#10b981] hover:bg-[#10b981]/80 text-white rounded-xl font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3 animate-bounce"
                            >
                              <span className="material-symbols-outlined">verified</span>
                              Finish & Submit Challenge
                            </button>
                            <p className="text-[10px] text-[#bbc9cf] text-center mt-3 uppercase tracking-widest opacity-50">Review your feedback before finalizing</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                            <button 
                              onClick={() => setEvaluation(null)} 
                              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                              Refine Answers & Try Again
                            </button>
                            <button 
                              onClick={() => router.push('/dashboard')} 
                              className="w-full py-3 text-[#bbc9cf] hover:text-white transition-colors text-sm font-medium"
                            >
                              Finish Session & Exit
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#5c6b75] gap-4"><div className="p-6 rounded-full bg-white/5"><span className="material-symbols-outlined text-6xl opacity-20">psychology</span></div><div className="text-center"><p className="text-sm font-bold text-white mb-1">Ready for the Behavioral Challenge?</p><p className="text-xs max-w-[280px] leading-relaxed mx-auto">Answer the questions on the left using the STAR method for maximum credits.</p></div></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #242424; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}} />
    </div>
  );
}
