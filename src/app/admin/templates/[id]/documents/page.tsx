/**
 * Template Documents Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * View and download documentation for a template.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  File,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  HardDrive,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';

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
  documents?: TemplateDocument[];
}

export default function TemplateDocumentsPage() {
  const params = useParams();
  const templateId = params.id as string;
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('validation_templates')
        .select('id, name, description, documents')
        .eq('id', templateId)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (err) {
      console.error('Error loading template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'text-red-500';
    if (['doc', 'docx'].includes(ext || '')) return 'text-blue-500';
    if (['xls', 'xlsx'].includes(ext || '')) return 'text-green-500';
    if (ext === 'csv') return 'text-orange-500';
    return 'text-gray-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="User" userRole="developer" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-temetra-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="User" userRole="developer" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Template not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="User" userRole="developer" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/developer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-temetra-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-gray-600">{template.description || 'Template Documentation'}</p>
            </div>
          </div>
        </div>

        {/* Documents list */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Available Documents</h2>

          {template.documents && template.documents.length > 0 ? (
            <div className="space-y-3">
              {template.documents.map(doc => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <File className={`h-8 w-8 ${getFileIcon(doc.name)}`} />
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-temetra-blue-600">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-temetra-blue-600">
                    <Download className="h-5 w-5" />
                    <span className="text-sm font-medium">Download</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No documents available for this template</p>
              <p className="text-sm text-gray-400 mt-1">
                Contact your administrator if you need documentation.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
