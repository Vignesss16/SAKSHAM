"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, ReferenceLine } from 'recharts';

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function SkillsRadarChart({ data }: { data: any[] }) {
  return (
    <div className="mt-3 bg-[#0e1417] rounded-xl p-5 border border-[#242424] w-full h-[320px] shadow-inner">
      <p className="text-xs font-bold text-[#44e2cd] mb-4 uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">psychology</span> Skills Profile
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#2d373b" strokeWidth={0.5} />
          <PolarAngleAxis 
            dataKey="metric" 
            tick={{ fill: '#859399', fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Previous"
            dataKey="past"
            stroke="#4a5559"
            strokeWidth={2}
            fill="#4a5559"
            fillOpacity={0.3}
          />
          <Radar
            name="Current"
            dataKey="current"
            stroke="#00d1ff"
            strokeWidth={3}
            fill="#00d1ff"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a2123', borderColor: '#3c494e', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            labelStyle={{ color: '#dde3e7', fontWeight: 'bold', marginBottom: '4px' }}
            itemStyle={{ color: '#00d1ff' }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
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

function ComparisonChart({ data }: { data: any[] }) {
  const deltaData = data.map(d => ({
    metric: d.metric,
    delta: d.current - d.past
  }));

  const maxDelta = Math.max(...deltaData.map(d => Math.abs(d.delta)), 5);

  return (
    <div className="mt-3 bg-[#0e1417] rounded-xl p-5 border border-[#242424] w-full h-[320px] shadow-inner">
      <p className="text-xs font-bold text-[#00d1ff] mb-4 uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">trending_up</span> Improvement Delta
      </p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={deltaData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
          <XAxis 
            dataKey="metric" 
            stroke="#859399" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false}
            tick={{ dy: 10, fontWeight: 500 }}
          />
          <YAxis 
            stroke="#859399" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            domain={[-maxDelta - 2, maxDelta + 2]}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            contentStyle={{ backgroundColor: '#1a2123', borderColor: '#3c494e', borderRadius: '12px', fontSize: '12px', padding: '10px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
            labelStyle={{ color: '#dde3e7', fontWeight: 'bold', marginBottom: '4px' }}
            itemStyle={{ color: '#44e2cd' }}
            formatter={(value: any) => [`${value > 0 ? '+' : ''}${value} points`, 'Growth']}
          />
          <ReferenceLine y={0} stroke="#3c494e" strokeWidth={2} />
          <Bar 
            dataKey="delta" 
            name="Score Change"
            barSize={40}
          >
            {deltaData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.delta >= 0 ? '#44e2cd' : '#ef4444'} 
                className="transition-all duration-300 hover:opacity-80 cursor-pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
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
  const [showReportSelect, setShowReportSelect] = useState(false);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession.messages;

  const updateSession = useCallback((id: string, updater: (s: ChatSession) => ChatSession) => {
    setSessions(prev => prev.map(s => s.id === id ? updater(s) : s));
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  // Fetch all chat sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (dbSessions && dbSessions.length > 0) {
        const formattedSessions = await Promise.all(dbSessions.map(async (s) => {
          const { data: dbMessages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', s.id)
            .order('created_at', { ascending: true });

          return {
            id: s.id,
            name: s.name,
            createdAt: new Date(s.created_at).getTime(),
            messages: dbMessages?.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content
            })) || [WELCOME_MSG]
          };
        }));
        setSessions(formattedSessions);
        setActiveSessionId(formattedSessions[0].id);
      }
    };
    fetchSessions();
  }, []);

  // Load latest report from Supabase
  const loadReport = async (reportId?: string) => {
    setLoadingReport(true);
    setShowReportSelect(false);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      let query = supabase.from('interviews').select('title, score, feedback, report_data').eq('user_id', user.id);
      if (reportId) {
        query = query.eq('id', reportId);
      } else {
        query = query.order('created_at', { ascending: false }).limit(1);
      }
      
      const { data } = await query.maybeSingle();

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

  const loadAllReports = async () => {
    if (showReportSelect) {
      setShowReportSelect(false);
      return;
    }
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('interviews')
        .select('id, title, score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setPastReports(data);
      setShowReportSelect(true);
      setShowSessions(false);
    } catch (e) {
      console.error(e);
    }
  };

  const addBotMessage = async (content: string, metrics?: { label: string; score: number }[]) => {
    const fullContent = metrics ? `__METRICS__${JSON.stringify(metrics)}__\n${content}` : content;
    const msg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: fullContent,
    };
    updateSession(activeSessionId, s => ({ ...s, messages: [...s.messages, msg] }));

    // Save to DB
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    if (activeSessionId !== 'default') {
      await supabase.from('chat_messages').insert({
        session_id: activeSessionId,
        role: 'assistant',
        content: fullContent
      });
    }
  };

  const newChat = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newSess } = await supabase.from('chat_sessions').insert({
      user_id: user.id,
      name: 'New Chat'
    }).select().single();

    if (newSess) {
      setSessions(prev => [{
        id: newSess.id,
        name: 'New Chat',
        messages: [WELCOME_MSG],
        createdAt: Date.now(),
      }, ...prev]);
      setActiveSessionId(newSess.id);
      
      // Save welcome message
      await supabase.from('chat_messages').insert({
        session_id: newSess.id,
        role: 'assistant',
        content: WELCOME_MSG.content
      });
    }
    
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

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let currentSessId = activeSessionId;
    
    // Create session if still default
    if (currentSessId === 'default') {
      const { data: newSess } = await supabase.from('chat_sessions').insert({
        user_id: user.id,
        name: text.substring(0, 40)
      }).select().single();
      
      if (newSess) {
        currentSessId = newSess.id;
        setActiveSessionId(newSess.id);
        // Save initial welcome message for this new session too
        await supabase.from('chat_messages').insert({
          session_id: newSess.id,
          role: 'assistant',
          content: WELCOME_MSG.content
        });
      }
    }

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    
    // Optimistic Update
    updateSession(activeSessionId === 'default' ? currentSessId : activeSessionId, s => ({
      ...s,
      id: currentSessId,
      messages: [...s.messages, userMsg],
      name: s.name === 'New Chat' ? text.substring(0, 40) : s.name,
    }));

    // Save user message to DB
    await supabase.from('chat_messages').insert({
      session_id: currentSessId,
      role: 'user',
      content: text
    });

    // Update session name in DB if it was New Chat
    if (activeSession.name === 'New Chat') {
      await supabase.from('chat_sessions').update({ name: text.substring(0, 40) }).eq('id', currentSessId);
    }

    const botMsgId = (Date.now() + 1).toString();
    updateSession(currentSessId, s => ({
      ...s,
      messages: [...s.messages, { id: botMsgId, role: "assistant", content: "" }],
    }));

    // Build context-aware system message
    const systemContext = reportCtx
      ? `You are SAKSHAM.AI, an expert interview coach.
The user is currently reviewing this report: "${reportCtx.title}".
- Overall Score: ${reportCtx.score}/100
- Summary: ${reportCtx.summary}
- Metrics: ${JSON.stringify(reportCtx.metrics)}
- Strengths: ${JSON.stringify(reportCtx.strengths)}
- Improvements needed: ${JSON.stringify(reportCtx.improvements)}

CRITICAL: Refer to this interview by its title "${reportCtx.title}" throughout the conversation. Give specific, actionable coaching based on this data.`
      : "You are SAKSHAM.AI, an expert interview coach helping candidates improve their interview skills. Be concise, warm, and actionable.";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: systemContext,
          isCompare: text.toLowerCase().includes("compare"),
          stream: true,
          messages: [...messages, userMsg].map(m => ({
            role: m.role,
            content: m.content.replace(/^__METRICS__.*__\n/, ''), // strip metric markers
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullBotResponse = "";

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            fullBotResponse += chunk;
            updateSession(currentSessId, s => ({
              ...s,
              messages: s.messages.map(msg =>
                msg.id === botMsgId ? { ...msg, content: msg.content + chunk } : msg
              ),
            }));
          }
        }
        
        // Save full bot response to DB
        await supabase.from('chat_messages').insert({
          session_id: currentSessId,
          role: 'assistant',
          content: fullBotResponse
        });
      }
    } catch {
      updateSession(currentSessId, s => ({
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
        onMouseDown={handleDragStart}
        onClick={() => { if (!isDragging) setIsOpen(!isOpen); }}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
        className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all z-[60] cursor-move ${
          isOpen ? "bg-[#242b2e] text-[#dde3e7] rotate-90 scale-90" : "bg-[#00d1ff] text-[#001f28] hover:scale-110 active:scale-95"
        }`}
      >
        <span className="material-symbols-outlined text-2xl pointer-events-none">{isOpen ? "close" : "smart_toy"}</span>
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
                onClick={() => loadReport()}
                disabled={loadingReport}
                title="Load latest report"
                className="p-1.5 text-[#859399] hover:text-[#00d1ff] hover:bg-[#00d1ff]/10 rounded-lg transition-colors text-[11px] flex items-center gap-1"
              >
                {loadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-[18px]">analytics</span>}
              </button>
              {/* Select Report */}
              <button
                onClick={loadAllReports}
                title="Select a Report"
                className="p-1.5 text-[#859399] hover:text-[#00d1ff] hover:bg-[#00d1ff]/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">folder_open</span>
              </button>
              {/* Sessions */}
              <button
                onClick={() => { setShowSessions(!showSessions); setShowReportSelect(false); }}
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
            <div className="absolute top-[57px] left-0 w-full bg-[#0e1417] border-b border-[#242424] z-10 max-h-48 overflow-y-auto shadow-2xl">
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

          {/* Report Selection Sidebar */}
          {showReportSelect && (
            <div className="absolute top-[57px] left-0 w-full bg-[#0e1417] border-b border-[#242424] z-10 max-h-64 overflow-y-auto shadow-2xl">
              <div className="p-3 border-b border-[#242424] flex items-center justify-between bg-[#1a2123]">
                <span className="text-[10px] font-bold text-[#00d1ff] uppercase tracking-widest">Select Interview to Load</span>
                <button onClick={() => setShowReportSelect(false)} className="text-[#859399] hover:text-white">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="p-2 space-y-1">
                {pastReports.length === 0 ? (
                  <p className="text-xs text-[#859399] p-4 text-center italic">No reports found.</p>
                ) : (
                  pastReports.map(r => (
                    <button
                      key={r.id}
                      onClick={() => loadReport(r.id)}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm group transition-all hover:bg-[#00d1ff]/5 border border-transparent hover:border-[#00d1ff]/20"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-[#dde3e7] truncate group-hover:text-[#00d1ff] transition-colors">{r.title}</span>
                        <span className="text-[10px] text-[#44e2cd] font-bold bg-[#44e2cd]/10 px-1.5 py-0.5 rounded">Score: {r.score}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#859399]">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        {new Date(r.created_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
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
              const hasCompare = msg.content.includes('__COMPARE_DATA__');
              let metricsData: { label: string; score: number }[] = [];
              let compareData: any[] = [];
              let displayContent = msg.content;
              
              if (hasMetrics) {
                const match = displayContent.match(/^__METRICS__(.+)__\n([\s\S]*)$/);
                if (match) {
                  try { metricsData = JSON.parse(match[1]); } catch {}
                  displayContent = match[2];
                }
              }

              if (hasCompare) {
                const match = displayContent.match(/__COMPARE_DATA__([\s\S]*?)__COMPARE_DATA__/);
                if (match) {
                  try {
                    compareData = JSON.parse(match[1]);
                    displayContent = displayContent.replace(/__COMPARE_DATA__[\s\S]*?__COMPARE_DATA__/, '').trim();
                  } catch {}
                }
              }

              return (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full`}>
                  <div
                    className={`max-w-[85%] ${isMaximized ? 'xl:max-w-[70%]' : ''} p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#00d1ff] text-[#001f28] rounded-tr-sm font-medium shadow-[0_0_15px_rgba(0,209,255,0.2)]"
                        : "bg-[#1a2123] text-[#dde3e7] border border-[#3c494e] rounded-tl-sm shadow-lg"
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
                    {compareData.length > 0 && (
                      <div className={`mt-4 grid gap-4 ${isMaximized ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <SkillsRadarChart data={compareData} />
                        <ComparisonChart data={compareData} />
                      </div>
                    )}
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
                { icon: "analytics", label: "Load my report", action: () => loadReport() },
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
