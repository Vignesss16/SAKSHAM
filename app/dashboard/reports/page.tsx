"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ReportsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          const result = await supabase
            .from('interviews')
            .select('*')
            .eq('user_id', user.id)
            .eq('id', id)
            .maybeSingle();
          data = result.data;
          dbError = result.error;
        } else {
          const result = await supabase
            .from('interviews')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          data = result.data;
          dbError = result.error;
        }
        
        if (dbError) throw dbError;
        setReport(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1417] text-white flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#0e1417] text-white flex flex-col justify-center items-center gap-4">
        <p className="text-red-400">{error || "No reports found."}</p>
        <Link href="/dashboard" className="btn-primary">Return to Dashboard</Link>
      </div>
    );
  }

  const reportData = report.report_data || {};
  const metrics = reportData.metrics || [
    { label: "Content Quality", score: 88, note: "Richness and relevance of technical answers provided." },
    { label: "Clarity", score: 75, note: "How clearly and articulately you explained complex concepts." },
    { label: "Confidence", score: 92, note: "Maintaining composure and pace throughout the session." },
    { label: "Technical Accuracy", score: 68, note: "Correctness of syntax and system architecture patterns." },
  ];
  
  const strengths = reportData.strengths || [];
  const improvements = reportData.improvements || [];

  const score = report.score || 0;
  // SVG ring logic: circumference ≈ 502 for r=80.
  const dashoffset = 502 - (502 * score) / 100;

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div id="report-container" className="p-8 max-w-7xl mx-auto space-y-6 relative bg-[#0e1417]">
        {/* PDF Watermark (only visible when printing/exporting) */}
        <div className="hidden pdf-watermark absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none z-0">
          <h1 className="text-9xl font-black transform -rotate-45">PrepAI Authenticated</h1>
        </div>

        {/* Hero bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          {/* Score gauge */}
          <div className="lg:col-span-4 bg-[#1A1A1A] border border-[#242424] rounded-xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d1ff]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative w-48 h-48 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
                <circle cx="96" cy="96" r="80" fill="transparent" stroke="#242424" strokeWidth="12" />
                <circle
                  cx="96" cy="96" r="80" fill="transparent"
                  stroke="url(#grad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="502" strokeDashoffset={dashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
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
            <p className="text-gray-400 text-sm max-w-[240px]">
              {report.title || 'Mock Interview Report'}
            </p>
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
              <p className="text-[#bbc9cf] text-lg mb-6 leading-relaxed">
                {report.feedback || "Your report summary will appear here."}
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  try {
                    const { pdf } = await import('@react-pdf/renderer');
                    const { PdfReportTemplate } = await import('./PdfReportTemplate');
                    
                    const blob = await pdf(
                      <PdfReportTemplate 
                        report={report} 
                        score={score} 
                        metrics={metrics} 
                        strengths={strengths} 
                        improvements={improvements} 
                      />
                    ).toBlob();
                    
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `PrepAI_Report_${report.id?.substring(0, 8) || 'Export'}.pdf`;
                    link.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    console.error("PDF Generation failed", err);
                    alert("Failed to generate PDF report.");
                  }
                }} 
                className="bg-[#00d1ff] text-[#001f28] px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined">download</span> Download PDF Report
              </button>
              <button className="bg-transparent border border-[#242424] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-[#242424] active:scale-95 transition-all">
                <span className="material-symbols-outlined">share</span> Share Link
              </button>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m: any, idx: number) => {
            const colors = ["bg-[#00d1ff]", "bg-[#03c6b2]", "bg-[#ffb4ab]", "bg-[#c4b5fd]"];
            const color = colors[idx % colors.length];
            return (
              <div key={m.label} className="bg-[#1A1A1A] border border-[#242424] p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400 font-bold uppercase text-xs tracking-wider">{m.label}</span>
                  <span className="text-white font-bold">{m.score}/100</span>
                </div>
                <div className="w-full bg-[#242424] h-2 rounded-full mb-4">
                  <div className={`${color} h-full rounded-full`} style={{ width: `${m.score}%` }}></div>
                </div>
                <p className="text-xs text-gray-500">{m.note}</p>
              </div>
            );
          })}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
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
              )) : (
                <p className="text-gray-500 italic">No specific strengths recorded.</p>
              )}
            </div>
          </div>

          {/* Improvements */}
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
              )) : (
                <p className="text-gray-500 italic">No specific improvements recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Padding instead of hidden template */}
      <div className="pb-8"></div>

      <footer className="flex flex-col items-center gap-4 w-full py-12 border-t border-[#242424] bg-[#121212] text-xs mt-8">
        <div className="font-bold text-[#00D1FF]">PrepAI</div>
        <div className="flex gap-6 text-gray-600">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
        </div>
        <p className="text-gray-500">© 2024 PrepAI. Professional Excellence.</p>
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
