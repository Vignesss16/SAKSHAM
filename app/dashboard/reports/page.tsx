"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const [compareFile, setCompareFile] = useState<File | null>(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState('');

  useEffect(() => {
    async function fetchReport() {
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
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  const handleCompare = async () => {
    if (!compareFile || !report) return;
    setComparing(true);
    setCompareResult('');
    try {
      const text = await compareFile.text();
      const currentReport = JSON.stringify(report.report_data || {});
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are an interview coach. Compare these two interview reports and tell me:
1. Overall score improvement (%)
2. Change in each metric (Content Quality, Clarity, Confidence, Technical Accuracy)
3. What improved most
4. What still needs work
5. A motivational summary

Previous Report:
${text}

Current Report:
${currentReport}

Be specific with numbers and give a warm, coach-like response.`
            }
          ]
        })
      });
      const data = await res.json();
      setCompareResult(data.text || data.message || 'Comparison complete.');
    } catch (err: any) {
      setCompareResult('Failed to compare reports: ' + err.message);
    } finally {
      setComparing(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0e1417] text-white flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" /></div>;
  if (error || !report) return (
    <div className="min-h-screen bg-[#0e1417] text-white flex flex-col justify-center items-center gap-4">
      <p className="text-red-400">{error || "No reports found."}</p>
      <Link href="/dashboard" className="btn-primary">Return to Dashboard</Link>
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
        {/* PDF Watermark (only visible when printing/exporting) */}
        <div className="hidden pdf-watermark absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
          <h1 className="text-9xl font-black transform -rotate-45">SAKSHAM.AI Authenticated</h1>
        </div>

        {/* Hero bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Score gauge */}
          <div className="lg:col-span-4 bg-[#1A1A1A] border border-[#242424] rounded-xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative w-48 h-48 mb-6">
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
                <span className="text-5xl font-extrabold text-white">{score}</span>
                <span className="text-gray-500 font-bold">/100</span>
              </div>
            </div>
            <div className="bg-[#03c6b2]/20 text-[#44e2cd] border border-[#44e2cd]/30 px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-widest">
              {score >= 80 ? 'Strong Candidate' : score >= 60 ? 'Average Candidate' : 'Needs Practice'}
            </div>
            <p className="text-gray-400 text-sm max-w-[240px]">{report.title || 'Mock Interview Report'}</p>
          </div>

          {/* AI Summary */}
          <div className="lg:col-span-8 relative bg-[#1a1a1a] rounded-xl p-8 flex flex-col justify-between border border-[#00d1ff]/40">
            <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-[#00d1ff] to-[#03c6b2] -z-10 rounded-[13px]"></div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#242424] p-2 rounded-lg">
                  <span className="material-symbols-outlined text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold text-white">AI Comprehensive Review</h2>
              </div>
              <p className="text-[#bbc9cf] text-lg mb-6 leading-relaxed">{report.feedback || "Your report summary will appear here."}</p>
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
        </div>

        {/* Compare Panel */}
        {showCompare && (
          <div className="bg-[#1a1a1a] border border-[#00d1ff]/30 rounded-xl p-6 space-y-4">
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d1ff]">compare_arrows</span>
              Progress Comparison
            </h3>
            <p className="text-sm text-[#859399]">Upload a previous report (JSON file from your browser or copy-paste the JSON) to compare your progress.</p>
            <div className="flex items-center gap-4">
              <label className="flex-1 border-2 border-dashed border-[#3c494e] rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#00d1ff] transition-colors">
                <span className="material-symbols-outlined text-[#00d1ff]">upload_file</span>
                <span className="text-sm text-[#bbc9cf]">{compareFile ? compareFile.name : 'Upload previous report JSON'}</span>
                <input type="file" accept=".json,.txt" className="hidden" onChange={e => setCompareFile(e.target.files?.[0] || null)} />
              </label>
              <button
                onClick={handleCompare}
                disabled={!compareFile || comparing}
                className="px-6 py-3 bg-[#00d1ff] text-[#001f28] rounded-lg font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="material-symbols-outlined text-sm">psychology</span>}
                {comparing ? 'Analyzing...' : 'Compare'}
              </button>
            </div>
            {compareResult && (
              <div className="bg-[#0e1417] rounded-xl p-6 border border-[#242424]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                  <span className="font-bold text-white text-sm">SAKSHAM.AI Coach</span>
                </div>
                <p className="text-[#bbc9cf] text-sm leading-relaxed whitespace-pre-line">{compareResult}</p>
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
