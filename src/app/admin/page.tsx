/**
 * Admin Dashboard Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the main admin dashboard showing an overview of all projects,
 * recent uploads, and quick access to admin functions.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FolderOpen,
  Upload,
  FileText,
  Settings,
  Bell,
  Plus,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { formatDate } from '@/lib/utils';

// Mock data for demonstration
const mockStats = {
  totalProjects: 5,
  totalUploads: 127,
  validFiles: 98,
  invalidFiles: 29,
  pendingReview: 3,
};

const mockRecentUploads = [
  {
    id: '1',
    fileName: 'NewNetworkUpload_Jan2024.csv',
    projectName: 'Acme Water',
    uploadedBy: 'john@acmewater.com',
    uploadedAt: '2024-01-15T10:30:00',
    status: 'valid',
    errors: 0,
  },
  {
    id: '2',
    fileName: 'meters_batch_23.csv',
    projectName: 'City Utilities',
    uploadedBy: 'alex@cityutil.com',
    uploadedAt: '2024-01-15T09:15:00',
    status: 'invalid',
    errors: 12,
  },
  {
    id: '3',
    fileName: 'Q4_import.csv',
    projectName: 'Regional Gas Co',
    uploadedBy: 'sarah@regionalgas.com',
    uploadedAt: '2024-01-14T16:45:00',
    status: 'valid',
    errors: 0,
  },
  {
    id: '4',
    fileName: 'new_installs_dec.csv',
    projectName: 'Metro Electric',
    uploadedBy: 'mike@metroelectric.com',
    uploadedAt: '2024-01-14T14:20:00',
    status: 'invalid',
    errors: 5,
  },
];

const mockProjects = [
  { id: '1', name: 'Acme Water', uploads: 45, lastActivity: '2024-01-15T10:30:00' },
  { id: '2', name: 'City Utilities', uploads: 32, lastActivity: '2024-01-15T09:15:00' },
  { id: '3', name: 'Regional Gas Co', uploads: 28, lastActivity: '2024-01-14T16:45:00' },
];

export default function AdminDashboard() {
  const [adminName] = useState('Admin User');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName={adminName} userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header with greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-gray-600">Welcome back! Here&apos;s what&apos;s happening.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Link href="/admin/projects/new" className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            title="Total Projects"
            value={mockStats.totalProjects}
            icon={FolderOpen}
            color="blue"
          />
          <StatCard
            title="Total Uploads"
            value={mockStats.totalUploads}
            icon={Upload}
            color="gray"
          />
          <StatCard
            title="Valid Files"
            value={mockStats.validFiles}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Invalid Files"
            value={mockStats.invalidFiles}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Pending Review"
            value={mockStats.pendingReview}
            icon={Clock}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Uploads */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
                <Link href="/admin/logs" className="text-sm text-temetra-blue-600 hover:text-temetra-blue-700 flex items-center gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-3 font-medium">File</th>
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Uploaded By</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockRecentUploads.map(upload => (
                      <tr key={upload.id} className="text-sm">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{upload.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600">{upload.projectName}</td>
                        <td className="py-3 text-gray-600">
                          {/* Easter egg: Show "Alexa" for Alex */}
                          {upload.uploadedBy.toLowerCase().includes('alex')
                            ? upload.uploadedBy.replace(/alex/i, 'Alexa')
                            : upload.uploadedBy}
                        </td>
                        <td className="py-3">
                          {upload.status === 'valid' ? (
                            <span className="badge-success">Valid</span>
                          ) : (
                            <span className="badge-error">{upload.errors} errors</span>
                          )}
                        </td>
                        <td className="py-3 text-gray-500">
                          {formatDate(upload.uploadedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Active Projects</h2>
                <Link href="/admin/projects" className="text-sm text-temetra-blue-600 hover:text-temetra-blue-700">
                  Manage
                </Link>
              </div>

              <div className="space-y-3">
                {mockProjects.map(project => (
                  <Link
                    key={project.id}
                    href={`/admin/projects/${project.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-temetra-blue-300 hover:bg-temetra-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{project.name}</span>
                      <span className="text-sm text-gray-500">{project.uploads} uploads</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Last activity: {formatDate(project.lastActivity)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/admin/users" className="w-full btn-secondary flex items-center gap-2 justify-start">
                  <Users className="h-4 w-4" />
                  Manage Users
                </Link>
                <Link href="/admin/templates" className="w-full btn-secondary flex items-center gap-2 justify-start">
                  <FileText className="h-4 w-4" />
                  Validation Templates
                </Link>
                <Link href="/admin/settings" className="w-full btn-secondary flex items-center gap-2 justify-start">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="card border-yellow-200 bg-yellow-50">
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-yellow-800">3 files need review</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Some uploaded files have validation errors and may need attention.
                  </p>
                  <Link href="/admin/logs?status=invalid" className="text-sm text-yellow-800 font-medium mt-2 inline-block hover:underline">
                    Review now →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}

/**
 * Stat card component for the dashboard
 */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
