/**
 * Developer Upload History Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Shows the developer's previous CSV uploads and their validation status.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  Calendar,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface UploadRecord {
  id: string;
  file_name: string;
  uploaded_at: string;
  validation_status: 'valid' | 'invalid' | 'pending';
  validation_summary: string | null;
  total_rows?: number;
  error_count?: number;
}

export default function DeveloperHistoryPage() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      // TODO: Filter by current user's email when auth is implemented
      const { data, error } = await supabase
        .from('file_uploads')
        .select('id, file_name, uploaded_at, validation_status, validation_summary')
        .order('uploaded_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading uploads:', error);
        setUploads([]);
        return;
      }

      setUploads(data || []);
    } catch (err) {
      console.error('Error:', err);
      setUploads([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      valid: 'bg-green-100 text-green-700',
      invalid: 'bg-red-100 text-red-700',
      pending: 'bg-yellow-100 text-yellow-700',
    };
    return classes[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Developer" userRole="developer" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-temetra-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Developer" userRole="developer" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/developer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload History</h1>
          <p className="mt-1 text-gray-600">
            View your previous CSV uploads and their validation results
          </p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-900">{uploads.length}</p>
            <p className="text-sm text-gray-500">Total Uploads</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-600">
              {uploads.filter(u => u.validation_status === 'valid').length}
            </p>
            <p className="text-sm text-gray-500">Valid</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-red-600">
              {uploads.filter(u => u.validation_status === 'invalid').length}
            </p>
            <p className="text-sm text-gray-500">Invalid</p>
          </div>
        </div>

        {/* Uploads list */}
        <div className="card overflow-hidden">
          {uploads.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    File
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Summary
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {uploads.map(upload => (
                  <tr key={upload.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{upload.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(upload.uploaded_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(upload.validation_status)}`}>
                        {getStatusIcon(upload.validation_status)}
                        {upload.validation_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {upload.validation_summary || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUpload(upload)}
                        className="p-1 text-gray-400 hover:text-temetra-blue-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No uploads yet</p>
              <Link href="/developer" className="mt-4 btn-primary inline-block">
                Upload Your First File
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selectedUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload Details</h3>
                <button
                  onClick={() => setSelectedUpload(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Filename</p>
                <p className="font-medium">{selectedUpload.file_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Upload Date</p>
                <p className="font-medium">{formatDate(selectedUpload.uploaded_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(selectedUpload.validation_status)}
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${getStatusBadge(selectedUpload.validation_status)}`}>
                    {selectedUpload.validation_status}
                  </span>
                </div>
              </div>
              {selectedUpload.validation_summary && (
                <div>
                  <p className="text-xs text-gray-500 uppercase">Summary</p>
                  <p className="text-sm text-gray-700">{selectedUpload.validation_summary}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <button
                  onClick={() => setSelectedUpload(null)}
                  className="btn-primary w-full"
                >
                  Close
                </button>
              </div>
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
