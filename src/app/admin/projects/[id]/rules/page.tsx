/**
 * Project Validation Rules Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to configure validation rules for a project.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle,
  FileText,
  X,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { DEFAULT_VALIDATION_RULES, ProjectValidationRule } from '@/lib/validation-rules';

interface Project {
  id: string;
  name: string;
}

export default function ProjectRulesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<ProjectValidationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Load project and rules
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load project from Supabase
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', projectId)
          .single();

        if (projectData) {
          setProject(projectData);
        } else {
          setProject(null);
        }

        // Load saved rules or use defaults
        const { data: templateData } = await supabase
          .from('validation_templates')
          .select('rules')
          .eq('project_id', projectId)
          .single();

        if (templateData?.rules) {
          setRules(templateData.rules);
        } else {
          // Use default rules
          setRules(DEFAULT_VALIDATION_RULES);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setRules(DEFAULT_VALIDATION_RULES);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Update a rule
  const updateRule = (columnName: string, updates: Partial<ProjectValidationRule>) => {
    setRules(prev => prev.map(rule =>
      rule.columnName === columnName ? { ...rule, ...updates } : rule
    ));
  };

  // Add a new rule
  const addRule = () => {
    const newRule: ProjectValidationRule = {
      columnName: `Column_${rules.length + 1}`,
      displayName: `New Column ${rules.length + 1}`,
      required: false,
      dataType: 'string',
      description: 'New column',
    };
    setRules(prev => [...prev, newRule]);
    setEditingRule(newRule.columnName);
  };

  // Remove a rule
  const removeRule = (columnName: string) => {
    setRules(prev => prev.filter(rule => rule.columnName !== columnName));
  };

  // Save rules
  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // First check if a template exists for this project
      const { data: existing } = await supabase
        .from('validation_templates')
        .select('id')
        .eq('project_id', projectId)
        .single();

      if (existing) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('validation_templates')
          .update({
            rules: rules,
            updated_at: new Date().toISOString(),
          })
          .eq('project_id', projectId);

        if (updateError) throw updateError;
      } else {
        // Create new template
        const { error: insertError } = await supabase
          .from('validation_templates')
          .insert({
            project_id: projectId,
            name: `${project?.name} Template`,
            rules: rules,
          });

        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'Validation rules saved successfully!' });
      setEditingRule(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving rules:', err);
      setMessage({ type: 'error', text: 'Failed to save rules. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getColorIndicators = (rule: ProjectValidationRule): string[] => {
    const colors: string[] = [];
    if (rule.required) colors.push('bg-red-500');
    if (rule.maxLength) colors.push('bg-yellow-500');
    if (!rule.required) colors.push('bg-green-500');
    if (colors.length === 0) colors.push('bg-gray-400');
    return colors;
  };

  const getRowBgColor = (rule: ProjectValidationRule) => {
    if (rule.required) return 'bg-red-50';
    return 'bg-green-50';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-7xl mx-auto px-4 py-8">
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
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Project not found</p>
            <Link href="/admin/projects" className="mt-4 btn-primary inline-block">
              Back to Projects
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/admin/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-temetra-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Validation Rules</h1>
              <p className="text-gray-600">{project.name} &bull; Configure column validation settings</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={addRule}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Column
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Rules
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        {/* Color code legend */}
        <div className="card mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Color Code Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-500"></span>
              <span>Required field</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-500"></span>
              <span>Has character limit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              <span>Optional field</span>
            </div>
          </div>
        </div>

        {/* Rules table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              All Columns ({rules.length})
            </h3>
            <p className="text-sm text-gray-500">Double-click a row to edit, or use the settings icon</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left font-medium text-gray-700 w-10">#</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Column Name</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Display Name</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700 w-24">Data Type</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-20">Required</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Validation</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, index) => {
                  const isEditing = editingRule === rule.columnName;

                  if (isEditing) {
                    return (
                      <tr key={rule.columnName} className="bg-yellow-50">
                        <td className="border px-3 py-2">{index + 1}</td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            value={rule.columnName}
                            onChange={e => updateRule(rule.columnName, { columnName: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            value={rule.displayName}
                            onChange={e => updateRule(rule.columnName, { displayName: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <select
                            value={rule.dataType}
                            onChange={e => updateRule(rule.columnName, { dataType: e.target.value as ProjectValidationRule['dataType'] })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="boolean">Boolean</option>
                            <option value="email">Email</option>
                          </select>
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={rule.required}
                            onChange={e => updateRule(rule.columnName, { required: e.target.checked })}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={rule.minLength || ''}
                                onChange={e => updateRule(rule.columnName, { minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                placeholder="Min len"
                              />
                              <input
                                type="number"
                                value={rule.maxLength || ''}
                                onChange={e => updateRule(rule.columnName, { maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                                className="w-20 px-2 py-1 border rounded text-sm"
                                placeholder="Max len"
                              />
                            </div>
                            <input
                              type="text"
                              value={rule.pattern || ''}
                              onChange={e => updateRule(rule.columnName, { pattern: e.target.value || undefined })}
                              className="w-full px-2 py-1 border rounded text-sm font-mono"
                              placeholder="Regex pattern"
                            />
                          </div>
                        </td>
                        <td className="border px-3 py-2">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Done editing"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingRule(null)}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={rule.columnName}
                      className={`${getRowBgColor(rule)} hover:bg-opacity-75 cursor-pointer`}
                      onDoubleClick={() => setEditingRule(rule.columnName)}
                    >
                      <td className="border px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {getColorIndicators(rule).map((color, i) => (
                              <span key={i} className={`w-2 h-2 rounded-full ${color}`}></span>
                            ))}
                          </div>
                          <span className="font-mono font-medium">{rule.columnName}</span>
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-gray-600">{rule.displayName}</td>
                      <td className="border px-3 py-2 text-gray-600 capitalize">{rule.dataType}</td>
                      <td className="border px-3 py-2 text-center">{rule.required ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-gray-500 text-xs">
                        {rule.minLength && <span>Min: {rule.minLength} </span>}
                        {rule.maxLength && <span>Max: {rule.maxLength} </span>}
                        {rule.pattern && <span className="font-mono break-all">{rule.pattern}</span>}
                        {rule.allowedValues && <span>{rule.allowedValues.length} values</span>}
                        {!rule.minLength && !rule.maxLength && !rule.pattern && !rule.allowedValues && '—'}
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditingRule(rule.columnName)}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit rule"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeRule(rule.columnName)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rules.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No validation rules defined</p>
              <button onClick={addRule} className="mt-4 btn-primary">
                Add First Column
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Editing Tips:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Double-click on any row to edit that column&apos;s rules</li>
                <li>Use the settings icon to edit, or trash icon to delete a column</li>
                <li><strong>Column Name</strong> must match exactly the CSV header</li>
                <li><strong>Required</strong> columns will flag an error if empty</li>
                <li><strong>Data Type</strong> determines how the value is validated</li>
                <li>Changes are not saved until you click &quot;Save Rules&quot;</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-2 text-temetra-blue-600 hover:text-temetra-blue-700 font-medium"
          >
            <HelpCircle className="h-5 w-5" />
            Validation Rule Help & Documentation
          </button>
        </div>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-6 w-6 text-temetra-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Validation Rule Documentation</h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Column Validation Options</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Required</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, this column must exist in the CSV file and every row must have a value.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Data Type</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>String:</strong> Any text value<br />
                      <strong>Number:</strong> Numeric values only (integers or decimals)<br />
                      <strong>Boolean:</strong> True/false, yes/no, 1/0 values<br />
                      <strong>Date:</strong> Date values in standard formats<br />
                      <strong>Email:</strong> Valid email addresses
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Min/Max Length</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Minimum and maximum number of characters allowed. Leave empty for no limit.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Regex Pattern</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      A regular expression pattern that values must match. The entire value must match the pattern.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Regex Patterns</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-3 py-2 text-left">Pattern</th>
                        <th className="border px-3 py-2 text-left">Description</th>
                        <th className="border px-3 py-2 text-left">Example Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border px-3 py-2 font-mono text-xs">^\d+$</td>
                        <td className="border px-3 py-2">Numbers only</td>
                        <td className="border px-3 py-2">12345</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border px-3 py-2 font-mono text-xs">^[A-Z]{"{2,3}"}$</td>
                        <td className="border px-3 py-2">2-3 uppercase letters</td>
                        <td className="border px-3 py-2">USA, CA</td>
                      </tr>
                      <tr>
                        <td className="border px-3 py-2 font-mono text-xs">^\d{"{5}"}(-\d{"{4}"})?$</td>
                        <td className="border px-3 py-2">US ZIP code (5 or 9 digit)</td>
                        <td className="border px-3 py-2">12345, 12345-6789</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border px-3 py-2 font-mono text-xs">^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{"{2,}"}$</td>
                        <td className="border px-3 py-2">Email address</td>
                        <td className="border px-3 py-2">user@example.com</td>
                      </tr>
                      <tr>
                        <td className="border px-3 py-2 font-mono text-xs">^(Yes|No|N/A)$</td>
                        <td className="border px-3 py-2">Specific allowed values</td>
                        <td className="border px-3 py-2">Yes, No, N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="btn-primary w-full"
              >
                Close
              </button>
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
