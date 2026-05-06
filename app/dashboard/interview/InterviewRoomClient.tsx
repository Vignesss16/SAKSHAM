"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { RTMClient } from 'agora-rtm';
import { setParameter } from 'agora-rtc-sdk-ng/esm';
import {
  AgoraRTCProvider,
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  AgentState,
  MessageSalStatus,
  TranscriptHelperMode,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
import { AgentVisualizer, ConvoTextStream } from 'agora-agent-uikit';
import { MicButtonWithVisualizer } from 'agora-agent-uikit/rtc';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import CodingRound from './CodingRound';

import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  getCurrentInProgressMessage,
  getMessageList,
  mapAgentVisualizerState,
  normalizeTimestampMs,
  normalizeTranscript,
} from '@/lib/conversation';
import type {
  AgoraTokenData,
  ClientStartRequest,
  AgentResponse,
  AgoraRenewalTokens,
} from '@/types/conversation';
import { getConversationIssueSeverity, type ConnectionIssue } from '@/components/ConversationErrorCard';
import AgoraRTC from 'agora-rtc-react';

const MAX_CONNECTION_ISSUES = 6;

// Internal component that uses AgoraRTC hooks
function InterviewContent({
  agoraData,
  rtmClient,
  systemPrompt,
}: {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  systemPrompt: string;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState(0);
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const agentUID = process.env.NEXT_PUBLIC_AGENT_UID ?? String(DEFAULT_AGENT_UID);
  const [joinedUID, setJoinedUID] = useState<UID>(0);

  const [rawTranscript, setRawTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);

  // Coding Round State
  const [isCodingRound, setIsCodingRound] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10) || 0,
    },
    isReady,
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady, {
    AEC: true,
    ANS: true,
    AGC: true,
  });

  useEffect(() => {
    if (!client) return;
    try {
      setParameter('ENABLE_AUDIO_PTS', true);
    } catch (error) {
      console.warn('Could not set ENABLE_AUDIO_PTS:', error);
    }
  }, [client]);

  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      if (uid !== null && uid !== undefined) {
        setJoinedUID(uid);
      }
    }
  }, [joinSuccess, client]);

  useEffect(() => {
    if (!isReady || !joinSuccess) return;

    let cancelled = false;

    (async () => {
      try {
        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: true,
        });

        if (cancelled) {
          try {
            if (AgoraVoiceAI.getInstance() === ai) {
              ai.unsubscribe();
              ai.destroy();
            }
          } catch {}
          return;
        }

        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (t) => {
          setRawTranscript([...t]);
        });
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, event) =>
          setAgentState(event.state),
        );
        ai.subscribeMessage(agoraData.channel);
      } catch (error) {
        if (!cancelled) {
          console.error('[AgoraVoiceAI] init failed:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {}
    };
  }, [isReady, joinSuccess, client, rtmClient, agoraData.channel]);

  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  const messageList = useMemo(() => getMessageList(transcript), [transcript]);
  const currentInProgressMessage = useMemo(() => {
    return getCurrentInProgressMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    // Check if the agent's message indicates a transition to coding/programming
    const triggerRegex = /moving on to the next round.*?coding round|which is the coding round|concludes this part of the interview/i;
    
    // Ensure the message is actually from the agent, not the user
    const hasAgentTriggeredInHistory = messageList.some(msg => 
      String(msg.uid) === agentUID && triggerRegex.test(msg.text.toLowerCase())
    );
    
    if (hasAgentTriggeredInHistory && !isCodingRound) {
      console.log("≡ƒÄ» Coding Round Triggered by AI phrase in history.");
      setIsCodingRound(true);
      
      // Stop the agent
      if (agoraData?.agentId) {
        fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        }).catch(console.error);
      }
      
      rtmClient?.logout().catch(console.error);
    }
  }, [currentInProgressMessage, messageList, agentUID, isCodingRound, agoraData?.agentId, rtmClient]);

  usePublish([localMicrophoneTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState) => {
    setConnectionState(curState);
  });

  const visualizerState = useMemo(
    () => mapAgentVisualizerState(agentState, isAgentConnected, connectionState),
    [agentState, isAgentConnected, connectionState],
  );

  const handleMicToggle = useCallback(async () => {
    const next = !isEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsEnabled(next);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isEnabled, localMicrophoneTrack]);

  const handleEndConversation = async () => {
    if (agoraData?.agentId) {
      try {
        await fetch('/api/stop-conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agent_id: agoraData.agentId }),
        });
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }
    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err));
    router.push('/dashboard/reports');
  };

  const handleCodingRoundComplete = async (code: string, language: string) => {
    setIsGeneratingReport(true);
    try {
      const storedVars = localStorage.getItem('omnidimension_variables');
      const variables = storedVars ? JSON.parse(storedVars) : {};

      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          transcript: messageList,
          variables
        }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      
      router.push(`/dashboard/reports?id=${data.id}`);
    } catch (err) {
      console.error(err);
      alert('There was an error generating the report. Please check the console.');
      setIsGeneratingReport(false);
    }
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  let progressText = "Voice Interview";
  let progressPercentage = Math.min(50, 10 + Math.floor((seconds / 300) * 40));

  if (isGeneratingReport) {
    progressText = "Generating Report";
    progressPercentage = 100;
  } else if (isCodingRound) {
    progressText = "Coding Phase";
    progressPercentage = 75;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0e1417] text-[#dde3e7]">
      {/* Top nav */}
      <header className="bg-[#121212] border-b border-[#242424] h-16 flex items-center justify-between px-8 z-50 shrink-0">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
            SAKSHAM.AI
          </Link>
          <span className="bg-[#00d1ff]/20 text-[#00d1ff] px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
            Live Interview
          </span>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-xl px-10">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[#859399] font-medium">{progressText}</span>
              <span className="text-xs text-[#00d1ff] font-bold">{progressPercentage}% Complete</span>
            </div>
            <div className="w-full bg-[#242b2e] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#00d1ff] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,209,255,0.4)]" style={{ width: `${progressPercentage}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#242424] bg-[#1a2123]">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              fiber_manual_record
            </span>
            <span className="text-sm font-semibold text-white">{mins}:{secs}</span>
          </div>
          <button className="text-[#859399] hover:text-white transition-colors">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      {isGeneratingReport ? (
        <div className="flex-1 flex items-center justify-center h-[calc(100vh-64px-40px)]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
            <p className="text-[#859399]">Analyzing your interview performance and generating comprehensive report...</p>
          </div>
        </div>
      ) : isCodingRound ? (
        <CodingRound onComplete={handleCodingRoundComplete} />
      ) : (
      <main className="flex-1 grid grid-cols-12 gap-6 p-8 max-w-7xl mx-auto w-full h-[calc(100vh-64px-40px)] overflow-hidden">
        {/* Left: Question */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl p-8 flex flex-col gap-6 flex-1 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d1ff]">lightbulb</span>
              <span className="text-sm text-[#859399] uppercase tracking-widest font-bold">Interview Tips</span>
            </div>
            <div className="font-['Plus_Jakarta_Sans'] text-sm font-medium text-[#859399] leading-relaxed overflow-y-auto max-h-[300px]">
              <ul className="list-disc pl-5 space-y-3">
                <li>Speak clearly and at a moderate pace.</li>
                <li>Make sure to answer the question fully before the agent transitions.</li>
                <li>You can pause briefly; the agent will wait until you finish.</li>
                <li>If you didn't hear the question, just ask the agent to repeat it.</li>
              </ul>
            </div>
            <div className="mt-auto pt-6 border-t border-[#242424]">
              <div className="flex items-center gap-3 bg-[#161d1f] p-4 rounded-lg border border-dashed border-[#859399]/30">
                <div className="flex space-x-1">
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-[#00d1ff] rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}s` }}
                    ></div>
                  ))}
                </div>
                <p className="text-sm text-[#00d1ff] font-medium">
                  {isAgentConnected ? "Agent is listening..." : "Connecting to Agent..."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#161d1f] rounded-xl p-4 border border-[#242424]">
            <div className="flex justify-between items-center text-xs text-[#859399]">
              <span>Connection: {connectionState}</span>
              <span>AI Model: Agora Engine</span>
            </div>
          </div>
        </section>

        {/* Center: Waveform + Controls */}
        <section className="col-span-12 lg:col-span-4 flex flex-col items-center justify-center gap-16 h-full">
          {/* Waveform Visualizer */}
          <div className="relative w-full max-w-xs aspect-square flex items-center justify-center">
            <AgentVisualizer state={visualizerState} size="lg" />
            {remoteUsers.map((user) => (
              <div key={user.uid} className="hidden">
                <RemoteUser user={user} />
              </div>
            ))}
            <div className="absolute -bottom-10 flex flex-col items-center">
              <span className="text-sm font-bold text-white tracking-widest uppercase mb-2">Analyzing Audio</span>
              <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#00d1ff] to-transparent opacity-50"></div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <MicButtonWithVisualizer
              isEnabled={isEnabled}
              setIsEnabled={setIsEnabled}
              track={localMicrophoneTrack}
              onToggle={handleMicToggle}
              className="w-20 h-20 rounded-full bg-[#00d1ff] text-[#001f28] flex items-center justify-center shadow-[0_0_30px_rgba(0,209,255,0.3)] hover:scale-95 transition-all"
              enabledColor="#001f28"
              disabledColor="#ffb4ab"
            />
            <button
              onClick={handleEndConversation}
              className="w-12 h-12 rounded-full border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 flex items-center justify-center text-[#ffb4ab] hover:bg-[#ffb4ab]/20 transition-all active:scale-95 group"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop_circle</span>
            </button>
          </div>
        </section>

        {/* Right: Transcription */}
        <section className="col-span-12 lg:col-span-4 flex flex-col h-full overflow-hidden">
          <div className="bg-[#1A1A1A] border border-[#242424] rounded-xl flex flex-col h-full shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#242424] flex items-center justify-between bg-[#161d1f]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#44e2cd] text-[20px]">text_fields</span>
                <span className="text-sm text-[#859399] font-bold uppercase tracking-wider">Live Transcription</span>
              </div>
              <span className="bg-[#44e2cd]/10 text-[#44e2cd] px-2 py-0.5 rounded text-[10px] font-bold border border-[#44e2cd]/20">REAL-TIME</span>
            </div>

            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              {messageList.map((msg, idx) => (
                <div key={idx} className="flex flex-col gap-2">
                  <span className="text-xs text-[#859399]">
                    {String(msg.uid) === agentUID ? 'SAKSHAM.AI' : 'You'}
                  </span>
                  <p className={`text-base leading-relaxed ${String(msg.uid) === agentUID ? 'text-[#bbc9cf]' : 'text-white'}`}>
                    {msg.text}
                  </p>
                </div>
              ))}

              {currentInProgressMessage && (
                <div className="flex flex-col gap-2 relative">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-[#00d1ff]/30 rounded-full"></div>
                  <span className="text-xs text-[#00d1ff] font-bold">LIVE</span>
                  <p className="text-base text-white font-medium leading-relaxed">
                    {currentInProgressMessage.text}...
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#121212] border-t border-[#242424]">
              <div className="flex items-center gap-2 text-xs text-[#859399]">
                <span className="material-symbols-outlined text-[14px]">info</span>
                <span>Transcribed text is used for final scoring analysis.</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* Background ambient */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d1ff]/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#03c6b2]/5 blur-[100px] rounded-full"></div>
      </div>

      <footer className="bg-[#121212] border-t border-[#242424] py-2 px-8 flex items-center justify-between shrink-0">
        <span className="text-xs text-gray-600">┬⌐ 2024 SAKSHAM.AI. Professional Excellence.</span>
        <div className="flex gap-6">
          <a href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Privacy Policy</a>
          <a href="#" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

// Wrapper component to manage loading Agora credentials and client
export default function InterviewRoomClient() {
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null);
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  // Agora Provider ref
  const { default: agoraRTC } = require('agora-rtc-react');
  const clientRef = useRef<ReturnType<typeof agoraRTC.createClient> | null>(null);

  useEffect(() => {
    async function start() {
      try {
        const prompt = localStorage.getItem('omnidimension_system_prompt') || "You are an AI interviewer.";
        setSystemPrompt(prompt);

        // Preload
        await Promise.all([
          import('agora-rtc-react').catch(() => {}),
          import('agora-rtm').catch(() => {})
        ]);

        const randomUid = Math.floor(Math.random() * 65500) + 1;

        // 1. Fetch Agora Token
        const agoraResponse = await fetch(`/api/generate-agora-token?uid=${randomUid}`);
        if (!agoraResponse.ok) throw new Error("Failed to generate Agora token");
        const responseData = await agoraResponse.json();

        // 2. Start Agent and setup RTM
        const { default: AgoraRTM } = await import('agora-rtm');
        
        const [agentData, rtm] = await Promise.all([
          fetch('/api/invite-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requester_id: String(randomUid),
              channel_name: responseData.channel,
              systemPrompt: prompt,
            }),
          }).then(async (res) => {
            const data = await res.json();
            if (data.error) throw new Error("Agent failed to start: " + data.error);
            return data;
          }),

          (async () => {
            const rtm = new AgoraRTM.RTM(process.env.NEXT_PUBLIC_AGORA_APP_ID!, String(randomUid));
            await rtm.login({ token: responseData.rtmToken });
            await rtm.subscribe(responseData.channel, { withPresence: false });
            return rtm;
          })()
        ]);

        setRtmClient(rtm);
        setAgoraData({ ...responseData, agentId: agentData?.agent_id, uid: String(randomUid) });

        if (!clientRef.current) {
          clientRef.current = agoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        }
      } catch (err: any) {
        setError(err.message || "Failed to start conversation");
      } finally {
        setIsLoading(false);
      }
    }
    start();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0e1417] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d1ff]" />
          <p className="text-[#859399]">Initializing Interview Environment...</p>
        </div>
      </div>
    );
  }

  if (error || !agoraData || !rtmClient || !clientRef.current) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0e1417] text-white">
        <p className="text-red-400">Error: {error || "Failed to load"}</p>
      </div>
    );
  }

  const { AgoraRTCProvider } = require('agora-rtc-react');

  return (
    <ErrorBoundary>
      <AgoraRTCProvider client={clientRef.current as any}>
        <InterviewContent 
          agoraData={agoraData} 
          rtmClient={rtmClient} 
          systemPrompt={systemPrompt}
        />
      </AgoraRTCProvider>
    </ErrorBoundary>
  );
}
