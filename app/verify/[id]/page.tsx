import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function VerifyCertificatePage({ params }: { params: { id: string } }) {
  const cookieStore = cookies();
  
  // Try to use service role key if available to bypass RLS for public verification, otherwise use anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const { data: certificate, error } = await supabase
    .from('certificates')
    .select('*, interviews(score, title), profiles(full_name)')
    .eq('id', params.id)
    .single();

  const isValid = !error && certificate;
  
  const studentName = certificate?.profiles?.full_name || "Unknown Candidate";
  const score = certificate?.interviews?.score || 0;
  
  const title = certificate?.interviews?.title || "";
  const roleParts = title.split("-");
  const role = roleParts.length > 1 ? roleParts[1].trim() : "Software Engineer";

  return (
    <div className="min-h-screen bg-[#0e1417] text-[#dde3e7] flex flex-col justify-center items-center p-6">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h1 className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[#dde3e7] tracking-tight">
            Credential Verification
          </h1>
          <p className="text-[#bbc9cf] text-base mt-2">
            Verifying credential ID: <span className="font-mono text-[#00d1ff]">{params.id}</span>
          </p>
        </div>

        <div className="bg-[#1a2123] rounded-2xl p-8 border border-[#242424] shadow-2xl relative overflow-hidden">
          {isValid ? (
            <>
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#44e2cd]/10 blur-3xl rounded-full"></div>
              <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-24 h-24 bg-[#44e2cd]/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#44e2cd] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                </div>
                
                <div>
                  <div className="flex justify-center items-center gap-2 mb-2">
                    <span className="text-[#44e2cd] font-bold text-2xl">Successfully Verified</span>
                  </div>
                  <p className="text-[#bbc9cf] text-lg mt-4">
                    This certifies that <span className="text-white font-bold">{studentName}</span> has completed the AI-driven assessment for <span className="text-white font-semibold">{role}</span>.
                  </p>
                </div>

                <div className="bg-[#242b2e] rounded-xl p-6 border border-[#242424] w-full flex justify-between items-center mt-4">
                  <div className="text-left">
                    <p className="text-[#bbc9cf] text-xs uppercase font-bold tracking-wider">Proficiency Score</p>
                    <p className="text-[#44e2cd] font-black text-4xl mt-1">{score}<span className="text-xl">/100</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#bbc9cf] text-xs uppercase font-bold tracking-wider">Date Issued</p>
                    <p className="text-white font-medium mt-2">
                      {new Date(certificate.issue_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <div className="w-24 h-24 bg-[#ffb4ab]/20 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[#ffb4ab] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  cancel
                </span>
              </div>
              <div>
                <h2 className="text-[#ffb4ab] font-bold text-2xl">Invalid Credential</h2>
                <p className="text-[#bbc9cf] mt-4 max-w-md">
                  We could not find a valid certificate matching this ID. It may have been revoked, entered incorrectly, or it never existed.
                </p>
              </div>
              <Link href="/dashboard/certificates" className="bg-[#242b2e] hover:bg-[#2c3437] text-white px-6 py-3 rounded-xl font-semibold border border-[#242424] transition-colors mt-4">
                Try Another ID
              </Link>
            </div>
          )}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/" className="text-[#00d1ff] font-bold flex items-center justify-center gap-2 hover:brightness-110">
            <span className="material-symbols-outlined text-lg">arrow_back</span> Return to PrepAI
          </Link>
        </div>
      </div>
    </div>
  );
}
