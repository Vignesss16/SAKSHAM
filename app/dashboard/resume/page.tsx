"use client";
import { useState } from "react";
import Link from "next/link";

const skills = [
  { label: "React.js", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "TypeScript", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "Node.js", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "Next.js", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "Tailwind CSS", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "Redux", color: "text-[#00d1ff]", bg: "bg-[#00d1ff]/10", border: "border-[#00d1ff]/20" },
  { label: "System Design", color: "text-[#44e2cd]", bg: "bg-[#03c6b2]/10", border: "border-[#44e2cd]/20" },
  { label: "GraphQL", color: "text-[#44e2cd]", bg: "bg-[#03c6b2]/10", border: "border-[#44e2cd]/20" },
  { label: "AWS", color: "text-[#44e2cd]", bg: "bg-[#03c6b2]/10", border: "border-[#44e2cd]/20" },
  { label: "Unit Testing", color: "text-[#44e2cd]", bg: "bg-[#03c6b2]/10", border: "border-[#44e2cd]/20" },
];

export default function ResumePage() {
  const [fileUploaded] = useState(true);

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div className="max-w-7xl mx-auto p-8 space-y-10">
        {/* Upload Section */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">
              Upload Your Resume
            </h2>
            <p className="text-[#bbc9cf] text-base max-w-2xl">
              Our AI will parse your technical background to tailor interview simulations specifically for your expertise level.
            </p>
          </div>

          {/* Drop Zone */}
          <div className="relative w-full h-72 border-2 border-dashed border-[#3c494e] rounded-xl bg-[#1a2123] flex flex-col items-center justify-center transition-all hover:border-[#00d1ff] group cursor-pointer">
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="w-20 h-20 rounded-full bg-[#242b2e] flex items-center justify-center mb-6 group-hover:bg-[#00d1ff]/10 transition-colors">
              <span className="material-symbols-outlined text-4xl text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>
                upload_file
              </span>
            </div>
            <div className="text-center">
              <p className="font-['Plus_Jakarta_Sans'] text-xl font-semibold mb-2">Drag and drop your resume here</p>
              <p className="text-sm text-[#859399]">PDF or DOCX, up to 10 MB</p>
            </div>
            <button className="mt-8 px-8 py-3 bg-[#00d1ff] text-[#001f28] font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">
              Upload Resume
            </button>
          </div>
        </section>

        {/* Parsed Profile */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
              <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">Review Parsed Profile</h2>
              <p className="text-[#bbc9cf] text-base">We&apos;ve extracted these details from your document. Please verify for accuracy.</p>
            </div>
            <span className="px-4 py-1.5 rounded-full bg-[#03c6b2]/20 text-[#44e2cd] text-sm border border-[#44e2cd]/30 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              AI Parsing Complete
            </span>
          </div>

          {/* Warning */}
          <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 p-4 rounded-xl flex items-start gap-4">
            <span className="material-symbols-outlined text-[#ffb4ab] mt-0.5">warning</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-[#ffb4ab]">Warning: Low-quality parsing detected</p>
              <p className="text-xs text-[#bbc9cf]">Some formatting in your document might have confused our extractor. Please review your extracted info carefully.</p>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left col */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* Profile Card */}
              <div className="bg-[#1a2123] p-6 rounded-xl border border-[#3c494e]/30 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#2f3639] flex items-center justify-center">
                    <span className="text-3xl font-bold text-[#00d1ff]">AC</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-semibold">Alex Chen</h3>
                    <p className="text-[#859399] text-base">Senior Frontend Engineer • 6 Years Experience</p>
                    <p className="text-xs text-[#bbc9cf] flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      San Francisco, CA (Remote)
                    </p>
                  </div>
                </div>
                <button className="p-2 hover:bg-[#2f3639] rounded-lg transition-colors text-[#00D1FF]">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#859399]">Professional Experience</h4>
                  <button className="text-[#00d1ff] text-sm flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-sm">add</span> Add Role
                  </button>
                </div>

                {[
                  { co: "GO", title: "Senior Frontend Developer", company: "Google Cloud", period: "2021 — Present", desc: "Leading the migration of core dashboard components to React 18 and improving runtime performance by 40% using specialized caching strategies." },
                  { co: "ME", title: "Software Engineer II", company: "Meta Platforms", period: "2018 — 2021", desc: "Developed high-concurrency real-time messaging interfaces for Internal Tools, serving over 50,000 employees globally." },
                ].map((exp) => (
                  <div key={exp.co} className="bg-[#242b2e] p-6 rounded-xl border border-[#3c494e]/30 hover:border-[#00D1FF]/40 transition-colors group">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center font-bold text-xs">{exp.co}</div>
                          <p className="font-bold text-[#dde3e7]">{exp.title}</p>
                        </div>
                        <p className="text-xs text-[#00D1FF]">{exp.company} • {exp.period}</p>
                        <p className="text-[#bbc9cf] text-sm leading-relaxed">{exp.desc}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#2f3639] rounded-lg transition-all text-[#859399]">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#859399] px-2">Education</h4>
                <div className="bg-[#242b2e] p-6 rounded-xl border border-[#3c494e]/30 group">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <p className="font-bold text-[#dde3e7]">M.S. Computer Science</p>
                      <p className="text-[#bbc9cf] text-base">Stanford University • Class of 2018</p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#2f3639] rounded-lg transition-all text-[#859399]">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right col */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Skills */}
              <div className="bg-[#1a2123] p-6 rounded-xl border border-[#3c494e]/30 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#859399]">Skills extracted</h4>
                  <button className="text-[#00D1FF]"><span className="material-symbols-outlined text-lg">edit_note</span></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s.label} className={`px-3 py-1 ${s.bg} ${s.color} text-xs border ${s.border} rounded-lg`}>{s.label}</span>
                  ))}
                  <button className="px-3 py-1 bg-[#2f3639] text-[#3c494e] text-xs rounded-lg border border-dashed border-[#3c494e]/40">+ Add skill</button>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="relative bg-[#1a2123] rounded-xl p-6 space-y-4 border border-[#00d1ff]/30">
                <div className="absolute inset-[-1px] rounded-xl bg-gradient-to-r from-[#00d1ff] to-[#03c6b2] -z-10 rounded-[13px]"></div>
                <div className="flex items-center gap-2 text-[#00d1ff]">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  <p className="text-sm font-bold">AI Profile Summary</p>
                </div>
                <p className="text-xs text-[#bbc9cf] italic leading-relaxed">
                  &quot;Candidate shows strong proficiency in high-scale Frontend architectures. We recommend focusing the upcoming mock interview on <strong>State Management Patterns</strong> and <strong>React Rendering Pipelines</strong> based on their recent Google tenure.&quot;
                </p>
                <div className="pt-4 border-t border-[#3c494e]/20 flex flex-col gap-3">
                  <p className="text-[10px] uppercase font-black text-[#859399]">Recommended Path</p>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#44e2cd]"></div>
                    <span className="text-xs font-medium">Big Tech Systems Engineer</span>
                  </div>
                </div>
              </div>

              {/* Resume Preview */}
              <div className="bg-[#1a2123] p-4 rounded-xl border border-[#3c494e]/30 flex items-center gap-4 cursor-zoom-in group">
                <div className="w-12 h-16 bg-[#2f3639] rounded border border-[#3c494e]/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#859399]">description</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold">resume_v4_final.pdf</p>
                  <p className="text-[10px] text-[#859399]">Uploaded 2 minutes ago • 1.2 MB</p>
                </div>
                <span className="material-symbols-outlined text-[#859399] group-hover:text-[#00d1ff] transition-colors">visibility</span>
              </div>
            </div>
          </div>
        </section>

        {/* Spacer for sticky bar */}
        <div className="h-24"></div>
      </div>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-[#0e1417]/80 backdrop-blur-lg border-t border-[#242424] flex justify-end gap-6 z-20">
        <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-lg text-[#dde3e7] border border-[#3c494e] hover:bg-[#2f3639] transition-colors font-medium">
          Discard and Re-upload
        </button>
        <Link href="/dashboard/new" className="px-10 py-2.5 rounded-lg bg-[#00d1ff] text-[#001f28] font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
          Save Profile and Continue
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
