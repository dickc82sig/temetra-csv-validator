/**
 * Developer Interface Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is where developers upload their CSV files for validation.
 * It includes file upload, contact info, and shows validation results.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
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
} from 'lucide-react';
import Header from '@/components/ui/Header';
import FileUpload from '@/components/ui/FileUpload';
import ValidationResults from '@/components/ui/ValidationResults';
import { validateCSV, ValidationResult, getCSVPreview } from '@/lib/csv-validator';
import { getDefaultTemplate } from '@/lib/validation-rules';
import { isValidEmail, isAlex, getGreeting, getDisplayName } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function DeveloperPage() {
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
  const [showFormatSpec, setShowFormatSpec] = useState(false);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);

  // Fetch the default template ID from the database
  useEffect(() => {
    const fetchDefaultTemplate = async () => {
      const { data } = await supabase
        .from('validation_templates')
        .select('id')
        .eq('is_default', true)
        .single();
      if (data) {
        setDefaultTemplateId(data.id);
      }
    };
    fetchDefaultTemplate();
  }, []);

  // Get format columns from template for quick links
  const template = getDefaultTemplate();
  const formatColumns = template.rules.map(rule => ({
    name: rule.column_name,
    required: rule.is_required,
    type: rule.data_type,
    maxLength: rule.max_length,
    description: rule.notes,
  }));

  /**
   * Download a CSV template with headers
   */
  const downloadTemplate = () => {
    const headers = formatColumns.map(col => col.name).join(',');
    const blob = new Blob([headers + '\n'], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NewNetworkUpload_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Human verification (simple CAPTCHA alternative)
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion] = useState(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b, answer: a + b };
  });

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setValidationResults(null);
    setErrors({});

    // Read the file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(selectedFile);
  }, []);

  /**
   * Add an additional email to notify
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
   * Validate the form before submission
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
   * Run validation on the uploaded file
   */
  const handleValidate = async () => {
    if (!fileContent) return;

    setIsValidating(true);
    setErrors({});

    try {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the default template and run validation
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

    // Run validation if not already done
    if (!validationResults) {
      await handleValidate();
    }

    setIsSubmitting(true);

    try {
      // TODO: Actually submit to the server
      await new Promise(resolve => setTimeout(resolve, 1500));

      setSubmitted(true);
    } catch {
      setErrors(prev => ({ ...prev, submit: 'Failed to submit. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Check if the submit button should be enabled
   */
  const canSubmit = file && name.trim() && email.trim() && !isValidating && !isSubmitting;

  // Show success message after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName={name} userRole="developer" />

        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="card text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              {isAlex(name) ? 'Thanks, Alexa!' : 'Submission Received!'}
            </h2>
            <p className="mt-2 text-gray-600">
              Your CSV file has been submitted for review. You will receive an email at{' '}
              <span className="font-medium">{email}</span> with the validation results.
            </p>

            {validationResults && !validationResults.isValid && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-yellow-800">
                  Note: Your file had {validationResults.totalErrors} error(s). Please review
                  the validation report sent to your email and fix the issues before the data
                  can be imported.
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFile(null);
                  setFileContent('');
                  setValidationResults(null);
                }}
                className="btn-primary"
              >
                Upload Another File
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName={name || 'Developer'} userRole="developer" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload CSV for Validation</h1>
          <p className="mt-2 text-gray-600">
            Upload your CSV file to check it against the NewNetworkUpload specification.
            Fix any errors before submitting to Temetra.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Section */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Your File</h2>
              <FileUpload
                onFileSelect={handleFileSelect}
                label="CSV File"
                helpText="Drag and drop your NewNetworkUpload CSV file here"
              />
              {errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}

              {/* Validate button */}
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

            {/* Contact Information Section */}
            <form onSubmit={handleSubmit} className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Your Information</h2>

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
                  {/* Easter egg hint for Alex */}
                  {isAlex(name) && (
                    <p className="mt-1 text-sm text-temetra-blue-600">
                      {getGreeting(name)}
                    </p>
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

                  {/* List of added emails */}
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

                  {/* Add new email input */}
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
                    <button
                      type="button"
                      onClick={addEmail}
                      className="btn-secondary"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors.newEmail && <p className="mt-1 text-sm text-red-600">{errors.newEmail}</p>}
                </div>

                {/* Human verification */}
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

              {/* Submit button */}
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
                {!canSubmit && (
                  <p className="mt-2 text-xs text-center text-gray-500">
                    Please fill in all required fields and upload a file to submit
                  </p>
                )}
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowFormatSpec(true)}
                  className="w-full btn-secondary flex items-center gap-2 text-sm"
                >
                  <Eye className="h-4 w-4" />
                  See Format Spec
                </button>
                <button
                  onClick={downloadTemplate}
                  className="w-full btn-secondary flex items-center gap-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                {defaultTemplateId ? (
                  <Link
                    href={`/admin/templates/${defaultTemplateId}/documents`}
                    className="w-full btn-secondary flex items-center gap-2 text-sm"
                  >
                    <FileText className="h-4 w-4" />
                    View Documentation
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full btn-secondary flex items-center gap-2 text-sm opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    View Documentation
                  </button>
                )}
              </div>
            </div>

            {/* Help Section */}
            <div className="card bg-temetra-blue-50 border-temetra-blue-200">
              <h3 className="font-semibold text-temetra-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-temetra-blue-700">
                Check the documentation for column specifications and examples.
                Contact your administrator if you have questions about the required format.
              </p>
            </div>

            {/* Validation Rules Summary */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Validation Rules</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500"></span>
                  <span className="text-gray-600">Required fields</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-purple-500"></span>
                  <span className="text-gray-600">Must be unique</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-yellow-500"></span>
                  <span className="text-gray-600">Character limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-green-500"></span>
                  <span className="text-gray-600">Optional fields</span>
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

      {/* Format Specification Modal */}
      {showFormatSpec && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">NewNetworkUpload Format Specification</h3>
                <button
                  onClick={() => setShowFormatSpec(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                This table shows all columns required for the NewNetworkUpload CSV format.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left font-medium">Column Name</th>
                      <th className="border px-3 py-2 text-center font-medium">Required</th>
                      <th className="border px-3 py-2 text-left font-medium">Type</th>
                      <th className="border px-3 py-2 text-left font-medium">Max Length</th>
                      <th className="border px-3 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formatColumns.map((col, index) => (
                      <tr key={index} className={col.required ? 'bg-red-50' : ''}>
                        <td className="border px-3 py-2 font-mono text-xs">{col.name}</td>
                        <td className="border px-3 py-2 text-center">
                          {col.required ? (
                            <span className="text-red-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="border px-3 py-2 capitalize">{col.type}</td>
                        <td className="border px-3 py-2">{col.maxLength || '—'}</td>
                        <td className="border px-3 py-2 text-xs text-gray-600">{col.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={downloadTemplate}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                <button
                  onClick={() => setShowFormatSpec(false)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
