/**
 * Admin Logs Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Shows all file uploads across all projects with filtering options.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface UploadLog {
  id: string;
  file_name: string;
  project_id: string;
  project_name: string;
  uploaded_by_email: string;
  uploaded_at: string;
  validation_status: string;
  validation_summary: string | null;
}

export default function AdminLogsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  // Load logs
  useEffect(() => {
    loadLogs();
  }, []);

  // Update filter when URL param changes
  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  const loadLogs = async () => {
    try {
      // Get all uploads
      const { data: uploadsData, error } = await supabase
        .from('file_uploads')
        .select('id, file_name, project_id, uploaded_by_email, uploaded_at, validation_status, validation_summary')
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error loading logs:', error);
        setLogs([]);
        return;
      }

      if (uploadsData && uploadsData.length > 0) {
        // Get project names
        const projectIds = [...new Set(uploadsData.map(u => u.project_id))];
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);

        const projectMap = new Map(projectsData?.map(p => [p.id, p.name]) || []);

        setLogs(uploadsData.map(log => ({
          ...log,
          project_name: projectMap.get(log.project_id) || 'Unknown Project',
        })));
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.uploaded_by_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || log.validation_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: logs.length,
    valid: logs.filter(l => l.validation_status === 'valid').length,
    invalid: logs.filter(l => l.validation_status === 'invalid').length,
    pending: logs.filter(l => l.validation_status === 'pending').length,
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
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Logs</h1>
          <p className="mt-1 text-gray-600">
            View all file uploads across all projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setStatusFilter('all')}
            className={`card text-left transition-all ${statusFilter === 'all' ? 'ring-2 ring-temetra-blue-500' : 'hover:shadow-md'}`}
          >
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Uploads</p>
          </button>
          <button
            onClick={() => setStatusFilter('valid')}
            className={`card text-left transition-all ${statusFilter === 'valid' ? 'ring-2 ring-green-500' : 'hover:shadow-md'}`}
          >
            <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
            <p className="text-sm text-gray-500">Valid</p>
          </button>
          <button
            onClick={() => setStatusFilter('invalid')}
            className={`card text-left transition-all ${statusFilter === 'invalid' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
          >
            <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
            <p className="text-sm text-gray-500">Invalid</p>
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`card text-left transition-all ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : 'hover:shadow-md'}`}
          >
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename, project, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Status</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Logs table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                  <th className="px-6 py-3 font-medium">File</th>
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Uploaded By</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{log.file_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/projects/${log.project_id}`}
                        className="text-temetra-blue-600 hover:text-temetra-blue-700 hover:underline"
                      >
                        {log.project_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.uploaded_by_email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(log.validation_status)}`}>
                        {getStatusIcon(log.validation_status)}
                        {log.validation_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(log.uploaded_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {log.validation_summary || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                {logs.length === 0 ? 'No uploads yet' : 'No uploads match your filters'}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-temetra-blue-600 hover:text-temetra-blue-700"
                >
                  Clear filters
                </button>
              )}
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
