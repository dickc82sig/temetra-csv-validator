/**
 * About Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page shows information about the application, version history,
 * and the tools/technologies used.
 */

import Link from 'next/link';
import { ArrowLeft, Code, Database, Server, Shield, Zap, Mail, Globe } from 'lucide-react';
import Header from '@/components/ui/Header';

// Version history
const versions = [
  {
    version: '1.0.0',
    date: '2024-01-15',
    changes: [
      'Initial release',
      'CSV file validation for NewNetworkUpload format',
      'User authentication and role-based access',
      'Project management for multiple customers',
      'Email notifications for validation results',
      'Visual validation rules editor',
    ],
  },
];

// Technologies used
const technologies = [
  {
    category: 'Frontend',
    icon: Code,
    items: [
      { name: 'Next.js 14', description: 'React framework for web applications' },
      { name: 'React 18', description: 'JavaScript library for user interfaces' },
      { name: 'TypeScript', description: 'Typed JavaScript for better code quality' },
      { name: 'Tailwind CSS', description: 'Utility-first CSS framework' },
      { name: 'Lucide Icons', description: 'Beautiful & consistent icon set' },
    ],
  },
  {
    category: 'Backend & Database',
    icon: Database,
    items: [
      { name: 'Supabase', description: 'Open source Firebase alternative' },
      { name: 'PostgreSQL', description: 'Powerful relational database' },
      { name: 'Row Level Security', description: 'Database-level access control' },
    ],
  },
  {
    category: 'Utilities',
    icon: Zap,
    items: [
      { name: 'Papa Parse', description: 'CSV parsing library' },
      { name: 'Zod', description: 'TypeScript-first schema validation' },
      { name: 'bcrypt', description: 'Password hashing' },
      { name: 'Nodemailer', description: 'Email sending' },
    ],
  },
  {
    category: 'Hosting & Infrastructure',
    icon: Server,
    items: [
      { name: 'Vercel', description: 'Serverless deployment platform' },
      { name: 'Supabase Cloud', description: 'Managed database hosting' },
    ],
  },
  {
    category: 'Security',
    icon: Shield,
    items: [
      { name: 'HTTPS Encryption', description: 'Secure data transmission' },
      { name: 'Password Complexity', description: 'Microsoft-style requirements' },
      { name: 'Data Encryption', description: 'At-rest database encryption' },
      { name: 'Role-Based Access', description: 'Granular permission control' },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {/* Hero section */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-temetra-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Temetra CSV Validation Tool</h1>
          <p className="mt-2 text-lg text-gray-600">
            Ensuring data quality for utility metering systems
          </p>
          <p className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-temetra-blue-100 rounded-full text-temetra-blue-700 text-sm font-medium">
            Version {versions[0].version}
          </p>
        </div>

        {/* About section */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About This Application</h2>
          <div className="prose prose-gray max-w-none">
            <p>
              The Temetra CSV Validation Tool is a web application designed to help developers
              and utility companies validate their CSV data files before importing them into
              the Temetra metering system.
            </p>
            <p>
              By catching data errors early, this tool helps prevent costly issues during
              the import process and ensures data integrity in your Temetra installation.
            </p>

            <h3 className="text-lg font-semibold mt-6">Key Features</h3>
            <ul className="space-y-2">
              <li>
                <strong>Instant Validation</strong> - Upload a CSV and get immediate feedback
                on any data quality issues.
              </li>
              <li>
                <strong>Customizable Rules</strong> - Administrators can configure validation
                rules specific to their data requirements.
              </li>
              <li>
                <strong>Multi-Project Support</strong> - Manage multiple customers with separate
                projects, each with their own rules and users.
              </li>
              <li>
                <strong>Email Notifications</strong> - Automatically send validation results
                to developers and stakeholders.
              </li>
              <li>
                <strong>Detailed Error Reports</strong> - Clear, actionable error messages
                with references to documentation.
              </li>
            </ul>
          </div>
        </div>

        {/* Version History */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Version History</h2>
          <div className="space-y-6">
            {versions.map((release) => (
              <div key={release.version} className="border-l-4 border-temetra-blue-500 pl-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900">v{release.version}</span>
                  <span className="text-sm text-gray-500">{release.date}</span>
                </div>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  {release.changes.map((change, index) => (
                    <li key={index}>• {change}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Technologies Used</h2>
          <div className="space-y-6">
            {technologies.map((tech) => {
              const Icon = tech.icon;
              return (
                <div key={tech.category}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-5 w-5 text-temetra-blue-600" />
                    <h3 className="font-semibold text-gray-900">{tech.category}</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-7">
                    {tech.items.map((item) => (
                      <div key={item.name} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></span>
                        <div>
                          <span className="font-medium text-gray-800">{item.name}</span>
                          <span className="text-sm text-gray-500"> - {item.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Credits */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Credits & Legal</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Developed By</h3>
              <p className="text-gray-600">
                <strong>Vanzora, LLC</strong>
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Copyright Notice</h3>
              <p className="text-gray-600">
                Copyright &copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                This software and its documentation are proprietary and confidential.
                Unauthorized copying, distribution, or use is strictly prohibited.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">Third-Party Licenses</h3>
              <p className="text-gray-600 text-sm">
                This application uses open-source software. Each package retains its
                original license. See the project&apos;s package.json for a full list of dependencies.
              </p>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card bg-temetra-blue-50 border-temetra-blue-200">
          <h2 className="text-xl font-bold text-temetra-blue-900 mb-4">Contact</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:support@vanzora.com"
              className="flex items-center gap-2 text-temetra-blue-700 hover:text-temetra-blue-800"
            >
              <Mail className="h-5 w-5" />
              support@vanzora.com
            </a>
            <a
              href="https://vanzora.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-temetra-blue-700 hover:text-temetra-blue-800"
            >
              <Globe className="h-5 w-5" />
              www.vanzora.com
            </a>
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
