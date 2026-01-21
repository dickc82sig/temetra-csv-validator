/**
 * New Template Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to create a new validation template.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { getDefaultTemplate } from '@/lib/validation-rules';

interface TemplateRule {
  id: string;
  column_name: string;
  column_index: number;
  is_required: boolean;
  allow_blank: boolean;
  is_unique: boolean;
  min_length?: number;
  max_length?: number;
  data_type: string;
  notes?: string;
  example?: string;
}

const defaultTemplate = getDefaultTemplate();

export default function NewTemplatePage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState<TemplateRule[]>([]);
  const [useDefault, setUseDefault] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Add a new column
  const addColumn = () => {
    const newRule: TemplateRule = {
      id: `rule-${Date.now()}`,
      column_name: `Column_${rules.length + 1}`,
      column_index: rules.length,
      is_required: false,
      allow_blank: true,
      is_unique: false,
      data_type: 'text',
    };
    setRules(prev => [...prev, newRule]);
  };

  // Update a column
  const updateColumn = (index: number, updates: Partial<TemplateRule>) => {
    setRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, ...updates } : rule
    ));
  };

  // Remove a column
  const removeColumn = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Template name is required');
      return;
    }

    setIsLoading(true);

    try {
      const templateRules = useDefault ? defaultTemplate.rules : rules;

      const { data, error: insertError } = await supabase
        .from('validation_templates')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          rules: templateRules,
          is_default: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Failed to create template: ${insertError.message}`);
        return;
      }

      // Success - redirect to templates list
      router.push('/admin/templates');
    } catch (err) {
      console.error('Error creating template:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>

        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Template</h1>
        <p className="text-gray-600 mb-8">
          Define a new set of validation rules for CSV files.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Template Details</h2>
            <div className="space-y-4">
              {/* Template Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field mt-1"
                  placeholder="e.g., Water Meter Import"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field mt-1"
                  placeholder="Brief description of this template..."
                />
              </div>
            </div>
          </div>

          {/* Column Source */}
          <div className="card mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Validation Rules</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="useDefault"
                  checked={useDefault}
                  onChange={() => setUseDefault(true)}
                  className="h-4 w-4 text-temetra-blue-600 focus:ring-temetra-blue-500"
                />
                <label htmlFor="useDefault" className="text-sm text-gray-700">
                  <span className="font-medium">Use NewNetworkUpload columns</span>
                  <span className="block text-gray-500">Start with the standard 28 columns from the Temetra specification</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="useCustom"
                  checked={!useDefault}
                  onChange={() => setUseDefault(false)}
                  className="h-4 w-4 text-temetra-blue-600 focus:ring-temetra-blue-500"
                />
                <label htmlFor="useCustom" className="text-sm text-gray-700">
                  <span className="font-medium">Define custom columns</span>
                  <span className="block text-gray-500">Create a template from scratch with your own column definitions</span>
                </label>
              </div>
            </div>

            {/* Custom columns editor */}
            {!useDefault && (
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Custom Columns</h3>
                  <button
                    type="button"
                    onClick={addColumn}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Column
                  </button>
                </div>

                {rules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No columns defined yet. Click &quot;Add Column&quot; to create one.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Column Name</th>
                          <th className="border px-3 py-2 text-center font-medium text-gray-700">Required</th>
                          <th className="border px-3 py-2 text-center font-medium text-gray-700">Unique</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Type</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Max Length</th>
                          <th className="border px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rules.map((rule, index) => (
                          <tr key={rule.id} className="hover:bg-gray-50">
                            <td className="border px-3 py-2">
                              <input
                                type="text"
                                value={rule.column_name}
                                onChange={e => updateColumn(index, { column_name: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={rule.is_required}
                                onChange={e => updateColumn(index, { is_required: e.target.checked })}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={rule.is_unique}
                                onChange={e => updateColumn(index, { is_unique: e.target.checked })}
                                className="w-4 h-4"
                              />
                            </td>
                            <td className="border px-3 py-2">
                              <select
                                value={rule.data_type}
                                onChange={e => updateColumn(index, { data_type: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-sm"
                              >
                                <option value="text">Text</option>
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="date">Date</option>
                              </select>
                            </td>
                            <td className="border px-3 py-2">
                              <input
                                type="number"
                                value={rule.max_length || ''}
                                onChange={e => updateColumn(index, { max_length: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                placeholder="None"
                              />
                            </td>
                            <td className="border px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeColumn(index)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {useDefault && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This template will include all {defaultTemplate.rules.length} columns from the standard NewNetworkUpload format.
                  You can customize the rules after creating the template.
                </p>
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex gap-3 justify-end">
            <Link href="/admin/templates" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Template
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
