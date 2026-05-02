"use client";
import { useState } from "react";

export default function CertificatesPage() {
  const [certId, setCertId] = useState("CERT-XP92-2024-AI");
  const [verified, setVerified] = useState(true);

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
            <button onClick={() => window.print()} className="bg-[#00d1ff] text-[#001f28] hover:brightness-110 active:scale-95 transition-all px-6 py-2 rounded-lg font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">download</span> Download PDF
            </button>
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
                  <h1 className="font-['Plus_Jakarta_Sans'] text-5xl text-white font-black italic tracking-tight">
                    ALEXANDER CHASE
                  </h1>
                  <div className="h-[2px] w-32 bg-[#00d1ff] mx-auto"></div>
                  <p className="text-[#bbc9cf] text-lg max-w-2xl mx-auto">
                    Has successfully completed the advanced{" "}
                    <span className="text-[#dde3e7] font-semibold">Senior Frontend Engineer</span>{" "}
                    AI-driven simulation and performance assessment with a proficiency score of{" "}
                    <span className="text-[#44e2cd] font-bold">98/100</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-16 border-t border-[#242424] pt-10 items-end">
                  <div className="text-left">
                    <p className="text-[#bbc9cf] text-xs font-medium uppercase tracking-wider">Date Issued</p>
                    <p className="text-[#dde3e7] font-['Plus_Jakarta_Sans'] text-xl font-semibold mt-1">OCT 24, 2024</p>
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
                    <p className="text-[#bbc9cf] text-xs font-medium uppercase tracking-wider">Verification QR</p>
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
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                />
              </div>
              <button
                onClick={() => setVerified(true)}
                className="bg-[#00d1ff] text-[#001f28] hover:brightness-110 px-10 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">verified_user</span> Verify
              </button>
            </div>

            {verified && (
              <div className="mt-10 border-t border-[#242424] pt-10">
                <div className="bg-[#242424]/50 rounded-2xl border border-[#44e2cd]/30 p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#44e2cd]/10 blur-3xl rounded-full"></div>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 bg-[#44e2cd]/20 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#44e2cd] text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                      </span>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-1">
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-2">
                        <span className="text-[#44e2cd] font-bold text-xl">Successfully Verified</span>
                        <span className="bg-[#44e2cd]/10 text-[#44e2cd] text-xs font-bold px-3 py-1 rounded-full border border-[#44e2cd]/30">
                          Official Credential
                        </span>
                      </div>
                      <p className="text-[#bbc9cf] text-base">Recipient: <span className="text-[#dde3e7] font-semibold">Alexander Chase</span></p>
                      <p className="text-[#bbc9cf] text-base">Assessment: <span className="text-[#dde3e7] font-semibold">Senior Frontend Engineer Role</span></p>
                    </div>
                    <div className="bg-[#242b2e] rounded-xl p-4 border border-[#242424] text-center min-w-[120px]">
                      <p className="text-[#bbc9cf] text-xs uppercase">Final Score</p>
                      <p className="text-[#44e2cd] font-black text-3xl leading-none mt-1">98%</p>
                      <p className="text-[#44e2cd]/60 text-[10px] font-bold mt-1">STATUS: ELITE</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <p className="text-[#bbc9cf] text-xs">
              Looking to verify a different student? Contact{" "}
              <a href="#" className="text-[#00d1ff] hover:underline">Support</a>{" "}
              for bulk verification requests.
            </p>
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
