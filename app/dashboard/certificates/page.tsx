"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from '@supabase/ssr';
import { Loader2 } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { CertificatePDF } from '@/components/CertificatePDF';
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function CertificatesPage() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    async function fetchCertificate() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Fetch user profile name
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
          setUserName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        // Fetch latest certificate and joined interview data
        const { data: certData, error: certError } = await supabase
          .from('certificates')
          .select('*, interviews(score, title, report_data)')
          .eq('user_id', user.id)
          .order('issue_date', { ascending: false })
          .limit(1)
          .single();

        if (certError) {
          // It's okay if they have no certificates
          if (certError.code !== 'PGRST116') {
            throw certError;
          }
        } else {
          setCertificate(certData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificate();
  }, []);

  const handleVerify = () => {
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e1417] text-white flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-[#0e1417] text-white flex flex-col justify-center items-center gap-4">
        <p className="text-gray-400">You haven't earned any certificates yet. Score 80+ in an interview to earn one!</p>
        <Link href="/dashboard" className="bg-[#00d1ff] text-[#001f28] px-6 py-2 rounded-lg font-bold">Return to Dashboard</Link>
      </div>
    );
  }

  const dateIssued = new Date(certificate.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
  const score = certificate.interviews?.score || 0;
  
  // Extract role from title like "Mock Interview: Google - Frontend Engineer"
  const title = certificate.interviews?.title || "";
  const roleParts = title.split("-");
  const role = roleParts.length > 1 ? roleParts[1].trim() : "Software Engineer";

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7]">
      <div className="p-10 max-w-7xl mx-auto space-y-10">
        {/* Certificate */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">
                Interview Completion Certificate
              </h2>
              <p className="text-[#bbc9cf] text-base mt-2">
                Your achievement is verified and ready to be shared with potential employers.
              </p>
            </div>
            
            <PDFDownloadLink
              document={<CertificatePDF name={userName} role={role} score={score} date={dateIssued} certId={certificate.id} />}
              fileName={`PrepAI_Certificate_${userName.replace(' ', '_')}.pdf`}
              className="bg-[#00d1ff] text-[#001f28] hover:brightness-110 active:scale-95 transition-all px-6 py-2 rounded-lg font-bold flex items-center gap-2"
            >
              {({ loading }) => (
                <>
                  <span className="material-symbols-outlined">{loading ? 'hourglass_empty' : 'download'}</span> 
                  {loading ? 'Preparing...' : 'Download PDF'}
                </>
              )}
            </PDFDownloadLink>

          </div>

          {/* Certificate Card */}
          <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-[#00D1FF] to-[#03c6b2]">
            <div className="bg-[#121212] rounded-2xl px-16 py-20 flex flex-col items-center text-center relative overflow-hidden">
              {/* Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d1ff]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#03c6b2]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
              {/* Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined" style={{ fontSize: "320px" }}>verified</span>
              </div>

              <div className="z-10 w-full">
                <div className="mb-10">
                  <span className="material-symbols-outlined text-[#00d1ff] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    workspace_premium
                  </span>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-4xl font-black text-[#dde3e7] mt-2 tracking-widest uppercase">
                    CERTIFICATE
                  </h3>
                  <p className="text-[#00d1ff] text-sm tracking-widest mt-1">OF PROFESSIONAL ACHIEVEMENT</p>
                </div>

                <div className="space-y-6 my-16">
                  <p className="text-[#bbc9cf] text-lg">This is to certify that</p>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-5xl text-white font-black italic tracking-tight uppercase">
                    {userName}
                  </h1>
                  <div className="h-[2px] w-32 bg-[#00d1ff] mx-auto"></div>
                  <p className="text-[#bbc9cf] text-lg max-w-2xl mx-auto">
                    Has successfully completed the advanced{" "}
                    <span className="text-[#dde3e7] font-semibold">{role}</span>{" "}
                    AI-driven simulation and performance assessment with a proficiency score of{" "}
                    <span className="text-[#44e2cd] font-bold">{score}/100</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 border-t border-[#242424] pt-10 items-end">
                  <div className="text-left">
                    <p className="text-[#bbc9cf] text-xs font-medium uppercase tracking-wider">Date Issued</p>
                    <p className="text-[#dde3e7] font-['Plus_Jakarta_Sans'] text-xl font-semibold mt-1">{dateIssued}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-2 rounded-lg mb-2">
                      <div className="w-24 h-24 bg-[#2f3639] relative flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-1 p-2">
                          {[1,1,1,1,0,1,1,1,1].map((v,i) => (
                            <div key={i} className={`w-3 h-3 ${v ? "bg-black" : "bg-transparent"}`}></div>
                          ))}
                        </div>
                        <div className="absolute inset-0 border-4 border-white"></div>
                      </div>
                    </div>
                    <p className="text-[#bbc9cf] text-xs font-medium uppercase tracking-wider">Verification ID: {certificate.id.substring(0,8)}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-[#dde3e7] font-['Plus_Jakarta_Sans'] text-xl font-semibold italic border-b border-[#242424] pb-1">
                      PrepAI Certification
                    </div>
                    <p className="text-[#bbc9cf] text-xs font-medium uppercase tracking-wider mt-1">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-[#242424] w-full"></div>

        {/* Verification */}
        <section className="max-w-3xl mx-auto space-y-6 py-10">
          <div className="text-center space-y-4">
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">
              Verify Interview Completion
            </h2>
            <p className="text-[#bbc9cf] text-base">
              Enter the credential ID found on the certificate to validate its authenticity.
            </p>
          </div>

          <div className="bg-[#1a2123] rounded-2xl p-6 border border-[#242424] shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#00d1ff]">
                  fingerprint
                </span>
                <input
                  className="w-full bg-[#242424] border-2 border-[#00d1ff]/20 rounded-xl pl-12 pr-4 py-4 font-mono text-lg text-[#00d1ff] focus:border-[#00d1ff] focus:ring-4 focus:ring-[#00d1ff]/10 outline-none transition-all"
                  type="text"
                  placeholder="Paste Certificate ID here"
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                />
              </div>
              <button
                onClick={handleVerify}
                className="bg-[#00d1ff] text-[#001f28] hover:brightness-110 px-10 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">verified_user</span> Verify
              </button>
            </div>
          </div>
        </section>
      </div>

      <footer className="flex flex-col items-center gap-4 w-full py-12 bg-[#121212] border-t border-[#242424] mt-10 text-xs">
        <div className="font-bold text-[#00D1FF]">PrepAI</div>
        <div className="flex gap-8 text-gray-600">
          <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-300 transition-colors">Contact</a>
        </div>
        <p className="text-gray-500">© 2024 PrepAI. Professional Excellence.</p>
      </footer>
    </div>
  );
}
