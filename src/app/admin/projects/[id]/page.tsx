/**
 * Project Details Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page shows detailed information about a specific project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Settings,
  Copy,
  ExternalLink,
  Bell,
  BellOff,
  CheckCircle,
  Loader2,
  FileText,
  Key,
  BarChart3,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  public_link: string;
  alert_on_upload: boolean;
  admin_email: string | null;
  created_at: string;
  total_uploads?: number;
  valid_uploads?: number;
  last_upload?: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (data) {
          // Get upload stats
          const { count: totalUploads } = await supabase
            .from('file_uploads')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

          const { count: validUploads } = await supabase
            .from('file_uploads')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('validation_passed', true);

          const { data: lastUploadData } = await supabase
            .from('file_uploads')
            .select('created_at')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          setProject({
            ...data,
            total_uploads: totalUploads || 0,
            valid_uploads: validUploads || 0,
            last_upload: lastUploadData?.created_at,
          });
        } else {
          // Mock data for demo
          const mockProjects: Record<string, Project> = {
            '1': {
              id: '1',
              name: 'Acme Water Company',
              slug: 'acme-water',
              description: 'Municipal water utility serving the greater Acme area',
              public_link: '/validate/acme-water',
              alert_on_upload: true,
              admin_email: 'admin@acme.com',
              created_at: '2023-06-15T00:00:00',
              total_uploads: 45,
              valid_uploads: 38,
              last_upload: '2024-01-15T10:30:00',
            },
            '2': {
              id: '2',
              name: 'City Utilities Department',
              slug: 'city-utilities',
              description: 'City water and gas services',
              public_link: '/validate/city-utilities',
              alert_on_upload: true,
              admin_email: 'admin@cityutil.com',
              created_at: '2023-08-20T00:00:00',
              total_uploads: 32,
              valid_uploads: 30,
              last_upload: '2024-01-15T09:15:00',
            },
            '3': {
              id: '3',
              name: 'Regional Gas Co',
              slug: 'regional-gas',
              description: 'Natural gas distribution company',
              public_link: '/validate/regional-gas',
              alert_on_upload: false,
              admin_email: 'admin@regionalgas.com',
              created_at: '2023-09-10T00:00:00',
              total_uploads: 28,
              valid_uploads: 25,
              last_upload: '2024-01-14T16:45:00',
            },
            '4': {
              id: '4',
              name: 'Metro Electric',
              slug: 'metro-electric',
              description: 'Electric utility for metropolitan area',
              public_link: '/validate/metro-electric',
              alert_on_upload: true,
              admin_email: 'admin@metroelectric.com',
              created_at: '2023-11-01T00:00:00',
              total_uploads: 15,
              valid_uploads: 10,
              last_upload: '2024-01-14T14:20:00',
            },
          };
          setProject(mockProjects[projectId] || null);
        }
      } catch (err) {
        console.error('Error loading project:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const copyLink = async () => {
    const fullLink = `${window.location.origin}${project?.public_link}`;
    await navigator.clipboard.writeText(fullLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const successRate = project && project.total_uploads && project.total_uploads > 0
    ? Math.round(((project.valid_uploads || 0) / project.total_uploads) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-temetra-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/admin/projects"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <div className="card text-center py-12">
            <p className="text-gray-500">Project not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-gray-600">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/projects/${projectId}/edit`}
              className="btn-secondary flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <Link
              href={`/admin/projects/${projectId}/rules`}
              className="btn-primary flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Validation Rules
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{project.total_uploads || 0}</p>
                <p className="text-xs text-gray-500">Total Uploads</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{project.valid_uploads || 0}</p>
                <p className="text-xs text-gray-500">Valid Uploads</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{successRate}%</p>
                <p className="text-xs text-gray-500">Success Rate</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${project.alert_on_upload ? 'bg-green-100' : 'bg-gray-100'}`}>
                {project.alert_on_upload ? (
                  <Bell className="h-5 w-5 text-green-600" />
                ) : (
                  <BellOff className="h-5 w-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {project.alert_on_upload ? 'Alerts On' : 'Alerts Off'}
                </p>
                <p className="text-xs text-gray-500">Email notifications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Public Link */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Public Upload Link</h2>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm text-gray-800 overflow-hidden text-ellipsis">
                {project.public_link}
              </code>
              <button
                onClick={copyLink}
                className="p-2 hover:bg-gray-200 rounded"
                title="Copy link"
              >
                {copiedLink ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
              <Link
                href={project.public_link}
                target="_blank"
                className="p-2 hover:bg-gray-200 rounded"
                title="Open link"
              >
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Share this link with developers to upload CSV files for validation.
            </p>
          </div>

          {/* Admin Email */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Admin Contact</h2>
            <p className="text-gray-800">{project.admin_email || 'No email set'}</p>
            <p className="mt-2 text-xs text-gray-500">
              {project.alert_on_upload
                ? 'This email receives notifications when files are uploaded.'
                : 'Email alerts are disabled for this project.'}
            </p>
          </div>
        </div>

        {/* Activity info */}
        <div className="card mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Activity</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase">Created</p>
              <p className="font-medium">{formatDate(project.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">Last Upload</p>
              <p className="font-medium">
                {project.last_upload ? formatDate(project.last_upload) : 'No uploads yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Link
            href={`/admin/projects/${projectId}/logs`}
            className="card hover:shadow-md transition-shadow text-center"
          >
            <FileText className="h-8 w-8 text-temetra-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">View Logs</h3>
            <p className="text-xs text-gray-500 mt-1">See upload history and validation results</p>
          </Link>
          <Link
            href={`/admin/projects/${projectId}/upload`}
            className="card hover:shadow-md transition-shadow text-center"
          >
            <Key className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Upload Key</h3>
            <p className="text-xs text-gray-500 mt-1">Get API credentials for programmatic uploads</p>
          </Link>
          <Link
            href={`/admin/projects/${projectId}/rules`}
            className="card hover:shadow-md transition-shadow text-center"
          >
            <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Validation Rules</h3>
            <p className="text-xs text-gray-500 mt-1">Configure column validation settings</p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
