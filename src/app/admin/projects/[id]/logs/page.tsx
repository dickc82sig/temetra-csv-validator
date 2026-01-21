/**
 * Project Logs Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page shows upload history and validation logs for a specific project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
}

interface Project {
  id: string;
  name: string;
  slug: string;
}

// Mock data for demo
const mockLogs: UploadLog[] = [
  {
    id: '1',
    filename: 'meter_data_jan_2024.csv',
    uploadedAt: '2024-01-15T10:30:00',
    uploadedBy: 'john@acme.com',
    status: 'valid',
    totalRows: 1250,
    validRows: 1250,
    errorCount: 0,
    warningCount: 3,
  },
  {
    id: '2',
    filename: 'readings_batch_12.csv',
    uploadedAt: '2024-01-14T14:22:00',
    uploadedBy: 'jane@acme.com',
    status: 'partial',
    totalRows: 890,
    validRows: 845,
    errorCount: 45,
    warningCount: 12,
  },
  {
    id: '3',
    filename: 'network_upload_q4.csv',
    uploadedAt: '2024-01-13T09:15:00',
    uploadedBy: 'dev@acme.com',
    status: 'invalid',
    totalRows: 500,
    validRows: 120,
    errorCount: 380,
    warningCount: 0,
  },
  {
    id: '4',
    filename: 'meter_data_dec_2023.csv',
    uploadedAt: '2024-01-10T16:45:00',
    uploadedBy: 'john@acme.com',
    status: 'valid',
    totalRows: 2100,
    validRows: 2100,
    errorCount: 0,
    warningCount: 0,
  },
  {
    id: '5',
    filename: 'readings_update.csv',
    uploadedAt: '2024-01-08T11:30:00',
    uploadedBy: 'jane@acme.com',
    status: 'valid',
    totalRows: 450,
    validRows: 450,
    errorCount: 0,
    warningCount: 8,
  },
];

export default function ProjectLogsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
          // Mock project data for demo
          const mockProjects: Record<string, Project> = {
            '1': { id: '1', name: 'Acme Water Company', slug: 'acme-water' },
            '2': { id: '2', name: 'City Utilities Department', slug: 'city-utilities' },
            '3': { id: '3', name: 'Regional Gas Co', slug: 'regional-gas' },
            '4': { id: '4', name: 'Metro Electric', slug: 'metro-electric' },
          };
          setProject(mockProjects[projectId] || { id: projectId, name: 'Unknown Project', slug: 'unknown' });
        }

        // Try to load logs from Supabase
        const { data: logsData } = await supabase
          .from('file_uploads')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (logsData && logsData.length > 0) {
          // Map Supabase data to our interface
          setLogs(logsData.map(log => ({
            id: log.id,
            filename: log.file_name,
            uploadedAt: log.created_at,
            uploadedBy: log.uploaded_by_email || 'Unknown',
            status: log.validation_passed ? 'valid' : (log.error_count > log.total_rows / 2 ? 'invalid' : 'partial'),
            totalRows: log.total_rows || 0,
            validRows: log.valid_rows || 0,
            errorCount: log.error_count || 0,
            warningCount: log.warning_count || 0,
          })));
        } else {
          // Use mock data for demo
          setLogs(mockLogs);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        // Fallback to mock data
        setProject({ id: projectId, name: 'Demo Project', slug: 'demo' });
        setLogs(mockLogs);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Filter logs by status
  const filteredLogs = filterStatus === 'all'
    ? logs
    : logs.filter(log => log.status === filterStatus);

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
              {project?.name} &bull; Viewing validation history
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

        {/* Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Filter:</span>
          </div>
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
                    {log.errorCount > 0 && (
                      <span className="text-red-600">{log.errorCount} errors</span>
                    )}
                    {log.errorCount > 0 && log.warningCount > 0 && <span className="text-gray-400">, </span>}
                    {log.warningCount > 0 && (
                      <span className="text-amber-600">{log.warningCount} warnings</span>
                    )}
                    {log.errorCount === 0 && log.warningCount === 0 && (
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
              No uploads found with status &quot;{filterStatus}&quot;
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <p className="text-xl font-bold text-gray-900">{selectedLog.totalRows}</p>
                    <p className="text-xs text-gray-500">Total Rows</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-xl font-bold text-green-600">{selectedLog.validRows}</p>
                    <p className="text-xs text-gray-500">Valid Rows</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <p className="text-xl font-bold text-red-600">{selectedLog.errorCount}</p>
                    <p className="text-xs text-gray-500">Errors</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 rounded">
                    <p className="text-xl font-bold text-amber-600">{selectedLog.warningCount}</p>
                    <p className="text-xs text-gray-500">Warnings</p>
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
