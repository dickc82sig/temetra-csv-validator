/**
 * Project Upload Key Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page shows the upload key and API details for a project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  Link as LinkIcon,
  Code,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';

interface Project {
  id: string;
  name: string;
  slug: string;
  public_link: string;
  api_key?: string;
}

export default function ProjectUploadKeyPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Generate a demo API key
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'temetra_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('id, name, slug, public_link')
          .eq('id', projectId)
          .single();

        if (data) {
          setProject({
            ...data,
            api_key: generateApiKey(),
          });
        } else {
          setProject(null);
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const regenerateApiKey = async () => {
    setIsRegenerating(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProject(prev => prev ? { ...prev, api_key: generateApiKey() } : null);
    setIsRegenerating(false);
  };

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${project?.public_link || ''}`
    : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-4xl mx-auto px-4 py-8">
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
        <main className="max-w-4xl mx-auto px-4 py-8">
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

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Key &amp; API Access</h1>
          <p className="mt-1 text-gray-600">
            {project.name} &bull; Integration credentials and documentation
          </p>
        </div>

        {/* Public Link Section */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-temetra-blue-100 rounded-lg">
              <LinkIcon className="h-5 w-5 text-temetra-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Public Upload Link</h2>
              <p className="text-sm text-gray-500">Share this link with developers to upload CSV files</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="flex-1 text-sm text-gray-800 overflow-x-auto">{publicUrl}</code>
            <button
              onClick={() => copyToClipboard(publicUrl, 'publicLink')}
              className="flex items-center gap-1 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
            >
              {copiedField === 'publicLink' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* API Key Section */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Key className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">API Key</h2>
                <p className="text-sm text-gray-500">Use this key for programmatic uploads</p>
              </div>
            </div>
            <button
              onClick={regenerateApiKey}
              disabled={isRegenerating}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </button>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="flex-1 text-sm text-gray-800 font-mono">
              {showApiKey ? project?.api_key : '••••••••••••••••••••••••••••••••••••••'}
            </code>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="p-2 hover:bg-gray-200 rounded"
              title={showApiKey ? 'Hide' : 'Show'}
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(project?.api_key || '', 'apiKey')}
              className="flex items-center gap-1 px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
            >
              {copiedField === 'apiKey' ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-amber-600">
            Keep this key secret! Anyone with this key can upload files to this project.
          </p>
        </div>

        {/* Code Examples */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Code className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Integration Examples</h2>
              <p className="text-sm text-gray-500">Code snippets for common languages</p>
            </div>
          </div>

          {/* cURL Example */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">cURL</h3>
              <button
                onClick={() => copyToClipboard(`curl -X POST "${publicUrl}/api/upload" \\
  -H "Authorization: Bearer ${project?.api_key}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@your_file.csv"`, 'curl')}
                className="text-xs text-temetra-blue-600 hover:text-temetra-blue-700"
              >
                {copiedField === 'curl' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-green-400 text-sm rounded-lg overflow-x-auto">
{`curl -X POST "${publicUrl}/api/upload" \\
  -H "Authorization: Bearer ${showApiKey ? project?.api_key : '<YOUR_API_KEY>'}" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@your_file.csv"`}
            </pre>
          </div>

          {/* Python Example */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Python</h3>
              <button
                onClick={() => copyToClipboard(`import requests

url = "${publicUrl}/api/upload"
headers = {"Authorization": "Bearer ${project?.api_key}"}
files = {"file": open("your_file.csv", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())`, 'python')}
                className="text-xs text-temetra-blue-600 hover:text-temetra-blue-700"
              >
                {copiedField === 'python' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-green-400 text-sm rounded-lg overflow-x-auto">
{`import requests

url = "${publicUrl}/api/upload"
headers = {"Authorization": "Bearer ${showApiKey ? project?.api_key : '<YOUR_API_KEY>'}"}
files = {"file": open("your_file.csv", "rb")}

response = requests.post(url, headers=headers, files=files)
print(response.json())`}
            </pre>
          </div>

          {/* JavaScript Example */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">JavaScript (fetch)</h3>
              <button
                onClick={() => copyToClipboard(`const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('${publicUrl}/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${project?.api_key}'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));`, 'js')}
                className="text-xs text-temetra-blue-600 hover:text-temetra-blue-700"
              >
                {copiedField === 'js' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-green-400 text-sm rounded-lg overflow-x-auto">
{`const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('${publicUrl}/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${showApiKey ? project?.api_key : '<YOUR_API_KEY>'}'
  },
  body: formData
})
.then(res => res.json())
.then(data => console.log(data));`}
            </pre>
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
