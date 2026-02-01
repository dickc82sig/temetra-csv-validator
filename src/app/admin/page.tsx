/**
 * Admin Dashboard Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the main admin dashboard showing an overview of all projects,
 * recent uploads, and quick access to admin functions.
 */

'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { formatDate } from '@/lib/utils';

interface Stats {
  totalProjects: number;
  totalUploads: number;
  validFiles: number;
  invalidFiles: number;
  pendingReview: number;
}

interface RecentUpload {
  id: string;
  file_name: string;
  project_name: string;
  uploaded_by_email: string;
  uploaded_at: string;
  validation_status: string;
  error_count: number;
}

interface Project {
  id: string;
  name: string;
  upload_count: number;
  last_activity: string;
}

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalUploads: 0,
    validFiles: 0,
    invalidFiles: 0,
    pendingReview: 0,
  });
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [adminName] = useState('Admin User');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to load dashboard data');
      const data = await response.json();

      setStats(data.stats);
      setRecentUploads(data.recentUploads);
      setProjects(data.projects);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName={adminName} userRole="admin" />
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
            value={stats.totalProjects}
            icon={FolderOpen}
            color="blue"
            href="/admin/projects"
          />
          <StatCard
            title="Total Uploads"
            value={stats.totalUploads}
            icon={Upload}
            color="gray"
            href="/admin/logs"
          />
          <StatCard
            title="Valid Files"
            value={stats.validFiles}
            icon={CheckCircle}
            color="green"
            href="/admin/logs?status=valid"
          />
          <StatCard
            title="Invalid Files"
            value={stats.invalidFiles}
            icon={XCircle}
            color="red"
            href="/admin/logs?status=invalid"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingReview}
            icon={Clock}
            color="yellow"
            href="/admin/logs?status=pending"
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

              {recentUploads.length > 0 ? (
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
                      {recentUploads.map(upload => (
                        <tr key={upload.id} className="text-sm">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium text-gray-900">{upload.file_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-gray-600">{upload.project_name}</td>
                          <td className="py-3 text-gray-600">
                            {upload.uploaded_by_email.toLowerCase().includes('alex')
                              ? upload.uploaded_by_email.replace(/alex/i, 'Alexa')
                              : upload.uploaded_by_email}
                          </td>
                          <td className="py-3">
                            {upload.validation_status === 'valid' ? (
                              <span className="badge-success">Valid</span>
                            ) : upload.validation_status === 'invalid' ? (
                              <span className="badge-error">Invalid</span>
                            ) : (
                              <span className="badge-warning">Pending</span>
                            )}
                          </td>
                          <td className="py-3 text-gray-500">
                            {formatDate(upload.uploaded_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No uploads yet</p>
                </div>
              )}
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

              {projects.length > 0 ? (
                <div className="space-y-3">
                  {projects.map(project => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-temetra-blue-300 hover:bg-temetra-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{project.name}</span>
                        <span className="text-sm text-gray-500">{project.upload_count} uploads</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Last activity: {formatDate(project.last_activity)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No projects yet</p>
                  <Link href="/admin/projects/new" className="text-sm text-temetra-blue-600 hover:underline">
                    Create your first project
                  </Link>
                </div>
              )}
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
                <Link href="/settings" className="w-full btn-secondary flex items-center gap-2 justify-start">
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Notifications */}
            {stats.pendingReview > 0 && (
              <div className="card border-yellow-200 bg-yellow-50">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-yellow-800">{stats.pendingReview} files need review</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Some uploaded files have validation errors and may need attention.
                    </p>
                    <Link href="/admin/logs?status=invalid" className="text-sm text-yellow-800 font-medium mt-2 inline-block hover:underline">
                      Review now →
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  href?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const content = (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="card hover:shadow-md hover:border-temetra-blue-300 transition-all cursor-pointer">
        {content}
      </Link>
    );
  }

  return <div className="card">{content}</div>;
}
