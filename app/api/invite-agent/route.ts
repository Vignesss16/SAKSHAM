import { NextRequest, NextResponse } from 'next/server';
import {
  AgoraClient,
  Agent,
  Area,
  OpenAISTT,
  ExpiresIn,
  OpenAITTS,
  OpenAI,
} from 'agora-agent-server-sdk';
import { DEFAULT_AGENT_UID } from '@/lib/agora';

// agentUid identifies the AI in the RTC channel — must match NEXT_PUBLIC_AGENT_UID on the client
const agentUid = process.env.NEXT_PUBLIC_AGENT_UID ?? String(DEFAULT_AGENT_UID);

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requester_id, channel_name, systemPrompt } = body;

    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

    if (!channel_name || !requester_id || !systemPrompt) {
      return NextResponse.json(
        { error: 'channel_name, requester_id, and systemPrompt are required' },
        { status: 400 },
      );
    }

    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    const GREETING = "Hello! I am your AI interviewer from SAKSHAM.AI. I have reviewed your profile and the job description. Are you ready to begin the interview?";

    const agent = new Agent({
      name: `interview-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      instructions: systemPrompt,
      greeting: GREETING,
      failureMessage: 'Please wait a moment.',
      maxHistory: 50,
      turnDetection: {
        config: {
          speech_threshold: 0.5,
          start_of_speech: {
            mode: 'vad',
            vad_config: {
              interrupt_duration_ms: 160,
              prefix_padding_ms: 300,
            },
          },
          end_of_speech: {
            mode: 'vad',
            vad_config: {
              silence_duration_ms: 480,
            },
          },
        },
      },
      advancedFeatures: { enable_tools: true },
      parameters: { data_channel: 'datastream', enable_error_message: true },
    })
      .withStt(
        new OpenAISTT({
          model: 'whisper-1',
          language: 'en',
        })
      )
      .withLlm(
        new OpenAI({
          model: 'gpt-4o-mini',
          greetingMessage: GREETING,
          failureMessage: 'Please wait a moment.',
          maxHistory: 50,
          params: {
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.95,
          },
        })
      )
      .withTts(
        new OpenAITTS({
          model: 'tts-1',
          voice: 'nova',
        })
      );

    const session = agent.createSession(client, {
      channel: channel_name,
      agentUid,
      remoteUids: [requester_id],
      idleTimeout: 30,
      expiresIn: ExpiresIn.hours(1),
      debug: false,
    });

    const agentId = await session.start();

    return NextResponse.json({
      agent_id: agentId,
      create_ts: Math.floor(Date.now() / 1000),
      state: 'RUNNING',
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start conversation',
      },
      { status: 500 },
    );
  }
}
