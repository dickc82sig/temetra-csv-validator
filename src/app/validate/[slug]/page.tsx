/**
 * Public Validation Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the public-facing page that developers use to upload files.
 * Each project has a unique slug that determines which validation rules to use.
 * Example URL: /validate/acme-water
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Upload,
  FileText,
  Download,
  Send,
  User,
  Mail,
  Plus,
  X,
  CheckCircle,
  Loader2,
  Eye,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import FileUpload from '@/components/ui/FileUpload';
import ValidationResults from '@/components/ui/ValidationResults';
import { validateCSV, ValidationResult } from '@/lib/csv-validator';
import { getDefaultTemplate } from '@/lib/validation-rules';
import { isValidEmail, isAlex, getGreeting } from '@/lib/utils';

// Mock project data - in production this would come from the database
const mockProjects: Record<string, { name: string; description: string }> = {
  'acme-water': {
    name: 'Acme Water Company',
    description: 'Upload your NewNetworkUpload CSV file for validation',
  },
  'city-utilities': {
    name: 'City Utilities Department',
    description: 'Upload your NewNetworkUpload CSV file for validation',
  },
  'regional-gas': {
    name: 'Regional Gas Co',
    description: 'Upload your NewNetworkUpload CSV file for validation',
  },
};

export default function PublicValidationPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Check if project exists
  const project = mockProjects[slug];

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');

  // UI state
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Human verification
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ a: 0, b: 0, answer: 0 });

  // Generate captcha on mount
  useEffect(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({ a, b, answer: a + b });
  }, []);

  // 404 if project doesn't exist
  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Project Not Found</h1>
          <p className="mt-2 text-gray-600">
            The validation link you followed doesn&apos;t exist or has been deactivated.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your administrator for the correct link.
          </p>
          <Link href="/" className="mt-6 inline-flex items-center gap-2 btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setValidationResults(null);
    setErrors({});

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(selectedFile);
  }, []);

  /**
   * Add an additional email
   */
  const addEmail = () => {
    if (!newEmail.trim()) return;

    if (!isValidEmail(newEmail)) {
      setErrors(prev => ({ ...prev, newEmail: 'Please enter a valid email address' }));
      return;
    }

    if (additionalEmails.includes(newEmail)) {
      setErrors(prev => ({ ...prev, newEmail: 'This email is already added' }));
      return;
    }

    setAdditionalEmails(prev => [...prev, newEmail.trim()]);
    setNewEmail('');
    setErrors(prev => ({ ...prev, newEmail: '' }));
  };

  /**
   * Remove an additional email
   */
  const removeEmail = (emailToRemove: string) => {
    setAdditionalEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!file) {
      newErrors.file = 'Please select a CSV file to upload';
    }

    if (!name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!email.trim()) {
      newErrors.email = 'Please enter your email address';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (captchaAnswer !== String(captchaQuestion.answer)) {
      newErrors.captcha = 'Incorrect answer. Please try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Run validation
   */
  const handleValidate = async () => {
    if (!fileContent) return;

    setIsValidating(true);
    setErrors({});

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const template = getDefaultTemplate();
      const results = validateCSV(fileContent, template);

      setValidationResults(results);
    } catch {
      setErrors(prev => ({ ...prev, validation: 'Failed to validate file. Please try again.' }));
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Submit the form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!validationResults) {
      await handleValidate();
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
    } catch {
      setErrors(prev => ({ ...prev, submit: 'Failed to submit. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = file && name.trim() && email.trim() && !isValidating && !isSubmitting;

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="card text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isAlex(name) ? 'Thanks, Alexa!' : 'Submission Received!'}
            </h2>
            <p className="mt-2 text-gray-600">
              Your CSV file has been submitted. You will receive an email at{' '}
              <span className="font-medium">{email}</span> with the validation results.
            </p>

            {validationResults && !validationResults.isValid && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800">
                  Note: Your file had {validationResults.totalErrors} error(s). Please review
                  the validation report sent to your email.
                </p>
              </div>
            )}

            <button
              onClick={() => {
                setSubmitted(false);
                setFile(null);
                setFileContent('');
                setValidationResults(null);
                setName('');
                setEmail('');
                setAdditionalEmails([]);
              }}
              className="mt-8 btn-primary"
            >
              Upload Another File
            </button>
          </div>
        </main>

        <footer className="border-t py-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">CSV Validation Portal</p>
          </div>
          <Link href="/" className="text-sm text-temetra-blue-600 hover:text-temetra-blue-700">
            Admin Login
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Upload CSV for Validation</h2>
          <p className="mt-2 text-gray-600">{project.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select Your File</h3>
              <FileUpload
                onFileSelect={handleFileSelect}
                label="CSV File"
                helpText="Drag and drop your CSV file here"
              />
              {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}

              {file && !validationResults && (
                <button
                  onClick={handleValidate}
                  disabled={isValidating}
                  className="mt-4 btn-primary flex items-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview & Validate
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Validation Results */}
            {validationResults && (
              <ValidationResults results={validationResults} />
            )}

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Your Information</h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input-field pl-10"
                      placeholder="John Smith"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  {isAlex(name) && (
                    <p className="mt-1 text-sm text-temetra-blue-600">{getGreeting(name)}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="john@company.com"
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Additional Emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Email Recipients (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Add other email addresses to receive the validation results
                  </p>

                  {additionalEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {additionalEmails.map(e => (
                        <span
                          key={e}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {e}
                          <button
                            type="button"
                            onClick={() => removeEmail(e)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setErrors(prev => ({ ...prev, newEmail: '' }));
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                      className="input-field flex-1"
                      placeholder="colleague@company.com"
                    />
                    <button type="button" onClick={addEmail} className="btn-secondary">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.newEmail && <p className="mt-1 text-sm text-red-600">{errors.newEmail}</p>}
                </div>

                {/* Captcha */}
                <div className="pt-4 border-t">
                  <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
                    Verification: What is {captchaQuestion.a} + {captchaQuestion.b}? <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="captcha"
                    type="text"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="input-field mt-1 w-24"
                    placeholder="?"
                  />
                  {errors.captcha && <p className="mt-1 text-sm text-red-600">{errors.captcha}</p>}
                </div>
              </div>

              {/* Submit */}
              <div className="mt-6 pt-4 border-t">
                {errors.submit && (
                  <p className="mb-4 text-sm text-red-600">{errors.submit}</p>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit for Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <button className="w-full btn-secondary flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  See Format Spec
                </button>
                <button className="w-full btn-secondary flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                <button className="w-full btn-secondary flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  View Documentation
                </button>
              </div>
            </div>

            <div className="card bg-temetra-blue-50 border-temetra-blue-200">
              <h3 className="font-semibold text-temetra-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-temetra-blue-700">
                Check the documentation for column specifications.
                Contact your administrator for questions.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
