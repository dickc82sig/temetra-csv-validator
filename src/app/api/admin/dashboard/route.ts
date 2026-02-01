/**
 * Admin Dashboard API Route
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Fetches dashboard stats using the service role key to bypass RLS.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route must query live data on each request
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Get project count
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get upload stats
    const { count: totalUploads } = await supabase
      .from('file_uploads')
      .select('*', { count: 'exact', head: true });

    const { count: validFiles } = await supabase
      .from('file_uploads')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'valid');

    const { count: invalidFiles } = await supabase
      .from('file_uploads')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'invalid');

    const { count: pendingFiles } = await supabase
      .from('file_uploads')
      .select('*', { count: 'exact', head: true })
      .eq('validation_status', 'pending');

    const stats = {
      totalProjects: projectCount || 0,
      totalUploads: totalUploads || 0,
      validFiles: validFiles || 0,
      invalidFiles: invalidFiles || 0,
      pendingReview: pendingFiles || 0,
    };

    // Get recent uploads with project names
    const { data: uploadsData } = await supabase
      .from('file_uploads')
      .select('id, file_name, uploaded_by_email, uploaded_at, validation_status, project_id')
      .order('uploaded_at', { ascending: false })
      .limit(5);

    let recentUploads: Array<{
      id: string;
      file_name: string;
      project_name: string;
      uploaded_by_email: string;
      uploaded_at: string;
      validation_status: string;
      error_count: number;
    }> = [];

    if (uploadsData && uploadsData.length > 0) {
      const projectIds = Array.from(new Set(uploadsData.map(u => u.project_id)));
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);

      const projectMap = new Map(projectsData?.map(p => [p.id, p.name]) || []);

      recentUploads = uploadsData.map(upload => ({
        id: upload.id,
        file_name: upload.file_name,
        project_name: projectMap.get(upload.project_id) || 'Unknown Project',
        uploaded_by_email: upload.uploaded_by_email,
        uploaded_at: upload.uploaded_at,
        validation_status: upload.validation_status,
        error_count: 0,
      }));
    }

    // Get active projects with upload counts
    const { data: projectsList } = await supabase
      .from('projects')
      .select('id, name, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5);

    let projects: Array<{
      id: string;
      name: string;
      upload_count: number;
      last_activity: string;
    }> = [];

    if (projectsList) {
      projects = await Promise.all(
        projectsList.map(async (project) => {
          const { count } = await supabase
            .from('file_uploads')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          const { data: lastUpload } = await supabase
            .from('file_uploads')
            .select('uploaded_at')
            .eq('project_id', project.id)
            .order('uploaded_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: project.id,
            name: project.name,
            upload_count: count || 0,
            last_activity: lastUpload?.uploaded_at || project.created_at,
          };
        })
      );
    }

    return NextResponse.json({ stats, recentUploads, projects });
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
