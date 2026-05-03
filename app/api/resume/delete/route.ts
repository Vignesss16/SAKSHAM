import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });

    // Verify ownership
    const { data: resume } = await supabase
      .from('saved_resumes')
      .select('file_url, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    // Extract storage path from file_url
    const url = new URL(resume.file_url);
    const pathParts = url.pathname.split('/object/sign/resumes/');
    if (pathParts[1]) {
      const storagePath = decodeURIComponent(pathParts[1].split('?')[0]);
      await supabase.storage.from('resumes').remove([storagePath]);
    }

    // Delete DB record
    await supabase.from('saved_resumes').delete().eq('id', id).eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
