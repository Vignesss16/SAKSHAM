"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface SectionBreakdown {
  section: string;
  is_weak: boolean;
  weak_bullets: string[];
  suggested_bullets: string[];
}

interface AnalysisResult {
  score: number;
  ats_score?: number;
  strengths: string[];
  weaknesses: string[];
  tips: string[];
  section_breakdown?: SectionBreakdown[];
}

interface SavedResume {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  is_default: boolean;
}

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<'saved' | 'upload'>('saved');
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [userName, setUserName] = useState("Student");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<SavedResume | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("user_name");
    if (name) setUserName(name);
    fetchSavedResumes();
  }, []);

  const fetchSavedResumes = async () => {
    setLoadingResumes(true);
    try {
      const res = await fetch('/api/resume/list');
      const data = await res.json();
      const resumes = data.resumes || [];
      setSavedResumes(resumes);
      if (resumes.length === 0) setActiveTab('upload');
    } catch {
      setActiveTab('upload');
    } finally {
      setLoadingResumes(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    const formData = new FormData();
    formData.append("resume", file);
    try {
      const res = await fetch("/api/analyze-resume", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setFileName(file.name);
    setFileUploaded(true);

    if (saveToProfile) {
      const uploadForm = new FormData();
      uploadForm.append('file', file);
      uploadForm.append('setAsDefault', setAsDefault ? 'true' : 'false');
      try {
        const uploadRes = await fetch('/api/resume/upload', { method: 'POST', body: uploadForm });
        if (uploadRes.ok) {
          showToast("✓ Resume saved to your profile!");
          await fetchSavedResumes();
          setActiveTab('saved');
        }
      } catch {}
    }

    await analyzeFile(file);
  };

  const handleAnalyzeSaved = async (resume: SavedResume) => {
    setIsAnalyzing(true);
    setError("");
    setAnalysis(null);
    try {
      const blobRes = await fetch(resume.file_url);
      const blob = await blobRes.blob();
      const file = new File([blob], resume.file_name, { type: 'application/pdf' });
      await analyzeFile(file);
      setFileName(resume.file_name);
    } catch (err: any) {
      setError("Failed to fetch resume for analysis.");
      setIsAnalyzing(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    await fetch('/api/resume/set-default', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    await fetchSavedResumes();
    showToast("✓ Default resume updated.");
  };

  const handleDelete = async (resume: SavedResume) => {
    await fetch('/api/resume/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resume.id }) });
    setConfirmDelete(null);
    await fetchSavedResumes();
    showToast("Resume deleted.");
  };

  const resetForm = () => {
    setFileUploaded(false);
    setFileName("");
    setAnalysis(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#03c6b2] text-[#001f28] px-5 py-3 rounded-xl font-bold shadow-xl animate-in slide-in-from-right-4">
          {toast}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a2123] border border-[#3c494e] rounded-2xl p-8 max-w-sm w-full mx-4 space-y-4">
            <h3 className="font-bold text-white text-lg">Delete Resume?</h3>
            <p className="text-sm text-[#bbc9cf]">
              Delete <span className="font-semibold text-white">&ldquo;{confirmDelete.file_name}&rdquo;</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-2.5 bg-[#ef4444] text-white rounded-lg font-bold hover:brightness-110">Delete</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 border border-[#3c494e] rounded-lg font-bold hover:bg-[#2f3639]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">AI Resume Analyzer</h2>
            <p className="text-[#bbc9cf] text-base max-w-2xl">Upload your resume and our AI will score it, identify weak sections, and give you actionable improvements.</p>
          </div>
          <Link href="/dashboard/resume/offline" className="group relative overflow-hidden flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#00d1ff]/10 to-[#03c6b2]/10 border border-[#00d1ff]/30 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#00d1ff]/5">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d1ff]/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="w-10 h-10 bg-[#00d1ff]/20 rounded-xl flex items-center justify-center text-[#00d1ff]">
              <span className="material-symbols-outlined font-black">bolt</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-black text-[#00d1ff] uppercase tracking-widest leading-none">New Feature</p>
                <span className="bg-[#ffb4ab] text-[#690005] text-[8px] font-black px-1 py-0.5 rounded uppercase">Beta / WIP</span>
              </div>
              <p className="text-sm font-bold text-white leading-none">Try Offline Analysis</p>
            </div>
            <span className="material-symbols-outlined text-[#00d1ff] ml-2 text-[20px]">arrow_forward</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#242424]">
          <button onClick={() => setActiveTab('saved')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'saved' ? 'border-[#00d1ff] text-[#00d1ff]' : 'border-transparent text-[#859399] hover:text-[#bbc9cf]'}`}>
            📁 Saved Resumes {savedResumes.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-[#00d1ff]/20 text-[#00d1ff] text-xs rounded-full">{savedResumes.length}</span>}
          </button>
          <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'upload' ? 'border-[#00d1ff] text-[#00d1ff]' : 'border-transparent text-[#859399] hover:text-[#bbc9cf]'}`}>
            ⬆ Upload New
          </button>
        </div>

        {/* SAVED TAB */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {loadingResumes ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-[#00d1ff] animate-spin" /></div>
            ) : savedResumes.length === 0 ? (
              <div className="text-center py-12 text-[#859399]">
                <p className="text-lg mb-2">No saved resumes yet.</p>
                <button onClick={() => setActiveTab('upload')} className="text-[#00d1ff] hover:underline font-semibold">Upload one to get started →</button>
              </div>
            ) : (
              <>
                {savedResumes.length >= 5 && (
                  <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm px-4 py-3 rounded-xl">
                    You&apos;ve reached the limit of 5 saved resumes. Delete one to upload a new one.
                  </div>
                )}
                {savedResumes.map((resume) => (
                  <div key={resume.id} className="bg-[#1a2123] border border-[#3c494e]/30 rounded-xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#242b2e] rounded-xl flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#00d1ff]">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate max-w-[240px]" title={resume.file_name}>{resume.file_name}</span>
                        {resume.is_default && <span className="px-2 py-0.5 bg-[#00d1ff]/20 text-[#00d1ff] text-xs font-bold rounded-full">Default</span>}
                      </div>
                      <p className="text-xs text-[#859399] mt-0.5">Uploaded {new Date(resume.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleAnalyzeSaved(resume)} className="px-4 py-2 bg-[#00d1ff] text-[#001f28] rounded-lg text-sm font-bold hover:brightness-110 active:scale-95 transition-all">Analyze</button>
                      {!resume.is_default && (
                        <button onClick={() => handleSetDefault(resume.id)} className="px-4 py-2 border border-[#3c494e] rounded-lg text-sm font-semibold hover:bg-[#2f3639] transition-colors">Set Default</button>
                      )}
                      <button onClick={() => setConfirmDelete(resume)} className="p-2 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={() => setActiveTab('upload')} className="w-full py-3 border-2 border-dashed border-[#3c494e] rounded-xl text-[#859399] hover:border-[#00d1ff] hover:text-[#00d1ff] transition-colors text-sm font-semibold">
                  + Upload New Resume
                </button>
              </>
            )}
          </div>
        )}

        {/* UPLOAD TAB */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            {!fileUploaded && (
              <>
                <div className="relative w-full h-64 border-2 border-dashed border-[#3c494e] rounded-xl bg-[#1a2123] flex flex-col items-center justify-center transition-all hover:border-[#00d1ff] group cursor-pointer">
                  <input type="file" onChange={handleFileUpload} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-16 h-16 rounded-full bg-[#242b2e] flex items-center justify-center mb-4 group-hover:bg-[#00d1ff]/10 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-[#00d1ff]" style={{ fontVariationSettings: "'FILL' 1" }}>upload_file</span>
                  </div>
                  <p className="font-['Plus_Jakarta_Sans'] text-lg font-semibold mb-1">Drag and drop your resume here</p>
                  <p className="text-sm text-[#859399]">PDF only, up to 10 MB</p>
                  <button className="mt-5 px-8 py-2.5 bg-[#00d1ff] text-[#001f28] font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all">Select File</button>
                </div>

                <div className="bg-[#1a2123] border border-[#3c494e]/30 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={saveToProfile} onChange={e => setSaveToProfile(e.target.checked)} className="w-4 h-4 accent-[#00d1ff]" />
                    <span className="text-sm font-semibold text-white">Save this resume to my profile</span>
                  </label>
                  {saveToProfile && (
                    <label className="flex items-center gap-3 cursor-pointer pl-7">
                      <input type="checkbox" checked={setAsDefault} onChange={e => setSetAsDefault(e.target.checked)} className="w-4 h-4 accent-[#00d1ff]" />
                      <span className="text-sm text-[#bbc9cf]">Set as my default resume</span>
                    </label>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Loading */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-48 space-y-4">
            <Loader2 className="w-12 h-12 text-[#00d1ff] animate-spin" />
            <p className="text-lg font-bold text-[#dde3e7] animate-pulse">Analyzing your resume...</p>
            <p className="text-sm text-[#859399]">Extracting skills, assessing impact, and calculating your score.</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#93000a]/10 border border-[#ffb4ab]/20 p-6 rounded-xl flex items-start gap-4">
            <span className="material-symbols-outlined text-[#ffb4ab] mt-0.5">error</span>
            <div className="flex-1 space-y-2">
              <p className="text-base font-bold text-[#ffb4ab]">Analysis Failed</p>
              <p className="text-sm text-[#bbc9cf]">{error}</p>
              <button onClick={resetForm} className="mt-2 px-4 py-2 bg-[#ffb4ab]/10 text-[#ffb4ab] rounded hover:bg-[#ffb4ab]/20 text-sm font-semibold transition-colors">Try Again</button>
            </div>
          </div>
        )}

        {/* Results */}
        {analysis && (
          <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#dde3e7] tracking-tight">Analysis Complete</h2>
                <p className="text-[#bbc9cf] text-sm">{fileName}</p>
              </div>
              <button onClick={resetForm} className="px-4 py-2 border border-[#3c494e] rounded-lg text-sm font-semibold hover:bg-[#2f3639] transition-colors">
                Analyze Another
              </button>
            </div>

            {/* Score cards row */}
            <div className="grid grid-cols-1 gap-4">
              {analysis.ats_score !== undefined && (
                <div className="bg-[#1a2123] rounded-xl p-6 border border-[#3c494e]/30 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#859399]">ATS Score</p>
                    <div className="group relative">
                      <span className="material-symbols-outlined text-[16px] text-[#859399] cursor-help">info</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-4 bg-[#242b2e] border border-[#3c494e] rounded-xl text-xs text-[#bbc9cf] text-left opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-2xl">
                        <strong className="text-white block mb-1">How is this calculated?</strong>
                        The ATS score evaluates how well your resume matches standard Applicant Tracking System parsers. It checks for:
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                          <li>Standard section headings (Experience, Education)</li>
                          <li>Machine-readable formatting (no complex tables or columns)</li>
                          <li>Clear contact information parsing</li>
                          <li>Appropriate professional keyword density</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="w-24 h-24 rounded-full border-8 flex items-center justify-center mb-3"
                    style={{ borderColor: analysis.ats_score >= 70 ? '#03c6b2' : '#ffb4ab' }}>
                    <span className="font-['Plus_Jakarta_Sans'] text-4xl font-black">{analysis.ats_score}</span>
                  </div>
                  <p className="text-xs text-[#bbc9cf]">{analysis.ats_score >= 70 ? "ATS Friendly ✓" : "May be filtered by ATS"}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Strengths */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#44e2cd] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">verified</span> Strengths
                  </h4>
                  <div className="bg-[#03c6b2]/5 p-5 rounded-xl border border-[#44e2cd]/20">
                    <ul className="space-y-2">
                      {analysis.strengths.map((str, i) => (
                        <li key={i} className="flex gap-3 text-[#bbc9cf] text-sm leading-relaxed">
                          <span className="text-[#44e2cd] mt-0.5">•</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Weaknesses */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#ffb4ab] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">warning</span> Lacking Areas
                  </h4>
                  <div className="bg-[#93000a]/10 p-5 rounded-xl border border-[#ffb4ab]/20">
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((weak, i) => (
                        <li key={i} className="flex gap-3 text-[#bbc9cf] text-sm leading-relaxed">
                          <span className="text-[#ffb4ab] mt-0.5">•</span> {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section Breakdown */}
                {analysis.section_breakdown && analysis.section_breakdown.some(s => s.is_weak) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-[#c4b5fd] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">analytics</span> Section-by-Section Analysis
                    </h4>
                    <div className="space-y-3">
                      {analysis.section_breakdown.filter(s => s.is_weak).map((sec, i) => (
                        <div key={i} className="bg-[#1a2123] border border-[#3c494e]/30 rounded-xl overflow-hidden">
                          <div className="px-5 py-3 bg-[#c4b5fd]/10 border-b border-[#3c494e]/30 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#c4b5fd] text-[16px]">edit_note</span>
                            <span className="font-bold text-[#c4b5fd] text-sm">{sec.section}</span>
                            <span className="px-2 py-0.5 bg-[#ffb4ab]/20 text-[#ffb4ab] text-xs rounded-full ml-auto">Needs Improvement</span>
                          </div>
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-[#859399] uppercase mb-2">Original</p>
                              {sec.weak_bullets.length > 0 ? (
                                sec.weak_bullets.map((b, j) => (
                                  <p key={j} className="text-xs text-[#bbc9cf] bg-[#93000a]/10 border border-[#ffb4ab]/20 rounded p-2 mb-1.5">{b}</p>
                                ))
                              ) : (
                                <p className="text-xs text-[#859399] italic bg-[#242b2e]/50 rounded p-2 border border-[#3c494e]/30">Section missing or content not found.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#44e2cd] uppercase mb-2">Suggested</p>
                              {sec.suggested_bullets.length > 0 ? (
                                sec.suggested_bullets.map((b, j) => (
                                  <p key={j} className="text-xs text-[#bbc9cf] bg-[#03c6b2]/5 border border-[#44e2cd]/20 rounded p-2 mb-1.5">{b}</p>
                                ))
                              ) : (
                                <p className="text-xs text-[#859399] italic bg-[#242b2e]/50 rounded p-2 border border-[#3c494e]/30">No suggestions available.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                {/* Tips */}
                <div className="bg-[#1a2123] rounded-xl p-6 border border-[#3c494e]/30 space-y-4">
                  <div className="flex items-center gap-2 text-[#00d1ff]">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                    <p className="text-sm font-bold">How to Improve</p>
                  </div>
                  <ul className="space-y-3 pt-1">
                    {analysis.tips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-xs text-[#bbc9cf] leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#00d1ff]/10 text-[#00d1ff] flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="h-24"></div>
      </div>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-64 right-0 p-6 bg-[#0e1417]/80 backdrop-blur-lg border-t border-[#242424] flex justify-end gap-6 pr-24"
        style={{ zIndex: 40, paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {(fileUploaded || analysis || error) && (
          <button onClick={resetForm} className="px-6 py-2.5 rounded-lg text-[#dde3e7] border border-[#3c494e] hover:bg-[#2f3639] transition-colors font-medium">
            Discard and Re-upload
          </button>
        )}
        <Link href="/dashboard/new" className="px-10 py-2.5 rounded-lg bg-[#00d1ff] text-[#001f28] font-bold hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
          {analysis ? "Start Interview" : "Proceed to Interview Setup"}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
