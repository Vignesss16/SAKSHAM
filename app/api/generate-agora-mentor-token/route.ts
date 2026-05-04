import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelName = searchParams.get('channelName');
    const uid = searchParams.get('uid');

    if (!channelName || !uid) {
      return NextResponse.json({ error: 'Missing channelName or uid' }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_AGORA_MENTOR_APP_ID;
    const appCertificate = process.env.AGORA_MENTOR_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return NextResponse.json({ error: 'Agora Mentor credentials missing in environment' }, { status: 500 });
    }

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour token
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      parseInt(uid, 10),
      role,
      privilegeExpiredTs
    );

    return NextResponse.json({ token, channelName, uid });
  } catch (error: any) {
    console.error('Error generating Agora token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
