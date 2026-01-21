/**
 * Admin Projects List Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Shows all projects with options to create, edit, and manage them.
 * Each project represents a customer's CSV validation setup.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Link as LinkIcon,
  Copy,
  Eye,
  Bell,
  BellOff,
  Settings,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { formatDate } from '@/lib/utils';

// Mock projects data
const mockProjects = [
  {
    id: '1',
    name: 'Acme Water Company',
    slug: 'acme-water',
    description: 'Municipal water utility serving the greater Acme area',
    publicLink: '/validate/acme-water',
    alertOnUpload: true,
    totalUploads: 45,
    validUploads: 38,
    lastUpload: '2024-01-15T10:30:00',
    createdAt: '2023-06-15T00:00:00',
  },
  {
    id: '2',
    name: 'City Utilities Department',
    slug: 'city-utilities',
    description: 'City water and gas services',
    publicLink: '/validate/city-utilities',
    alertOnUpload: true,
    totalUploads: 32,
    validUploads: 30,
    lastUpload: '2024-01-15T09:15:00',
    createdAt: '2023-08-20T00:00:00',
  },
  {
    id: '3',
    name: 'Regional Gas Co',
    slug: 'regional-gas',
    description: 'Natural gas distribution company',
    publicLink: '/validate/regional-gas',
    alertOnUpload: false,
    totalUploads: 28,
    validUploads: 25,
    lastUpload: '2024-01-14T16:45:00',
    createdAt: '2023-09-10T00:00:00',
  },
  {
    id: '4',
    name: 'Metro Electric',
    slug: 'metro-electric',
    description: 'Electric utility for metropolitan area',
    publicLink: '/validate/metro-electric',
    alertOnUpload: true,
    totalUploads: 15,
    validUploads: 10,
    lastUpload: '2024-01-14T14:20:00',
    createdAt: '2023-11-01T00:00:00',
  },
];

export default function AdminProjectsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Filter projects by search term
  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Copy the project's public link to clipboard
   */
  const copyLink = async (projectId: string, link: string) => {
    const fullLink = `${window.location.origin}${link}`;
    await navigator.clipboard.writeText(fullLink);
    setCopiedLink(projectId);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="mt-1 text-gray-600">
              Manage customer projects and their validation settings
            </p>
          </div>
          <Link href="/admin/projects/new" className="mt-4 sm:mt-0 btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <div key={project.id} className="card hover:shadow-md transition-shadow">
              {/* Header with menu */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.description}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                    className="p-1 rounded hover:bg-gray-100"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {openMenu === project.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-4 w-4" />
                        Edit Project
                      </Link>
                      <Link
                        href={`/admin/projects/${project.id}/rules`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Validation Rules
                      </Link>
                      <button
                        onClick={() => copyLink(project.id, project.publicLink)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="h-4 w-4" />
                        {copiedLink === project.id ? 'Copied!' : 'Copy Public Link'}
                      </button>
                      <hr className="my-1" />
                      <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                        Delete Project
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{project.totalUploads}</p>
                  <p className="text-xs text-gray-500">Total Uploads</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round((project.validUploads / project.totalUploads) * 100)}%
                  </p>
                  <p className="text-xs text-gray-500">Success Rate</p>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 space-y-2">
                {/* Public link */}
                <div className="flex items-center gap-2 text-sm">
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                    {project.publicLink}
                  </code>
                  <button
                    onClick={() => copyLink(project.id, project.publicLink)}
                    className="text-temetra-blue-600 hover:text-temetra-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {/* Alert status */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    {project.alertOnUpload ? (
                      <>
                        <Bell className="h-4 w-4 text-green-500" />
                        <span>Alerts enabled</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-4 w-4 text-gray-400" />
                        <span>Alerts disabled</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Last upload */}
                <p className="text-xs text-gray-500">
                  Last upload: {formatDate(project.lastUpload)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <Link
                  href={`/admin/projects/${project.id}/logs`}
                  className="flex-1 btn-secondary text-center text-sm"
                >
                  View Logs
                </Link>
                <Link
                  href={`/admin/projects/${project.id}/upload`}
                  className="flex-1 btn-primary text-center text-sm"
                >
                  Upload Key
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No projects found matching &quot;{searchTerm}&quot;</p>
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-temetra-blue-600 hover:text-temetra-blue-700"
            >
              Clear search
            </button>
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
