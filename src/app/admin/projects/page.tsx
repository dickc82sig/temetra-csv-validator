/**
 * Admin Projects List Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Shows all projects with options to create, edit, and manage them.
 * Each project represents a customer's CSV validation setup.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Link as LinkIcon,
  Copy,
  Eye,
  Bell,
  BellOff,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  Database,
  FileText,
  Upload,
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
  created_at: string;
  validation_template_id?: string;
  total_uploads?: number;
  last_upload?: string;
  last_upload_status?: 'valid' | 'invalid' | 'pending' | null;
  layout_errors?: number;
  data_errors?: number;
  has_valid_upload?: boolean;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [origin, setOrigin] = useState('');

  // Set origin on client side
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Load projects from Supabase
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      if (data) {
        // Get upload stats for each project
        const projectsWithStats = await Promise.all(
          data.map(async (project) => {
            const { count: totalUploads } = await supabase
              .from('file_uploads')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id);

            // Get the last upload with its validation status and errors
            const { data: lastUploadData } = await supabase
              .from('file_uploads')
              .select('uploaded_at, validation_status, validation_errors')
              .eq('project_id', project.id)
              .order('uploaded_at', { ascending: false })
              .limit(1)
              .single();

            // Check if project has ever had a valid upload
            const { count: validCount } = await supabase
              .from('file_uploads')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id)
              .eq('validation_status', 'valid');

            // Count layout errors vs data errors from the last upload
            let layoutErrors = 0;
            let dataErrors = 0;

            if (lastUploadData?.validation_errors) {
              const errors = lastUploadData.validation_errors as Array<{ rule: string }>;
              errors.forEach((error) => {
                // Layout errors are column structure issues
                if (error.rule === 'missing_column' || error.rule === 'extra_column') {
                  layoutErrors++;
                } else {
                  dataErrors++;
                }
              });
            }

            return {
              ...project,
              total_uploads: totalUploads || 0,
              last_upload: lastUploadData?.uploaded_at,
              last_upload_status: lastUploadData?.validation_status as 'valid' | 'invalid' | 'pending' | null,
              layout_errors: layoutErrors,
              data_errors: dataErrors,
              has_valid_upload: (validCount || 0) > 0,
            };
          })
        );

        setProjects(projectsWithStats);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter projects by search term
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Copy the project's public link to clipboard
   */
  const copyLink = async (projectId: string, link: string) => {
    const fullLink = `${window.location.origin}${link}`;
    await navigator.clipboard.writeText(fullLink);
    setCopiedLink(projectId);
    setOpenMenu(null);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  /**
   * Delete a project
   */
  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: false })
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setOpenMenu(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-temetra-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-600">
              Manage customer projects and their validation settings
            </p>
          </div>
          <Link href="/admin/projects/new" className="mt-4 sm:mt-0 btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="card hover:shadow-md transition-shadow overflow-hidden relative">
              {/* Validation status line across the top */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                project.has_valid_upload ? 'bg-green-500' : 'bg-red-500'
              }`} />

              {/* Header with menu */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.description || 'No description'}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {openMenu === project.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Project
                      </Link>
                      <Link
                        href={`/admin/projects/${project.id}/rules`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Validation Rules
                      </Link>
                      <button
                        onClick={() => copyLink(project.id, project.public_link)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedLink === project.id ? 'Copied!' : 'Copy Public Link'}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="py-4 border-y border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{project.total_uploads || 0}</p>
                    <p className="text-xs text-gray-500">Total Uploads</p>
                  </div>
                  {/* Status indicator for last upload */}
                  <div className="text-right">
                    {project.last_upload_status === 'valid' ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-6 w-6" />
                        <span className="text-sm font-medium">Passed</span>
                      </div>
                    ) : project.last_upload_status === 'invalid' ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-6 w-6" />
                        <span className="text-sm font-medium">Failed</span>
                      </div>
                    ) : project.last_upload_status === 'pending' ? (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="h-6 w-6" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-sm">No uploads</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Last File Status</p>
                  </div>
                </div>

                {/* Error counters - only show if there are errors */}
                {(project.layout_errors || 0) + (project.data_errors || 0) > 0 && (
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/admin/projects/${project.id}/logs?error_type=layout`}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (project.layout_errors || 0) > 0
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>{project.layout_errors || 0} Layout</span>
                    </Link>
                    <Link
                      href={`/admin/projects/${project.id}/logs?error_type=data`}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        (project.data_errors || 0) > 0
                          ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Database className="h-4 w-4" />
                      <span>{project.data_errors || 0} Data</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="mt-4 space-y-2">
                {/* Public link */}
                <div className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 font-medium">Public Link:</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-2 rounded flex-1 break-all whitespace-normal select-all">
                      {origin}{project.public_link}
                    </code>
                    <button
                      onClick={() => copyLink(project.id, project.public_link)}
                      className={`p-2 rounded transition-colors flex-shrink-0 ${
                        copiedLink === project.id
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-temetra-blue-600 hover:bg-gray-200'
                      }`}
                      title={copiedLink === project.id ? 'Copied!' : 'Copy to clipboard'}
                    >
                      {copiedLink === project.id ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Alert status */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    {project.alert_on_upload ? (
                      <>
                        <Bell className="h-4 w-4 text-green-500" />
                        <span>Alerts enabled</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 text-gray-400" />
                        <span>Alerts disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Last upload */}
                <p className="text-xs text-gray-500">
                  {project.last_upload
                    ? `Last upload: ${formatDate(project.last_upload)}`
                    : 'No uploads yet'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <Link
                  href={`/validate/${project.slug}`}
                  className="w-full btn-primary text-center text-sm flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload File to Validate
                </Link>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/projects/${project.id}/logs`}
                    className="flex-1 btn-secondary text-center text-sm"
                  >
                    View Logs
                  </Link>
                  {project.validation_template_id && (
                    <Link
                      href={`/admin/templates/${project.validation_template_id}/documents`}
                      className="flex-1 btn-secondary text-center text-sm flex items-center justify-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Docs
                    </Link>
                  )}
                  <Link
                    href={`/admin/projects/${project.id}/upload`}
                    className="flex-1 btn-secondary text-center text-sm"
                  >
                    Upload Key
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && !isLoading && (
          <div className="text-center py-12">
            {searchTerm ? (
              <>
                <p className="text-gray-500">No projects found matching &quot;{searchTerm}&quot;</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-temetra-blue-600 hover:text-temetra-blue-700"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-500 mb-4">No projects yet. Create your first project to get started.</p>
                <Link href="/admin/projects/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Project
                </Link>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
