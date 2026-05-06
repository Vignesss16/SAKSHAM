"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line, Area } from 'recharts';

// Static resource map for recommendations
const RESOURCE_MAP: { keywords: string[]; title: string; url: string; desc: string }[] = [
  { keywords: ["communication", "clarity", "confidence", "verbal"], title: "Toastmasters International", url: "https://www.toastmasters.org", desc: "Practice public speaking and communication skills" },
  { keywords: ["communication", "clarity", "verbal"], title: "Coursera — Public Speaking", url: "https://www.coursera.org/learn/public-speaking", desc: "University-level public speaking course" },
  { keywords: ["system design", "architecture", "scalability"], title: "Grokking System Design", url: "https://www.designgurus.io/course/grokking-the-system-design-interview", desc: "Comprehensive system design interview prep" },
  { keywords: ["system design", "architecture"], title: "ByteByteGo", url: "https://bytebytego.com", desc: "Visual system design explained by Alex Xu" },
  { keywords: ["data structures", "algorithms", "dsa", "leetcode"], title: "LeetCode", url: "https://leetcode.com", desc: "Practice coding problems for technical interviews" },
  { keywords: ["data structures", "algorithms", "dsa"], title: "NeetCode.io", url: "https://neetcode.io", desc: "Structured DSA roadmap with video explanations" },
  { keywords: ["behavioral", "star", "teamwork", "leadership"], title: "STAR Method Guide", url: "https://www.indeed.com/career-advice/interviewing/how-to-use-the-star-interview-response-technique", desc: "Master behavioral interview storytelling" },
  { keywords: ["behavioral", "leadership", "culture"], title: "Big Interview", url: "https://biginterview.com", desc: "AI-powered behavioral interview coaching" },
];

const DEFAULT_RESOURCES = [
  { title: "InterviewBit", url: "https://www.interviewbit.com", desc: "Comprehensive coding and interview practice" },
  { title: "GeeksForGeeks", url: "https://www.geeksforgeeks.org", desc: "CS fundamentals and interview questions" },
];

function getResources(improvements: any[]): typeof DEFAULT_RESOURCES {
  const improvementText = improvements.map((i: any) => `${i.title} ${i.desc}`).join(" ").toLowerCase();
  const matched = RESOURCE_MAP.filter(r => r.keywords.some(k => improvementText.includes(k)));
  const unique = Array.from(new Map(matched.map(r => [r.title, r])).values()).slice(0, 5);
  return unique.length > 0 ? unique : DEFAULT_RESOURCES;
}

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [pastReports, setPastReports] = useState<any[]>([]);
  const [selectedPastId, setSelectedPastId] = useState('');
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState('');
  const [compareData, setCompareData] = useState<any[] | null>(null);
  const [transcriptComparisons, setTranscriptComparisons] = useState<any[] | null>(null);
  const [analyzingTranscript, setAnalyzingTranscript] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  useEffect(() => {
    async function fetchReport() {
      setTranscriptComparisons(null);
      setLoading(true);
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        let data: any = null;
        let dbError: any = null;

        if (id) {
          const result = await supabase.from('interviews').select('*').eq('user_id', user.id).eq('id', id).maybeSingle();
          data = result.data; dbError = result.error;
        } else {
          const result = await supabase.from('interviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
          data = result.data; dbError = result.error;
        }

        if (dbError) throw dbError;
        if (data) {
          const reportData = data.report_data || {};
          let transcriptText = data.transcript;
          if (!transcriptText && reportData.raw_transcript) {
            transcriptText = reportData.raw_transcript.map((m: any) => 
              `${m.uid === 'agent' ? 'Interviewer' : 'Candidate'}: ${m.text}`
            ).join('\n\n');
          }
          setReport({
            ...data,
            ...reportData,
            transcript: transcriptText
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  // Fetch past reports for comparison selector and trend chart
  useEffect(() => {
    if (!report?.id) return;
    async function loadPast() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('interviews')
        .select('id, title, score, created_at, report_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      // Store all for trend, but filter current for comparison dropdown
      setPastReports(data || []);
    }
    loadPast();
  }, [report?.id]);

  const handleCompare = async () => {
    if (!selectedPastId || !report) return;
    const past = pastReports.find(r => r.id === selectedPastId);
    if (!past) return;
    setComparing(true);
    setCompareResult('');
    try {
      const reportData = report.report_data || {};
      const strengths = reportData.strengths || [];
      const improvements = reportData.improvements || [];
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCompare: true,
          messages: [{
            role: 'user',
            content: `STRICT ONE-TO-ONE COMPARISON TASK:
Compare these two reports and ONLY these two. Ignore all other history.

1. ${past.title} (PAST)
- Score: ${past.score}
- Summary: ${past.report_data?.summary || 'No summary available'}
- Metrics: ${JSON.stringify(past.report_data?.metrics || {}, null, 2)}
- Detailed Feedback: ${JSON.stringify(past.report_data?.metrics_feedback || {}, null, 2)}
- Strengths: ${JSON.stringify(past.report_data?.strengths?.map((s: any) => s.title) || [])}

2. ${report.title} (CURRENT)
- Score: ${report.score}
- Summary: ${reportData.summary || 'No summary available'}
- Metrics: ${JSON.stringify(reportData.metrics || {}, null, 2)}
- Detailed Feedback: ${JSON.stringify(reportData.metrics_feedback || {}, null, 2)}
- Strengths: ${JSON.stringify(strengths.map((s: any) => s.title))}

Provide a progress analysis focusing ONLY on these two sessions. Use the specific metrics and detailed feedback provided above to explain WHY scores changed. Do not invent data.
CRITICAL: Do NOT mention the JSON array or say "Here is a summary in JSON" in your response. Just append the __COMPARE_DATA__ block at the very end silently.`
          }]
        })
      });
      const data = await res.json();
      let responseText = data.text || data.response || data.message || 'Comparison complete.';
      let extractedData = null;

      const match = responseText.match(/__COMPARE_DATA__([\s\S]*?)__COMPARE_DATA__/);
      if (match) {
        try {
          extractedData = JSON.parse(match[1]);
          responseText = responseText.replace(/__COMPARE_DATA__[\s\S]*?__COMPARE_DATA__/, '').trim();
        } catch (e) {
          console.error("Failed to parse compare data", e);
        }
      }

      setCompareResult(responseText);
      setCompareData(extractedData);
    } catch (err: any) {
      setCompareResult('Failed to compare: ' + err.message);
      setCompareData(null);
    } finally {
      setComparing(false);
    }
  };

  const setReportAndNavigate = (interviewId: string) => {
    setReport(null);
    router.push(`/dashboard/reports?id=${interviewId}`);
  };

  const handleGenerateSuggestions = async () => {
    if (!report?.id) return;
    setGeneratingSuggestions(true);
    try {
      const res = await fetch('/api/generate-mentor-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id }),
      });
      const data = await res.json();
      if (data.suggestedMentors) {
        setReport({ ...report, suggestedMentors: data.suggestedMentors });
      }
    } catch (err) {
      console.error("Failed to generate suggestions", err);
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleAnalyzeTranscript = async () => {
    if (!report?.transcript) return;
    setAnalyzingTranscript(true);
    try {
      const res = await fetch('/api/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: report.transcript })
      });
      const data = await res.json();
      setTranscriptComparisons(data.comparisons || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingTranscript(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0e1417] text-white flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" /></div>;
  if (error || !report) return (
    <div className="min-h-screen bg-[#0e1417] text-white flex flex-col justify-center items-center p-8">
      <div className="glass max-w-md w-full p-10 rounded-2xl text-center border-[#00d1ff]/20">
        <span className="material-symbols-outlined text-6xl text-[#00d1ff] mb-4">analytics</span>
        <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-black mb-3">No Reports Found</h2>
        <p className="text-[#bbc9cf] text-sm leading-relaxed mb-8">
          You haven't completed any AI interviews yet. Start your first session to generate a detailed performance report, evaluate your skills, and earn credits!
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard/new" className="btn-primary w-full justify-center py-3">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Take AI Interview
          </Link>
          <Link href="/dashboard" className="btn-ghost w-full justify-center">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );

  const reportData = report.report_data || {};
  const metrics = reportData.metrics || [
    { label: "Content Quality", score: 88, note: "Richness and relevance of technical answers provided." },
    { label: "Clarity", score: 75, note: "How clearly and articulately you explained complex concepts." },
    { label: "Confidence", score: 92, note: "Maintaining composure and pace throughout the session." },
    { label: "Technical Accuracy", score: 68, note: "Correctness of syntax and system architecture patterns." },
  ];
  const strengths = reportData.strengths || [];
  const improvements = reportData.improvements || [];
  const resources = getResources(improvements);
  const score = report.score || 0;
  const dashoffset = 502 - (502 * score) / 100;

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div id="report-container" className="p-8 max-w-7xl mx-auto space-y-6 relative bg-[#0e1417]">
        {/* Selection Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Performance Report
              <span className="text-xs bg-[#00d1ff]/10 text-[#00d1ff] px-2 py-0.5 rounded border border-[#00d1ff]/20 uppercase tracking-widest font-bold">Mock Interview</span>
            </h2>
            <p className="text-[#859399] mt-1 text-sm">Detailed analysis of your recent session and AI coaching feedback.</p>
          </div>

          {pastReports.length > 0 && (
            <div className="flex items-center gap-3 bg-[#1A1A1A] p-2 rounded-xl border border-[#242424] hover:border-[#00d1ff]/30 transition-all">
              <span className="material-symbols-outlined text-[#00d1ff] ml-2">history</span>
              <div className="flex flex-col">
                <span className="text-[10px] text-[#859399] font-bold uppercase tracking-wider px-1">Switch Session</span>
                <select 
                  value={report.id || ''} 
                  onChange={(e) => {
                    setReportAndNavigate(e.target.value);
                  }}
                  className="bg-transparent text-white text-xs font-bold border-none focus:ring-0 outline-none pr-8 cursor-pointer appearance-none"
                >
                  {pastReports.map((int) => (
                    <option key={int.id} value={int.id} className="bg-[#1A1A1A] text-white">
                      {int.title || 'Mock Interview'} ({new Date(int.created_at).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <span className="material-symbols-outlined text-[#859399] mr-2 text-[18px]">expand_more</span>
            </div>
          )}
        </div>

        {/* Hero bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Score gauge & Radar */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden flex-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                  <circle cx="96" cy="96" r="80" fill="transparent" stroke="#242424" strokeWidth="12" />
                  <circle cx="96" cy="96" r="80" fill="transparent" stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray="502" strokeDashoffset={dashoffset}
                    style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00D1FF" />
                      <stop offset="100%" stopColor="#03C6B2" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-white">{score}</span>
                  <span className="text-gray-500 font-bold text-xs">/100</span>
                </div>
              </div>
              <div className="bg-[#03c6b2]/20 text-[#44e2cd] border border-[#44e2cd]/30 px-3 py-1 rounded-full text-[10px] font-bold mb-3 uppercase tracking-widest">
                {score >= 80 ? 'Strong Candidate' : score >= 60 ? 'Average Candidate' : 'Needs Practice'}
              </div>
              <p className="text-gray-400 text-xs max-w-[200px] mb-4 truncate">{report.title || 'Mock Interview Report'}</p>
            </div>

            <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-6 h-64 relative overflow-hidden">
              <p className="text-[10px] font-bold text-[#00d1ff] uppercase tracking-widest mb-4">Skills Profile</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    "Content Quality", "Clarity", "Confidence", "Technical Accuracy"
                  ].map(label => {
                    const m = metrics.find((m: any) => m.label === label) || { score: 0 };
                    return { subject: label, score: m.score };
                  })}>
                    <PolarGrid stroke="#242424" />
                    {/* @ts-ignore - Recharts type incompatibility with React 18 */}
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#859399', fontSize: 8 }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#1a2123] border border-[#3c494e] p-2 rounded-lg shadow-xl">
                              <p className="text-[10px] font-bold text-[#00d1ff] uppercase mb-1">{payload[0].payload.subject}</p>
                              <p className="text-white text-xs font-black">{payload[0].value}/100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Radar name="Score" dataKey="score" stroke="#00d1ff" fill="#00d1ff" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Summary & Trend */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="relative bg-[#1a1a1a] rounded-xl p-8 flex flex-col justify-between border border-[#00d1ff]/40 flex-1">
              <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-[#00d1ff] to-[#03c6b2] -z-10 rounded-[13px]"></div>
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-[#242424] p-2 rounded-lg">
                    <span className="material-symbols-outlined text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  </div>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-white">AI Comprehensive Review</h2>
                </div>
                <p className="text-[#bbc9cf] text-lg mb-8 leading-relaxed">{report.feedback || "Your report summary will appear here."}</p>

                {/* Dynamic Performance Boosters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-[#00d1ff]/5 border border-[#00d1ff]/20 rounded-2xl p-5 flex items-start gap-4 hover:border-[#00d1ff]/40 transition-all group shadow-xl">
                    <div className="bg-[#00d1ff]/10 p-2.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[#00d1ff] text-2xl">person_book</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1 tracking-tight">1-on-1 Mentor Strategy</h4>
                      <p className="text-[#859399] text-[11px] leading-relaxed mb-3">Boost your score to 95+ with a personalized session. Connect with a mentor to polish your technical narrative.</p>
                      <Link href="/dashboard/mentors" className="text-[#00d1ff] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                        Find a Mentor <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  </div>

                  {metrics.some((m: any) => m.score < 85 && (m.label === "Technical Accuracy" || m.label === "Problem Solving")) && (
                    <div className="bg-[#03c6b2]/5 border border-[#03c6b2]/20 rounded-2xl p-5 flex items-start gap-4 hover:border-[#03c6b2]/40 transition-all group shadow-xl">
                      <div className="bg-[#03c6b2]/10 p-2.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[#03c6b2] text-2xl">code_blocks</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm mb-1 tracking-tight">Daily DSA Challenges</h4>
                        <p className="text-[#859399] text-[11px] leading-relaxed mb-3">Keep your coding logic sharp. Complete daily DSA rounds to maintain your technical edge.</p>
                        <Link href="/dashboard/daily" className="text-[#03c6b2] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                          Practice Daily <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={async () => {
                    try {
                      const { pdf } = await import('@react-pdf/renderer');
                      const { PdfReportTemplate } = await import('./PdfReportTemplate');
                      const blob = await pdf(
                        <PdfReportTemplate report={report} score={score} metrics={metrics} strengths={strengths} improvements={improvements} />
                      ).toBlob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `SAKSHAM_Report_${report.id?.substring(0, 8) || 'Export'}.pdf`;
                      link.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error("PDF Generation failed", err);
                      alert("Failed to generate PDF report.");
                    }
                  }}
                  className="bg-[#00d1ff] text-[#001f28] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">download</span> Download PDF
                </button>
                <button
                  onClick={() => setShowCompare(!showCompare)}
                  className="bg-transparent border border-[#242424] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#242424] active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined">compare_arrows</span> Compare with Previous
                </button>
              </div>
            </div>


            <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-6 h-64">
              <div className="flex justify-between items-center mb-4">
                <p className="text-[10px] font-bold text-[#00d1ff] uppercase tracking-widest">Progress Trend</p>
                <p className="text-[10px] text-[#859399]">Last {pastReports.length + 1} sessions</p>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...pastReports, { ...report, score }].filter((v, i, a) => v.id && a.findIndex(t => t.id === v.id) === i)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(r => ({ 
                      id: r.id,
                      date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }),
                      fullDate: new Date(r.created_at).toLocaleString(),
                      title: r.title || 'Mock Interview',
                      score: r.score,
                      isCurrent: r.id === report.id
                    }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                    <XAxis 
                      dataKey="id" 
                      stroke="#3c494e" 
                      fontSize={8} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(id) => {
                        const item = [...pastReports, report].find(r => r.id === id);
                        return item ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '';
                      }}
                    />
                    <YAxis stroke="#3c494e" fontSize={8} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ stroke: '#00d1ff', strokeWidth: 1, strokeDasharray: '4 4' }}
                      offset={20}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#1a2123]/95 backdrop-blur-md border border-[#3c494e] p-2.5 rounded-lg shadow-2xl min-w-[160px] max-w-[220px]">
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-[9px] font-bold text-[#859399] uppercase tracking-wider">{data.date}</p>
                                <p className="text-[10px] font-black text-[#00d1ff]">{payload[0].value}/100</p>
                              </div>
                              <p className="text-[11px] font-bold text-white leading-tight mb-1">
                                {data.isCurrent && <span className="text-[#00d1ff] mr-1">●</span>}
                                {data.title}
                              </p>
                              <p className="text-[8px] text-gray-500 italic border-t border-[#242424] pt-1 mt-1">{data.fullDate}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* @ts-ignore - Recharts type incompatibility with React 18 */}
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#00d1ff" 
                      strokeWidth={3} 
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (payload.isCurrent) {
                          return <circle key={payload.id} cx={cx} cy={cy} r={6} fill="#00d1ff" stroke="#121212" strokeWidth={2} />;
                        }
                        return <circle key={payload.id} cx={cx} cy={cy} r={4} fill="#3c494e" />;
                      }}
                      activeDot={{ r: 8, stroke: '#00d1ff', strokeWidth: 2, fill: '#121212' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Compare Panel */}
        {showCompare && (
          <div className="bg-[#1a1a1a] border border-[#00d1ff]/30 rounded-xl p-6 space-y-4">
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d1ff]">compare_arrows</span>
              Progress Comparison
            </h3>
            <p className="text-sm text-[#859399]">Select a previous interview from your history to compare your progress — no file upload needed.</p>
            <div className="flex items-center gap-4">
              <select
                value={selectedPastId}
                onChange={e => setSelectedPastId(e.target.value)}
                className="flex-1 bg-[#0e1417] border border-[#3c494e] rounded-xl px-4 py-3 text-sm text-[#dde3e7] focus:border-[#00d1ff] outline-none"
              >
                <option value="">— Select a previous interview —</option>
                {pastReports.filter(r => r.id !== report?.id).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title || 'Interview'} · Score: {r.score ?? '--'} · {new Date(r.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
              <button
                onClick={handleCompare}
                disabled={!selectedPastId || comparing}
                className="px-6 py-3 bg-[#00d1ff] text-[#001f28] rounded-lg font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-sm">psychology</span>}
                {comparing ? 'Analyzing...' : 'Compare'}
              </button>
            </div>
            {pastReports.length === 0 && (
              <p className="text-xs text-[#ffb4ab]">No other interview reports found. Complete more interviews to compare progress.</p>
            )}
            {compareResult && (
              <div className="flex flex-col lg:flex-row gap-6 mt-4">
                <div className="flex-1 bg-[#0e1417] rounded-xl p-6 border border-[#242424]">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#242424]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                      <span className="font-bold text-white text-sm">SAKSHAM.AI Coach Analysis</span>
                    </div>
                    <div className="text-[10px] bg-[#00d1ff]/10 text-[#00d1ff] px-2 py-1 rounded-md border border-[#00d1ff]/20">
                      Comparing: {report.title} vs {pastReports.find(r => r.id === selectedPastId)?.title}
                    </div>
                  </div>
                  <p className="text-[#bbc9cf] text-sm leading-relaxed whitespace-pre-line">{compareResult}</p>
                </div>
                {compareData && compareData.length > 0 && (
                  <div className="flex-1 bg-[#0e1417] rounded-xl p-6 border border-[#242424] flex flex-col justify-center">
                    <h4 className="text-xs font-bold text-[#00d1ff] uppercase tracking-wider mb-4">Metrics Comparison</h4>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={compareData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#242424" vertical={false} />
                          <XAxis dataKey="metric" stroke="#859399" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#859399" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1a2123', borderColor: '#3c494e', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar dataKey="past" name="Previous Interview" fill="#3c494e" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="current" name="Current Interview" fill="#00d1ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m: any) => {
            const barColor = m.score < 40 ? '#ef4444' : '#00d1ff';
            const scoreColor = m.score < 40 ? '#ef4444' : '#44e2cd';
            return (
              <div key={m.label} className="bg-[#1A1A1A] border border-[#242424] p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">{m.label}</span>
                  <span className="font-bold" style={{ color: scoreColor }}>{m.score}/100</span>
                </div>
                <div className="w-full bg-[#242424] h-2 rounded-full mb-4">
                  <div className="h-full rounded-full transition-all" style={{ width: `${m.score}%`, backgroundColor: barColor }}></div>
                </div>
                <p className="text-xs text-gray-500">{m.note}</p>
              </div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
            <div className="bg-[#03c6b2]/10 px-6 py-4 border-b border-[#242424]">
              <h3 className="flex items-center gap-2 text-[#44e2cd] font-bold">
                <span className="material-symbols-outlined">trending_up</span> Key Strengths
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {strengths.length > 0 ? strengths.map((s: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <span className="material-symbols-outlined text-[#44e2cd] shrink-0">check_circle</span>
                  <div>
                    <p className="text-white font-bold">{s.title}</p>
                    <p className="text-sm text-gray-400">{s.desc}</p>
                  </div>
                </div>
              )) : <p className="text-gray-500 italic">No specific strengths recorded.</p>}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
            <div className="bg-[#ffb4ab]/10 px-6 py-4 border-b border-[#242424]">
              <h3 className="flex items-center gap-2 text-[#ffb4ab] font-bold">
                <span className="material-symbols-outlined">warning</span> Areas of Improvement
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {improvements.length > 0 ? improvements.map((i: any, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <span className="material-symbols-outlined text-[#ffb4ab] shrink-0">cancel</span>
                  <div>
                    <p className="text-white font-bold">{i.title}</p>
                    <p className="text-sm text-gray-400">{i.desc}</p>
                  </div>
                </div>
              )) : <p className="text-gray-500 italic">No specific improvements recorded.</p>}
            </div>
          </div>
        </div>
        
        {/* AI Suggested Mentors */}
        {report.suggestedMentors && report.suggestedMentors.length > 0 ? (
          <div className="bg-[#1A1A1A] border border-[#00d1ff]/20 rounded-xl overflow-hidden shadow-[0_0_50px_-12px_rgba(0,209,255,0.15)]">
            <div className="bg-[#00d1ff]/10 px-6 py-4 border-b border-[#242424] flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-[#00d1ff] font-bold">
                <span className="material-symbols-outlined">psychology</span> AI Personalized Mentor Recommendations
              </h3>
              <span className="text-[10px] font-black bg-[#00d1ff]/20 text-[#00d1ff] px-2 py-1 rounded border border-[#00d1ff]/30 uppercase tracking-tighter">Powered by SAKSHAM AI</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.suggestedMentors.map((mentor: any, idx: number) => (
                <div key={idx} className="bg-[#0e1417] border border-[#242424] rounded-2xl p-5 hover:border-[#00d1ff]/40 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#00d1ff]/10 to-transparent -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-[#242424] flex items-center justify-center border border-[#3c494e] group-hover:border-[#00d1ff]/50 transition-colors">
                      <span className="material-symbols-outlined text-[#00d1ff] text-2xl">person</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg mb-1">{mentor.name}</h4>
                      <p className="text-[#859399] text-xs mb-4 leading-relaxed line-clamp-3 italic">
                        &ldquo;{mentor.reason}&rdquo;
                      </p>
                      <Link 
                        href={`/dashboard/mentors?id=${mentor.id}`} 
                        className="inline-flex items-center gap-2 bg-[#00d1ff]/10 hover:bg-[#00d1ff] text-[#00d1ff] hover:text-[#001f28] px-4 py-2 rounded-lg text-xs font-bold transition-all border border-[#00d1ff]/20 active:scale-95"
                      >
                        Book Session <span className="material-symbols-outlined text-sm">event_available</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-8 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d1ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-16 h-16 bg-[#242424] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#3c494e] group-hover:border-[#00d1ff]/40 transition-all">
                <span className="material-symbols-outlined text-3xl text-[#00d1ff] animate-pulse">psychology</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Unlock AI Mentor Matching</h3>
              <p className="text-[#859399] text-xs mb-6">This is an older report. Use our AI to analyze your performance and suggest the perfect mentors for your growth.</p>
              <button 
                onClick={handleGenerateSuggestions}
                disabled={generatingSuggestions}
                className="bg-[#00d1ff] text-[#001f28] px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
              >
                {generatingSuggestions ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-sm">bolt</span>}
                {generatingSuggestions ? 'Matching...' : 'Find My Ideal Mentors'}
              </button>
            </div>
          </div>
        )}

        {/* Recommended Resources */}
        <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
          <div className="bg-[#00d1ff]/10 px-6 py-4 border-b border-[#242424]">
            <h3 className="flex items-center gap-2 text-[#00d1ff] font-bold">
              <span className="material-symbols-outlined">menu_book</span> Recommended Resources
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r, idx) => (
              <a key={idx} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-xl bg-[#0e1417] border border-[#242424] hover:border-[#00d1ff]/40 transition-colors group">
                <span className="material-symbols-outlined text-[#00d1ff] mt-0.5 shrink-0 group-hover:scale-110 transition-transform">open_in_new</span>
                <div>
                  <p className="font-bold text-white text-sm">{r.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* AI Answer Optimizer */}
        <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl overflow-hidden">
          <div className="bg-[#03c6b2]/10 px-6 py-4 border-b border-[#242424] flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[#44e2cd] font-bold">
              <span className="material-symbols-outlined">auto_fix_high</span> Student Said vs. Optimal Answer
            </h3>
            {!transcriptComparisons && report.transcript && (
              <button 
                onClick={handleAnalyzeTranscript}
                disabled={analyzingTranscript}
                className="text-[10px] font-bold bg-[#03c6b2]/20 text-[#44e2cd] border border-[#44e2cd]/30 px-3 py-1 rounded-full uppercase tracking-widest hover:bg-[#03c6b2]/30 transition-all flex items-center gap-2"
              >
                {analyzingTranscript ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="material-symbols-outlined text-[14px]">bolt</span>}
                {analyzingTranscript ? 'Analyzing Transcript...' : 'Analyze My Answers'}
              </button>
            )}
          </div>
          <div className="p-6 space-y-8">
            {!report.transcript ? (
              <p className="text-gray-500 italic text-center py-4">No transcript available for this session.</p>
            ) : !transcriptComparisons ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-[#242424] rounded-full flex items-center justify-center mx-auto">
                  <span className="material-symbols-outlined text-3xl text-gray-600">description</span>
                </div>
                <div>
                  <p className="text-[#bbc9cf] font-medium">Full interview transcript is secured.</p>
                  <p className="text-xs text-gray-500 mt-1">Unlock detailed comparisons between your answers and industry-standard responses.</p>
                </div>
                <button 
                  onClick={handleAnalyzeTranscript}
                  disabled={analyzingTranscript}
                  className="px-8 py-3 bg-[#03c6b2]/10 border border-[#44e2cd]/30 text-[#44e2cd] rounded-lg font-bold hover:bg-[#03c6b2]/20 transition-all"
                >
                  {analyzingTranscript ? 'Processing Transcript...' : 'Generate Answer Comparisons'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8">
                {transcriptComparisons.map((c, i) => (
                  <div key={i} className="space-y-4 border-b border-[#242424] pb-8 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#242424] flex items-center justify-center text-[10px] font-bold text-[#859399] shrink-0 mt-0.5">{i+1}</span>
                      <h4 className="text-white font-bold text-lg leading-tight">{c.question}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#0e1417] border border-[#242424] p-5 rounded-xl space-y-3">
                        <p className="text-[10px] font-bold text-[#859399] uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">person</span> What You Said
                        </p>
                        <p className="text-sm text-[#bbc9cf] leading-relaxed italic">&ldquo;{c.studentSaid}&rdquo;</p>
                      </div>
                      
                      <div className="bg-[#03c6b2]/5 border border-[#44e2cd]/20 p-5 rounded-xl space-y-3">
                        <p className="text-[10px] font-bold text-[#44e2cd] uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">star</span> Optimal Placement Answer
                        </p>
                        <p className="text-sm text-white leading-relaxed font-medium">{c.optimalAnswer}</p>
                      </div>
                    </div>

                    <div className="bg-[#00d1ff]/5 border border-[#00d1ff]/20 p-4 rounded-xl flex gap-3">
                      <span className="material-symbols-outlined text-[#00d1ff] text-[18px] mt-0.5">lightbulb</span>
                      <div>
                        <p className="text-xs font-bold text-[#00d1ff] uppercase tracking-widest mb-1">Coach&apos;s Note</p>
                        <p className="text-xs text-[#bbc9cf] leading-relaxed">{c.coachNote}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="pb-8"></div>

      <footer className="flex flex-col items-center gap-4 w-full py-12 border-t border-[#242424] bg-[#121212] text-xs mt-8">
        <div className="font-bold text-[#00D1FF]">SAKSHAM.AI</div>
        <div className="flex gap-6 text-gray-600">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
        </div>
        <p className="text-gray-500">© 2024 SAKSHAM.AI. Professional Excellence.</p>
      </footer>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0e1417] flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" /></div>}>
      <ReportsContent />
    </Suspense>
  );
}
