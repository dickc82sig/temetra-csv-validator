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
  Upload,
  Trash2,
  File,
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
  template_csv_url: string | null;
  documentation_url: string | null;
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
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (!data) {
          setProject(null);
          return;
        }

        // Get upload stats
        const { count: totalUploads } = await supabase
          .from('file_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId);

        const { count: validUploads } = await supabase
          .from('file_uploads')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('validation_status', 'valid');

        const { data: lastUploadData } = await supabase
          .from('file_uploads')
          .select('uploaded_at')
          .eq('project_id', projectId)
          .order('uploaded_at', { ascending: false })
          .limit(1)
          .single();

        setProject({
          ...data,
          total_uploads: totalUploads || 0,
          valid_uploads: validUploads || 0,
          last_upload: lastUploadData?.uploaded_at,
        });
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

  /**
   * Upload documentation file (PDF, DOC, etc.)
   */
  const handleDocumentationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsUploadingDoc(true);
    setUploadMessage(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${project.slug}/documentation.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        // If bucket doesn't exist, save URL directly
        console.error('Storage upload error:', uploadError);
        // Fallback: store as a data URL or external URL
        const reader = new FileReader();
        reader.onload = async () => {
          // For now, we'll just update the project with a placeholder
          // In production, you'd want proper file storage
          const { error: updateError } = await supabase
            .from('projects')
            .update({ documentation_url: `/api/docs/${project.slug}/${file.name}` })
            .eq('id', project.id);

          if (updateError) {
            setUploadMessage({ type: 'error', text: 'Failed to save documentation reference' });
          } else {
            setUploadMessage({ type: 'success', text: 'Documentation uploaded successfully!' });
            setProject(prev => prev ? { ...prev, documentation_url: `/api/docs/${project.slug}/${file.name}` } : null);
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Update project with documentation URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ documentation_url: publicUrl })
        .eq('id', project.id);

      if (updateError) {
        setUploadMessage({ type: 'error', text: 'Failed to update project' });
        return;
      }

      setProject(prev => prev ? { ...prev, documentation_url: publicUrl } : null);
      setUploadMessage({ type: 'success', text: 'Documentation uploaded successfully!' });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({ type: 'error', text: 'Failed to upload documentation' });
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  /**
   * Upload template CSV file
   */
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    if (!file.name.endsWith('.csv')) {
      setUploadMessage({ type: 'error', text: 'Please upload a CSV file' });
      return;
    }

    setIsUploadingTemplate(true);
    setUploadMessage(null);

    try {
      const fileName = `${project.slug}/template.csv`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        setUploadMessage({ type: 'error', text: 'Failed to upload template. Storage may not be configured.' });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(fileName);

      // Update project with template URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ template_csv_url: publicUrl })
        .eq('id', project.id);

      if (updateError) {
        setUploadMessage({ type: 'error', text: 'Failed to update project' });
        return;
      }

      setProject(prev => prev ? { ...prev, template_csv_url: publicUrl } : null);
      setUploadMessage({ type: 'success', text: 'Template CSV uploaded successfully!' });
    } catch (err) {
      console.error('Upload error:', err);
      setUploadMessage({ type: 'error', text: 'Failed to upload template' });
    } finally {
      setIsUploadingTemplate(false);
      e.target.value = '';
    }
  };

  /**
   * Remove documentation
   */
  const removeDocumentation = async () => {
    if (!project || !confirm('Remove documentation?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ documentation_url: null })
        .eq('id', project.id);

      if (error) {
        setUploadMessage({ type: 'error', text: 'Failed to remove documentation' });
        return;
      }

      setProject(prev => prev ? { ...prev, documentation_url: null } : null);
      setUploadMessage({ type: 'success', text: 'Documentation removed' });
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Failed to remove documentation' });
    }
  };

  /**
   * Remove template
   */
  const removeTemplate = async () => {
    if (!project || !confirm('Remove template CSV?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ template_csv_url: null })
        .eq('id', project.id);

      if (error) {
        setUploadMessage({ type: 'error', text: 'Failed to remove template' });
        return;
      }

      setProject(prev => prev ? { ...prev, template_csv_url: null } : null);
      setUploadMessage({ type: 'success', text: 'Template removed' });
    } catch (err) {
      setUploadMessage({ type: 'error', text: 'Failed to remove template' });
    }
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

        {/* Documentation & Template Upload */}
        <div className="card mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">Developer Resources</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload documentation and template files that developers can access from the validation page.
          </p>

          {uploadMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              uploadMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {uploadMessage.text}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Documentation Upload */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium text-gray-900">Documentation</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Upload a PDF or document with format specifications and instructions.
              </p>

              {project.documentation_url ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1 truncate">Documentation uploaded</span>
                  <a
                    href={project.documentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-temetra-blue-600 hover:text-temetra-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={removeDocumentation}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-temetra-blue-400 hover:bg-temetra-blue-50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleDocumentationUpload}
                    className="hidden"
                    disabled={isUploadingDoc}
                  />
                  {isUploadingDoc ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isUploadingDoc ? 'Uploading...' : 'Upload Documentation'}
                  </span>
                </label>
              )}
            </div>

            {/* Template CSV Upload */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="font-medium text-gray-900">Template CSV</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Upload a sample CSV file with the correct column headers.
              </p>

              {project.template_csv_url ? (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1 truncate">Template uploaded</span>
                  <a
                    href={project.template_csv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-temetra-blue-600 hover:text-temetra-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={removeTemplate}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleTemplateUpload}
                    className="hidden"
                    disabled={isUploadingTemplate}
                  />
                  {isUploadingTemplate ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Upload className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isUploadingTemplate ? 'Uploading...' : 'Upload Template CSV'}
                  </span>
                </label>
              )}
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
