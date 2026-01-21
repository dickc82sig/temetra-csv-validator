/**
 * Edit Project Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to edit an existing project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  public_link: string;
  alert_on_upload: boolean;
  admin_email: string | null;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    adminEmail: '',
    alertOnUpload: true,
  });

  const [originalSlug, setOriginalSlug] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-generate slug from name
  const slug = createSlug(formData.name);
  const publicLink = slug ? `/validate/${slug}` : '';

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          // If not found in Supabase, try mock data for demo
          const mockProjects = [
            { id: '1', name: 'Acme Water Company', slug: 'acme-water', description: 'Municipal water utility serving the greater Acme area', admin_email: 'admin@acme.com', alert_on_upload: true },
            { id: '2', name: 'City Utilities Department', slug: 'city-utilities', description: 'City water and gas services', admin_email: 'admin@cityutil.com', alert_on_upload: true },
            { id: '3', name: 'Regional Gas Co', slug: 'regional-gas', description: 'Natural gas distribution company', admin_email: 'admin@regionalgas.com', alert_on_upload: false },
            { id: '4', name: 'Metro Electric', slug: 'metro-electric', description: 'Electric utility for metropolitan area', admin_email: 'admin@metroelectric.com', alert_on_upload: true },
          ];
          const mockProject = mockProjects.find(p => p.id === projectId);
          if (mockProject) {
            setFormData({
              name: mockProject.name,
              description: mockProject.description || '',
              adminEmail: mockProject.admin_email || '',
              alertOnUpload: mockProject.alert_on_upload,
            });
            setOriginalSlug(mockProject.slug);
          } else {
            setError('Project not found');
          }
          setIsLoading(false);
          return;
        }

        if (data) {
          setFormData({
            name: data.name,
            description: data.description || '',
            adminEmail: data.admin_email || '',
            alertOnUpload: data.alert_on_upload,
          });
          setOriginalSlug(data.slug);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project');
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  /**
   * Handle form field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!formData.adminEmail.trim()) {
      setError('Admin email is required');
      return;
    }

    setIsSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          public_link: publicLink,
          alert_on_upload: formData.alertOnUpload,
          admin_email: formData.adminEmail.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('Update error:', updateError);
        // For demo mode, just redirect
        if (updateError.code === 'PGRST116') {
          router.push('/admin/projects');
          return;
        }
        setError(`Failed to update project: ${updateError.message}`);
        return;
      }

      // Success - redirect to projects list
      router.push('/admin/projects');
    } catch (err) {
      console.error('Error updating project:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle project deletion
   */
  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        // For demo mode, just redirect
        router.push('/admin/projects');
        return;
      }

      // Success - redirect to projects list
      router.push('/admin/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-2xl mx-auto px-4 py-8">
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Project</h1>
        <p className="text-gray-600 mb-8">
          Update the project settings and configuration.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Acme Water Company"
              />
              <p className="mt-1 text-xs text-gray-500">
                This name will be shown to developers when they upload files.
              </p>
            </div>

            {/* Auto-generated slug preview */}
            {slug && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-600">
                  <strong>Public Link:</strong>{' '}
                  <code className="bg-gray-200 px-2 py-0.5 rounded">{publicLink}</code>
                </p>
                {slug !== originalSlug && (
                  <p className="text-xs text-amber-600 mt-1">
                    Warning: Changing the project name will change the public link.
                    Old links will no longer work.
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="Brief description of this project..."
              />
            </div>

            {/* Admin Email */}
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                id="adminEmail"
                name="adminEmail"
                type="email"
                required
                value={formData.adminEmail}
                onChange={handleChange}
                className="input-field mt-1"
                placeholder="admin@company.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                This email will receive notifications when files are uploaded.
              </p>
            </div>

            {/* Alert on Upload */}
            <div className="flex items-center gap-3">
              <input
                id="alertOnUpload"
                name="alertOnUpload"
                type="checkbox"
                checked={formData.alertOnUpload}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
              />
              <label htmlFor="alertOnUpload" className="text-sm text-gray-700">
                Send email notification when a file is uploaded
              </label>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="mt-8 pt-6 border-t flex gap-3 justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="btn-secondary text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Project
            </button>
            <div className="flex gap-3">
              <Link href="/admin/projects" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{formData.name}&quot;? This action cannot be undone.
                All upload history and logs for this project will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
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
