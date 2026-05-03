"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
}

interface ReportContext {
  title: string;
  score: number;
  summary: string;
  metrics: { label: string; score: number }[];
  strengths: { title: string }[];
  improvements: { title: string }[];
}

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm your **SAKSHAM.AI Career Coach** 🎯\n\nI can help you:\n• **Analyze** your interview reports\n• **Compare** two reports to track progress\n• **Coach** you on specific skills\n• **Visualize** your performance metrics\n\nAsk me anything, or click **Load My Report** to get started!",
};

function renderMarkdown(text: string) {
  // Simple markdown: bold, bullet, newline
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^• (.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>');
}

function MiniBarChart({ metrics }: { metrics: { label: string; score: number }[] }) {
  return (
    <div className="mt-3 bg-[#0e1417] rounded-xl p-4 border border-[#242424] space-y-2 w-full">
      <p className="text-xs font-bold text-[#00d1ff] mb-3 uppercase tracking-wider">📊 Performance Metrics</p>
      {metrics.map((m) => (
        <div key={m.label} className="space-y-1">
          <div className="flex justify-between text-[10px] text-[#859399]">
            <span>{m.label}</span>
            <span style={{ color: m.score < 40 ? '#ef4444' : '#44e2cd' }}>{m.score}/100</span>
          </div>
          <div className="w-full bg-[#242424] h-1.5 rounded-full">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${m.score}%`, backgroundColor: m.score < 40 ? '#ef4444' : '#00d1ff' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference - (circumference * score) / 100;
  const color = score >= 75 ? '#00d1ff' : score >= 50 ? '#44e2cd' : '#ef4444';
  return (
    <div className="flex flex-col items-center my-2">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="#242424" strokeWidth="6" />
        <circle cx="36" cy="36" r={radius} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" />
      </svg>
      <div className="relative -mt-14 flex flex-col items-center">
        <span className="text-lg font-black text-white">{score}</span>
        <span className="text-[10px] text-[#859399]">/100</span>
      </div>
      <p className="text-[11px] mt-8 font-semibold" style={{ color }}>
        {score >= 75 ? '🏆 Strong Candidate' : score >= 50 ? '📈 Progressing' : '💪 Needs Practice'}
      </p>
    </div>
  );
}

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([{
    id: 'default',
    name: 'New Chat',
    messages: [WELCOME_MSG],
    createdAt: Date.now(),
  }]);
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reportCtx, setReportCtx] = useState<ReportContext | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showViz, setShowViz] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const updateSession = useCallback((id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  // Load latest report from Supabase
  const loadReport = async () => {
    setLoadingReport(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase
        .from('interviews')
        .select('title, score, feedback, report_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) {
        addBotMessage("I couldn't find any interview reports yet. Complete an interview first! 🎤");
        return;
      }

      const ctx: ReportContext = {
        title: data.title || 'Interview',
        score: data.score || 0,
        summary: data.feedback || '',
        metrics: data.report_data?.metrics || [],
        strengths: data.report_data?.strengths || [],
        improvements: data.report_data?.improvements || [],
      };
      setReportCtx(ctx);
      setShowViz(true);

      const summaryMsg = `✅ **Report Loaded: ${ctx.title}**\n\n**Score: ${ctx.score}/100** — ${ctx.summary}\n\n**Top Strengths:** ${ctx.strengths.slice(0, 2).map((s: any) => s.title).join(', ')}\n**Areas to improve:** ${ctx.improvements.slice(0, 2).map((i: any) => i.title).join(', ')}\n\nWhat would you like to work on?`;
      addBotMessage(summaryMsg, ctx.metrics);
    } catch (err: any) {
      addBotMessage("Failed to load report: " + err.message);
    } finally {
      setLoadingReport(false);
    }
  };

  const addBotMessage = (content: string, metrics?: { label: string; score: number }[]) => {
    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: metrics ? `__METRICS__${JSON.stringify(metrics)}__\n${content}` : content,
    };
    updateSession(activeSessionId, s => ({ ...s, messages: [...s.messages, msg] }));
  };

  const newChat = () => {
    const id = Date.now().toString();
    setSessions(prev => [{
      id,
      name: 'New Chat',
      messages: [WELCOME_MSG],
      createdAt: Date.now(),
    }, ...prev]);
    setActiveSessionId(id);
    setShowSessions(false);
    setReportCtx(null);
    setShowViz(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput("");
    setIsLoading(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    // Auto-rename session based on first real user message
    updateSession(activeSessionId, s => ({
      ...s,
      messages: [...s.messages, userMsg],
      name: s.name === 'New Chat' ? text.substring(0, 40) : s.name,
    }));

    const botMsgId = (Date.now() + 1).toString();
    updateSession(activeSessionId, s => ({
      ...s,
      messages: [...s.messages, { id: botMsgId, role: "assistant", content: "" }],
    }));

    // Build context-aware system message
    const systemContext = reportCtx
      ? `You are SAKSHAM.AI, an expert interview coach. The user's latest report:\n- Title: ${reportCtx.title}\n- Overall Score: ${reportCtx.score}/100\n- Summary: ${reportCtx.summary}\n- Metrics: ${JSON.stringify(reportCtx.metrics)}\n- Strengths: ${JSON.stringify(reportCtx.strengths)}\n- Improvements needed: ${JSON.stringify(reportCtx.improvements)}\nGive specific, actionable coaching based on this data.`
      : "You are SAKSHAM.AI, an expert interview coach helping candidates improve their interview skills. Be concise, warm, and actionable.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemContext,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content.replace(/^__METRICS__.*__\n/, ''), // strip metric markers
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            updateSession(activeSessionId, s => ({
              ...s,
              messages: s.messages.map(msg =>
                msg.id === botMsgId ? { ...msg, content: msg.content + chunk } : msg
              ),
            }));
          }
        }
      }
    } catch {
      updateSession(activeSessionId, s => ({
        ...s,
        messages: s.messages.map(msg =>
          msg.id === botMsgId ? { ...msg, content: "Sorry, I encountered an error. Please try again." } : msg
        ),
      }));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const windowStyle = isMaximized
    ? "fixed inset-4 bottom-4 right-4 top-4 left-4 w-auto h-auto"
    : "fixed bottom-28 right-8 w-[420px] h-[580px]";

  return (
    <>
      {/* FAB */}
      <button
        id="ai-coach-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-50 ${
          isOpen ? "bg-[#242b2e] text-[#dde3e7] rotate-90 scale-90" : "bg-[#00d1ff] text-[#001f28] hover:scale-110"
        }`}
      >
        <span className="material-symbols-outlined text-2xl">{isOpen ? "close" : "smart_toy"}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`${windowStyle} bg-[#121212]/98 backdrop-blur-xl border border-[#242424] rounded-2xl shadow-2xl flex flex-col z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden`}>
          
          {/* Header */}
          <div className="flex items-center gap-3 p-3 bg-[#1a2123] border-b border-[#242424] shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#00d1ff]/20 flex items-center justify-center text-[#00d1ff] shrink-0">
              <span className="material-symbols-outlined text-xl">psychology</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#dde3e7] text-sm truncate">{activeSession.name}</h3>
              <p className="text-[10px] text-[#44e2cd]">SAKSHAM.AI Career Coach</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Load Report */}
              <button
                onClick={loadReport}
                disabled={loadingReport}
                title="Load latest report"
                className="p-1.5 text-[#859399] hover:text-[#00d1ff] hover:bg-[#00d1ff]/10 rounded-lg transition-colors text-[11px] flex items-center gap-1"
              >
                {loadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">analytics</span>}
              </button>
              {/* Sessions */}
              <button
                onClick={() => setShowSessions(!showSessions)}
                title="Chat history"
                className="p-1.5 text-[#859399] hover:text-[#00d1ff] hover:bg-[#00d1ff]/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
              </button>
              {/* New Chat */}
              <button
                onClick={newChat}
                title="New chat"
                className="p-1.5 text-[#859399] hover:text-[#44e2cd] hover:bg-[#44e2cd]/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
              </button>
              {/* Maximize */}
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? "Minimize" : "Maximize"}
                className="p-1.5 text-[#859399] hover:text-[#dde3e7] hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">{isMaximized ? "close_fullscreen" : "open_in_full"}</span>
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#859399] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Sessions Sidebar */}
          {showSessions && (
            <div className="absolute top-[57px] left-0 w-full bg-[#0e1417] border-b border-[#242424] z-10 max-h-48 overflow-y-auto">
              <div className="p-2 space-y-1">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setActiveSessionId(s.id); setShowSessions(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${s.id === activeSessionId ? 'bg-[#00d1ff]/20 text-[#00d1ff]' : 'text-[#bbc9cf] hover:bg-[#242424]'}`}
                  >
                    <span className="material-symbols-outlined text-[14px] mr-2 align-middle">chat</span>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Viz Bar */}
          {reportCtx && showViz && (
            <div className="shrink-0 bg-[#0e1417] border-b border-[#242424] px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#00d1ff] uppercase tracking-widest flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">analytics</span> {reportCtx.title}
                </span>
                <button onClick={() => setShowViz(false)} className="text-[#859399] text-[10px] hover:text-white">hide</button>
              </div>
              <div className="flex gap-4 items-center">
                <ScoreCircle score={reportCtx.score} />
                <div className="flex-1 space-y-1.5">
                  {reportCtx.metrics.slice(0, 3).map(m => (
                    <div key={m.label}>
                      <div className="flex justify-between text-[9px] text-[#859399] mb-0.5">
                        <span>{m.label}</span>
                        <span style={{ color: m.score < 40 ? '#ef4444' : '#44e2cd' }}>{m.score}</span>
                      </div>
                      <div className="w-full bg-[#242424] h-1 rounded-full">
                        <div className="h-full rounded-full" style={{ width: `${m.score}%`, backgroundColor: m.score < 40 ? '#ef4444' : '#00d1ff' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              // Detect embedded metrics
              const hasMetrics = msg.content.startsWith('__METRICS__');
              let metricsData: { label: string; score: number }[] = [];
              let displayContent = msg.content;
              if (hasMetrics) {
                const match = msg.content.match(/^__METRICS__(.+)__\n([\s\S]*)$/);
                if (match) {
                  try { metricsData = JSON.parse(match[1]); } catch {}
                  displayContent = match[2];
                }
              }

              return (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#00d1ff] text-[#001f28] rounded-tr-sm font-medium"
                        : "bg-[#1a2123] text-[#dde3e7] border border-[#3c494e] rounded-tl-sm"
                    }`}
                  >
                    {msg.content === "" ? (
                      <span className="flex items-center gap-2 text-[#859399]">
                        <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                      </span>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }} />
                    )}
                    {metricsData.length > 0 && <MiniBarChart metrics={metricsData} />}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 2 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
              {[
                { icon: "analytics", label: "Load my report", action: loadReport },
                { icon: "compare_arrows", label: "Compare reports", action: () => setInput("Compare my last two interviews and tell me my progress") },
                { icon: "tips_and_updates", label: "Improve clarity", action: () => setInput("How can I improve my communication clarity in interviews?") },
              ].map(q => (
                <button
                  key={q.label}
                  onClick={q.action}
                  disabled={isLoading || loadingReport}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1a2123] border border-[#3c494e] rounded-full text-[11px] text-[#bbc9cf] hover:border-[#00d1ff] hover:text-[#00d1ff] transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">{q.icon}</span>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-[#1a2123] border-t border-[#242424] shrink-0">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask for coaching, analyze your report..."
                className="w-full bg-[#0e1417] border border-[#3c494e] rounded-xl pl-4 pr-12 py-2.5 text-sm text-[#dde3e7] focus:border-[#00d1ff] focus:ring-1 focus:ring-[#00d1ff] outline-none transition-all placeholder-[#859399]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-[#00d1ff] text-[#001f28] disabled:opacity-50 disabled:bg-[#3c494e] disabled:text-[#859399] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
