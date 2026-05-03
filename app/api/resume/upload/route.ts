import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Check max 5 resumes
    const { count } = await supabase
      .from('saved_resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Resume limit reached. Delete one to upload a new one.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const setAsDefault = formData.get('setAsDefault') === 'true';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const fileExt = 'pdf';
    const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) throw new Error('Failed to upload file: ' + uploadError.message);

    const { data: signedUrlData } = await supabase.storage
      .from('resumes')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 5); // 5 years

    const fileUrl = signedUrlData?.signedUrl || '';

    // If setAsDefault, clear existing defaults first
    if (setAsDefault) {
      await supabase.from('saved_resumes').update({ is_default: false }).eq('user_id', user.id);
    }

    const { data: inserted, error: dbError } = await supabase
      .from('saved_resumes')
      .insert({
        user_id: user.id,
        file_name: file.name.substring(0, 40),
        file_url: fileUrl,
        is_default: setAsDefault,
      })
      .select('*')
      .single();

    if (dbError) throw new Error('Failed to save resume record: ' + dbError.message);

    return NextResponse.json(inserted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
