/**
 * Admin Validation Templates Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to view and edit validation templates.
 * Templates define the rules for validating CSV files.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
  Upload,
  File,
  Download,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { getDefaultTemplate } from '@/lib/validation-rules';
import { formatDate } from '@/lib/utils';

interface TemplateDocument {
  id: string;
  name: string;
  url: string;
  size: number;
  uploaded_at: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  rules: TemplateRule[];
  documents?: TemplateDocument[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
  used_by_projects?: number;
}

interface TemplateRule {
  id: string;
  column_name: string;
  column_index: number;
  is_required: boolean;
  allow_blank: boolean;
  is_unique: boolean;
  min_length?: number;
  max_length?: number;
  data_type: string;
  notes?: string;
  example?: string;
  color_code?: string;
  custom_rule?: string;
  custom_rule_regex?: string;
}

// Get the default template
const defaultTemplate = getDefaultTemplate();

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('validation_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get project counts for each template
        const templatesWithCounts = await Promise.all(
          data.map(async (template) => {
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('validation_template_id', template.id);

            return {
              ...template,
              rules: template.rules || defaultTemplate.rules,
              used_by_projects: count || 0,
            };
          })
        );
        setTemplates(templatesWithCounts);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Duplicate a template
  const duplicateTemplate = async (template: Template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        rules: template.rules,
        is_default: false,
      };

      const { data, error } = await supabase
        .from('validation_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTemplates(prev => [{ ...data, used_by_projects: 0 }, ...prev]);
        setMessage({ type: 'success', text: 'Template duplicated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      setMessage({ type: 'error', text: 'Failed to duplicate template. Please try again.' });
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('validation_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setShowDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Template deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting template:', err);
      setMessage({ type: 'error', text: 'Failed to delete template. Please try again.' });
    }
  };

  // Upload a document to a template
  const uploadDocument = async (templateId: string, file: File) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setIsUploadingDoc(templateId);
    try {
      const fileName = `templates/${templateId}/${Date.now()}-${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentation')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error('Failed to upload file. Storage may not be configured.');
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documentation')
        .getPublicUrl(fileName);

      // Create document entry
      const newDoc: TemplateDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        url: publicUrl,
        size: file.size,
        uploaded_at: new Date().toISOString(),
      };

      // Update template with new document
      const updatedDocs = [...(template.documents || []), newDoc];

      const { error: updateError } = await supabase
        .from('validation_templates')
        .update({
          documents: updatedDocs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (updateError) throw updateError;

      setTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, documents: updatedDocs } : t
      ));
      setMessage({ type: 'success', text: 'Document uploaded!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error uploading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUploadingDoc(null);
    }
  };

  // Delete a document from a template
  const deleteDocument = async (templateId: string, docId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const doc = template.documents?.find(d => d.id === docId);
    if (!doc) return;

    try {
      // Extract file path from URL for deletion
      const urlParts = doc.url.split('/documentation/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('documentation').remove([filePath]);
      }

      // Update template to remove document
      const updatedDocs = (template.documents || []).filter(d => d.id !== docId);

      const { error: updateError } = await supabase
        .from('validation_templates')
        .update({
          documents: updatedDocs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (updateError) throw updateError;

      setTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, documents: updatedDocs } : t
      ));
      setMessage({ type: 'success', text: 'Document deleted!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting document:', err);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
            <h1 className="text-2xl font-bold text-gray-900">Validation Templates</h1>
            <p className="mt-1 text-gray-600">
              Manage validation rules for different CSV formats
            </p>
          </div>
          <Link href="/admin/templates/new" className="mt-4 sm:mt-0 btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Link>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        {/* Templates list */}
        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="card">
              {/* Template header - click to go to edit page */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-4 flex-1 cursor-pointer"
                  onClick={() => router.push(`/admin/templates/${template.id}/edit`)}
                >
                  <div className="w-10 h-10 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-temetra-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <span className="badge-info">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{template.rules?.length || 0} columns</p>
                    <p className="text-xs text-gray-500">Used by {template.used_by_projects || 0} projects</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/admin/templates/${template.id}/edit`)}
                      className="p-2 text-temetra-blue-600 hover:bg-temetra-blue-50 rounded"
                      title="Edit Rules"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {!template.is_default && (
                      <button
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Documents</h4>
                  <label className={`btn-secondary text-xs flex items-center gap-1 cursor-pointer ${isUploadingDoc === template.id ? 'opacity-50' : ''}`}>
                    {isUploadingDoc === template.id ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3" />
                        Upload
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      disabled={isUploadingDoc === template.id}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadDocument(template.id, file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                </div>
                {(template.documents && template.documents.length > 0) ? (
                  <div className="space-y-2">
                    {template.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="h-4 w-4 text-temetra-blue-600 flex-shrink-0" />
                          <span className="truncate">{doc.name}</span>
                          <span className="text-xs text-gray-400 flex-shrink-0">{formatFileSize(doc.size)}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-temetra-blue-600 hover:bg-temetra-blue-50 rounded"
                            onClick={(e) => e.stopPropagation()}
                            title="Download"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(template.id, doc.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No documents uploaded</p>
                )}
              </div>

              {/* Last updated info */}
              <p className="mt-3 text-xs text-gray-400">
                Last updated: {formatDate(template.updated_at)}
              </p>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No templates found</p>
            <Link href="/admin/templates/new" className="mt-4 btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Template
            </Link>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTemplate(showDeleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
