/**
 * New Project Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to create a new customer project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { createSlug } from '@/lib/utils';

interface TemplateOption {
  id: string;
  name: string;
  description: string | null;
  ruleCount: number;
}

export default function NewProjectPage() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    adminEmail: '',
    alertOnUpload: true,
    templateId: '',
  });

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from name
  const slug = createSlug(formData.name);
  const publicLink = slug ? `/validate/${slug}` : '';

  // Load available templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('validation_templates')
          .select('id, name, description, rules')
          .eq('is_active', true)
          .order('name');

        if (fetchError) {
          console.error('Error loading templates:', fetchError);
          return;
        }

        if (data) {
          const options: TemplateOption[] = data.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            ruleCount: Array.isArray(t.rules) ? t.rules.length : 0,
          }));
          setTemplates(options);

          // Auto-select the first template (or default)
          const defaultTemplate = data.find(t => (t as Record<string, unknown>).is_default) || data[0];
          if (defaultTemplate) {
            setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }));
          }
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  /**
   * Handle form field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    if (!formData.templateId) {
      setError('Please select a validation template');
      return;
    }

    setIsLoading(true);

    try {
      // Insert the new project with the selected template
      const { data, error: insertError } = await supabase
        .from('projects')
        .insert({
          name: formData.name.trim(),
          slug: slug,
          description: formData.description.trim() || null,
          public_link: publicLink,
          validation_template_id: formData.templateId,
          alert_on_upload: formData.alertOnUpload,
          admin_email: formData.adminEmail.trim(),
          status: 'active',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Failed to create project: ${insertError.message}`);
        return;
      }

      // Success - redirect to projects list
      router.push('/admin/projects');
    } catch (err) {
      console.error('Error creating project:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600 mb-8">
          Set up a new customer project with its own validation rules and unique upload link.
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
                <p className="text-xs text-gray-500 mt-1">
                  Developers will use this link to upload files for this project.
                </p>
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

            {/* Validation Template Selector */}
            <div>
              <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                Validation Template <span className="text-red-500">*</span>
              </label>
              {isLoadingTemplates ? (
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : templates.length === 0 ? (
                <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  No templates found. Please <Link href="/admin/templates" className="underline font-medium">create a template</Link> first.
                </div>
              ) : (
                <>
                  <select
                    id="templateId"
                    name="templateId"
                    value={formData.templateId}
                    onChange={handleChange}
                    className="input-field mt-1"
                    required
                  >
                    <option value="">Select a template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.ruleCount} columns)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    This template defines the CSV columns and validation rules for this project.
                  </p>
                </>
              )}
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
          <div className="mt-8 pt-6 border-t flex gap-3 justify-end">
            <Link href="/admin/projects" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || !formData.templateId}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
