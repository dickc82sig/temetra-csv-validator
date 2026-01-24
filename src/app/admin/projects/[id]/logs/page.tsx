/**
 * Project Logs Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page shows upload history and validation logs for a specific project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Loader2,
  Calendar,
  Filter,
  LayoutGrid,
  Database,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface UploadLog {
  id: string;
  filename: string;
  uploadedAt: string;
  uploadedBy: string;
  status: 'valid' | 'invalid' | 'partial';
  totalRows: number;
  validRows: number;
  errorCount: number;
  warningCount: number;
  layoutErrors: number;
  dataErrors: number;
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

export default function ProjectLogsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.id as string;

  // Get initial filter from URL params
  const initialErrorType = searchParams.get('error_type') || 'all';

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterErrorType, setFilterErrorType] = useState<string>(initialErrorType);
  const [selectedLog, setSelectedLog] = useState<UploadLog | null>(null);

  // Load project and logs
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load project from Supabase
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, slug')
          .eq('id', projectId)
          .single();

        if (projectData) {
          setProject(projectData);
        } else {
          setProject(null);
        }

        // Load logs from Supabase
        const { data: logsData } = await supabase
          .from('file_uploads')
          .select('*')
          .eq('project_id', projectId)
          .order('uploaded_at', { ascending: false });

        if (logsData && logsData.length > 0) {
          // Map Supabase data to our interface
          setLogs(logsData.map(log => {
            // Parse validation_summary like "100 rows, 5 errors"
            let totalRows = 0;
            let errorCount = 0;
            let layoutErrors = 0;
            let dataErrors = 0;

            if (log.validation_summary) {
              const rowsMatch = log.validation_summary.match(/(\d+)\s*rows?/i);
              const errorsMatch = log.validation_summary.match(/(\d+)\s*errors?/i);
              if (rowsMatch) totalRows = parseInt(rowsMatch[1], 10);
              if (errorsMatch) errorCount = parseInt(errorsMatch[1], 10);
            }

            // Count and categorize errors from validation_errors array
            if (log.validation_errors && Array.isArray(log.validation_errors)) {
              log.validation_errors.forEach((error: { rule: string }) => {
                if (error.rule === 'missing_column' || error.rule === 'extra_column') {
                  layoutErrors++;
                } else {
                  dataErrors++;
                }
              });
              errorCount = log.validation_errors.length;
            }

            const validRows = totalRows - errorCount;

            return {
              id: log.id,
              filename: log.file_name,
              uploadedAt: log.uploaded_at,
              uploadedBy: log.uploaded_by_email || 'Unknown',
              status: log.validation_status === 'valid' ? 'valid' : (log.validation_status === 'invalid' ? 'invalid' : 'partial'),
              totalRows,
              validRows: validRows > 0 ? validRows : 0,
              errorCount,
              warningCount: 0,
              layoutErrors,
              dataErrors,
            };
          }));
        } else {
          setLogs([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Filter logs by status and error type
  const filteredLogs = logs.filter(log => {
    // Status filter
    if (filterStatus !== 'all' && log.status !== filterStatus) {
      return false;
    }
    // Error type filter
    if (filterErrorType === 'layout' && log.layoutErrors === 0) {
      return false;
    }
    if (filterErrorType === 'data' && log.dataErrors === 0) {
      return false;
    }
    return true;
  });

  // Calculate stats
  const stats = {
    total: logs.length,
    valid: logs.filter(l => l.status === 'valid').length,
    partial: logs.filter(l => l.status === 'partial').length,
    invalid: logs.filter(l => l.status === 'invalid').length,
    successRate: logs.length > 0
      ? Math.round((logs.filter(l => l.status === 'valid').length / logs.length) * 100)
      : 0,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      valid: 'bg-green-100 text-green-700',
      partial: 'bg-amber-100 text-amber-700',
      invalid: 'bg-red-100 text-red-700',
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-6xl mx-auto px-4 py-8">
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
        <main className="max-w-6xl mx-auto px-4 py-8">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Logs</h1>
            <p className="mt-1 text-gray-600">
              {project.name} &bull; Viewing validation history
            </p>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="card">
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Uploads</p>
          </div>
          <div className="card">
            <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
            <p className="text-xs text-gray-500">Valid</p>
          </div>
          <div className="card">
            <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
            <p className="text-xs text-gray-500">Partial</p>
          </div>
          <div className="card">
            <p className="text-2xl font-bold text-red-600">{stats.invalid}</p>
            <p className="text-xs text-gray-500">Invalid</p>
          </div>
          <div className="card">
            <p className="text-2xl font-bold text-temetra-blue-600">{stats.successRate}%</p>
            <p className="text-xs text-gray-500">Success Rate</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Status:</span>
            <div className="flex gap-2">
              {['all', 'valid', 'partial', 'invalid'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filterStatus === status
                      ? 'bg-temetra-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Error type filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Error Type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterErrorType('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterErrorType === 'all'
                    ? 'bg-temetra-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterErrorType('layout')}
                className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                  filterErrorType === 'layout'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Layout
              </button>
              <button
                onClick={() => setFilterErrorType('data')}
                className={`px-3 py-1 text-sm rounded-full transition-colors flex items-center gap-1 ${
                  filterErrorType === 'data'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                <Database className="h-3 w-3" />
                Data
              </button>
            </div>
          </div>
        </div>

        {/* Logs table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Filename</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Uploaded By</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Rows</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Errors</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{log.filename}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.uploadedBy}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(log.uploadedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-green-600">{log.validRows}</span>
                    <span className="text-gray-400"> / </span>
                    <span className="text-gray-600">{log.totalRows}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {(log.layoutErrors > 0 || log.dataErrors > 0) ? (
                      <div className="flex gap-2">
                        {log.layoutErrors > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs">
                            <LayoutGrid className="h-3 w-3" />
                            {log.layoutErrors}
                          </span>
                        )}
                        {log.dataErrors > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs">
                            <Database className="h-3 w-3" />
                            {log.dataErrors}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-600">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-gray-400 hover:text-temetra-blue-600"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-temetra-blue-600"
                        title="Download Report"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {logs.length === 0 ? (
                'No uploads yet'
              ) : (
                <>
                  No uploads found
                  {filterStatus !== 'all' && ` with status "${filterStatus}"`}
                  {filterErrorType !== 'all' && ` with ${filterErrorType} errors`}
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterErrorType('all');
                    }}
                    className="block mx-auto mt-2 text-temetra-blue-600 hover:text-temetra-blue-700"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upload Details</h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Filename</p>
                  <p className="font-medium">{selectedLog.filename}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedLog.status)}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(selectedLog.status)}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Uploaded By</p>
                  <p className="font-medium">{selectedLog.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Upload Date</p>
                  <p className="font-medium">{formatDate(selectedLog.uploadedAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Validation Results</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold text-gray-900">{selectedLog.totalRows}</p>
                    <p className="text-xs text-gray-500">Total Rows</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-xl font-bold text-green-600">{selectedLog.validRows}</p>
                    <p className="text-xs text-gray-500">Valid Rows</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="flex items-center justify-center gap-1 text-red-600">
                      <LayoutGrid className="h-4 w-4" />
                      <p className="text-xl font-bold">{selectedLog.layoutErrors}</p>
                    </div>
                    <p className="text-xs text-gray-500">Layout Errors</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="flex items-center justify-center gap-1 text-orange-600">
                      <Database className="h-4 w-4" />
                      <p className="text-xl font-bold">{selectedLog.dataErrors}</p>
                    </div>
                    <p className="text-xs text-gray-500">Data Errors</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Report
                </button>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="btn-primary flex-1"
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
