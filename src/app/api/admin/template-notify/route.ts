/**
 * Template Notification API Route
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * When a template is updated, this endpoint sends email notifications
 * to all active projects using that template.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  try {
    const { templateId, templateName } = await request.json();

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    // Find all active projects using this template
    const { data: projects, error: queryError } = await supabase
      .from('projects')
      .select('id, name, admin_email, alert_on_upload')
      .eq('validation_template_id', templateId)
      .eq('is_active', true);

    if (queryError) {
      console.error('Error querying projects:', queryError);
      return NextResponse.json({ error: 'Failed to query projects' }, { status: 500 });
    }

    const affectedProjects = projects || [];
    const notifiedEmails: string[] = [];

    // Send notification emails to projects with alerts enabled
    for (const project of affectedProjects) {
      if (project.alert_on_upload && project.admin_email) {
        try {
          // Use dynamic import to avoid issues if nodemailer isn't configured
          const { sendTemplateUpdateEmail } = await import('@/lib/email');
          const sent = await sendTemplateUpdateEmail(
            project.admin_email,
            project.name,
            templateName || 'Unknown Template'
          );
          if (sent) {
            notifiedEmails.push(project.admin_email);
          }
        } catch (emailErr) {
          // Email sending may fail if SMTP is not configured - that's OK
          console.error(`Failed to send email to ${project.admin_email}:`, emailErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      affectedProjects: affectedProjects.length,
      notifiedEmails: notifiedEmails.length,
      projects: affectedProjects.map(p => ({ id: p.id, name: p.name })),
    });
  } catch (err) {
    console.error('Template notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
