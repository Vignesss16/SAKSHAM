import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { applicationId, action } = await req.json();

    if (!applicationId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (action === 'reject') {
      const { error } = await supabaseAdmin
        .from('mentor_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId);
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Application rejected.' });
    }

    if (action === 'approve') {
      // 1. Get the application
      const { data: app, error: appError } = await supabaseAdmin
        .from('mentor_applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      
      if (appError || !app) throw new Error('Application not found');
      if (app.status !== 'pending') throw new Error('Application already processed');

      // 2. Update application status
      await supabaseAdmin
        .from('mentor_applications')
        .update({ status: 'approved' })
        .eq('id', applicationId);

      // 3. Insert into mentors table
      const { error: mentorError } = await supabaseAdmin
        .from('mentors')
        .insert({
          user_id: app.user_id,
          full_name: app.full_name,
          company: app.company,
          job_role: app.job_role,
          experience_years: app.experience_years,
          linkedin_url: app.linkedin_url,
          bio: app.bio,
          hourly_rate: 50 // Default rate, they can change later
        });
      
      // If they are already a mentor it might error (unique constraint on user_id), but that's okay
      if (mentorError && mentorError.code !== '23505') {
        throw mentorError;
      }

      // 4. Update user profile role
      await supabaseAdmin
        .from('profiles')
        .update({ role: 'mentor' })
        .eq('id', app.user_id);

      return NextResponse.json({ success: true, message: 'Application approved and mentor created!' });
    }

  } catch (error: any) {
    console.error('Error in verify-mentor API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
