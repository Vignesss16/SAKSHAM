import { NextRequest, NextResponse } from 'next/server';
import { RtcTokenBuilder, RtmTokenBuilder, RtcRole } from 'agora-token';

const EXPIRATION_TIME_IN_SECONDS = 3600;

function generateChannelName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ai-conversation-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  // console.log('Generating Agora token...');
  const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const APP_CERTIFICATE = process.env.NEXT_AGORA_APP_CERTIFICATE;

  if (!APP_ID || !APP_CERTIFICATE) {
    return NextResponse.json(
      { error: 'Agora credentials are not set' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const uidStr = searchParams.get('uid') || '0';
  const parsedUid = parseInt(uidStr, 10);
  const uid = isNaN(parsedUid) ? 0 : parsedUid;
  const channelName = searchParams.get('channel') || generateChannelName();

  const expirationTime =
    Math.floor(Date.now() / 1000) + EXPIRATION_TIME_IN_SECONDS;

  try {
    // console.log('Building RTC token for uid =', uid, 'channel =', channelName);
    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expirationTime,
      expirationTime
    );

    const rtmToken = RtmTokenBuilder.buildToken(
      APP_ID,
      APP_CERTIFICATE,
      uid.toString(),
      expirationTime
    );
    // console.log('Tokens generated successfully');

    return NextResponse.json({
      token: rtcToken,
      rtmToken: rtmToken,
      uid: uid.toString(),
      channel: channelName,
    });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate Agora token',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
