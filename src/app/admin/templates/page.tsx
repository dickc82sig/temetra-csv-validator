/**
 * Admin Validation Templates Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to view and edit validation templates.
 * Templates define the rules for validating CSV files.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  FileText,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { getDefaultTemplate } from '@/lib/validation-rules';
import { formatDate } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string | null;
  rules: TemplateRule[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
  used_by_projects?: number;
}

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
  color_code?: string;
  custom_rule?: string;
  custom_rule_regex?: string;
}

// Get the default template
const defaultTemplate = getDefaultTemplate();

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editedRules, setEditedRules] = useState<Record<string, TemplateRule>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('validation_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get project counts for each template
        const templatesWithCounts = await Promise.all(
          data.map(async (template) => {
            const { count } = await supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('validation_template_id', template.id);

            return {
              ...template,
              rules: template.rules || defaultTemplate.rules,
              used_by_projects: count || 0,
            };
          })
        );
        setTemplates(templatesWithCounts);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update a rule locally
  const updateRule = (ruleId: string, updates: Partial<TemplateRule>) => {
    setEditedRules(prev => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], ...updates },
    }));
  };

  // Save edited rules for a template
  const saveTemplateRules = async (templateId: string) => {
    setIsSaving(true);
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;

      // Merge edited rules with existing rules
      const updatedRules = template.rules.map(rule => ({
        ...rule,
        ...(editedRules[rule.id] || {}),
      }));

      const { error } = await supabase
        .from('validation_templates')
        .update({
          rules: updatedRules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId);

      if (error) throw error;

      // Update local state
      setTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, rules: updatedRules, updated_at: new Date().toISOString() } : t
      ));
      setEditedRules({});
      setEditingRule(null);
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setMessage({ type: 'error', text: 'Failed to save template. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate a template
  const duplicateTemplate = async (template: Template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        description: template.description,
        rules: template.rules,
        is_default: false,
      };

      const { data, error } = await supabase
        .from('validation_templates')
        .insert(newTemplate)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTemplates(prev => [{ ...data, used_by_projects: 0 }, ...prev]);
        setMessage({ type: 'success', text: 'Template duplicated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error duplicating template:', err);
      setMessage({ type: 'error', text: 'Failed to duplicate template. Please try again.' });
    }
  };

  // Delete a template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('validation_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      setShowDeleteConfirm(null);
      setMessage({ type: 'success', text: 'Template deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting template:', err);
      setMessage({ type: 'error', text: 'Failed to delete template. Please try again.' });
    }
  };

  // Get color indicator based on rule
  const getColorIndicator = (rule: TemplateRule) => {
    if (rule.is_unique) return 'bg-purple-500';
    if (rule.is_required && !rule.allow_blank) return 'bg-red-500';
    if (rule.max_length) return 'bg-yellow-500';
    if (!rule.is_required) return 'bg-green-500';
    return 'bg-gray-400';
  };

  // Get row background color based on rule
  const getRowBgColor = (rule: TemplateRule) => {
    if (rule.is_required && !rule.allow_blank) return 'bg-red-50';
    if (rule.is_unique) return 'bg-purple-50';
    if (!rule.is_required) return 'bg-green-50';
    return 'bg-white';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation Templates</h1>
            <p className="mt-1 text-gray-600">
              Manage validation rules for different CSV formats
            </p>
          </div>
          <Link href="/admin/templates/new" className="mt-4 sm:mt-0 btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Link>
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
              <span className="w-4 h-4 rounded bg-purple-500"></span>
              <span>Must be unique</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-yellow-500"></span>
              <span>Has character limit</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              <span>Optional field</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-gray-400"></span>
              <span>No special rules</span>
            </div>
          </div>
        </div>

        {/* Templates list */}
        <div className="space-y-4">
          {templates.map(template => (
            <div key={template.id} className="card">
              {/* Template header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-temetra-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.is_default && (
                        <span className="badge-info">Default</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{template.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{template.rules?.length || 0} columns</p>
                    <p className="text-xs text-gray-500">Used by {template.used_by_projects || 0} projects</p>
                  </div>
                  {selectedTemplate === template.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded template view */}
              {selectedTemplate === template.id && (
                <div className="mt-6 pt-6 border-t">
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => router.push(`/admin/templates/${template.id}/edit`)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Rules
                    </button>
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    {!template.is_default && (
                      <button
                        onClick={() => setShowDeleteConfirm(template.id)}
                        className="btn-secondary text-sm flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    )}
                    {Object.keys(editedRules).length > 0 && (
                      <button
                        onClick={() => saveTemplateRules(template.id)}
                        disabled={isSaving}
                        className="btn-primary text-sm flex items-center gap-1 ml-auto"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Spreadsheet-like rules view */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">#</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Column Name</th>
                          <th className="border px-3 py-2 text-center font-medium text-gray-700">Required</th>
                          <th className="border px-3 py-2 text-center font-medium text-gray-700">Unique</th>
                          <th className="border px-3 py-2 text-center font-medium text-gray-700">Allow Blank</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Max Length</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Type</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Custom Rule</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700">Example</th>
                          <th className="border px-3 py-2 text-left font-medium text-gray-700 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(template.rules || []).slice(0, 15).map((rule, index) => {
                          const editedRule = editedRules[rule.id] || rule;
                          const isEditing = editingRule === rule.id;

                          if (isEditing) {
                            return (
                              <tr key={rule.id} className="bg-yellow-50">
                                <td className="border px-3 py-2">{index + 1}</td>
                                <td className="border px-3 py-2">
                                  <input
                                    type="text"
                                    value={editedRule.column_name}
                                    onChange={e => updateRule(rule.id, { ...editedRule, column_name: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={editedRule.is_required}
                                    onChange={e => updateRule(rule.id, { ...editedRule, is_required: e.target.checked })}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={editedRule.is_unique}
                                    onChange={e => updateRule(rule.id, { ...editedRule, is_unique: e.target.checked })}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="border px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={editedRule.allow_blank}
                                    onChange={e => updateRule(rule.id, { ...editedRule, allow_blank: e.target.checked })}
                                    className="w-4 h-4"
                                  />
                                </td>
                                <td className="border px-3 py-2">
                                  <input
                                    type="number"
                                    value={editedRule.max_length || ''}
                                    onChange={e => updateRule(rule.id, { ...editedRule, max_length: e.target.value ? parseInt(e.target.value) : undefined })}
                                    className="w-20 px-2 py-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="border px-3 py-2">
                                  <select
                                    value={editedRule.data_type}
                                    onChange={e => updateRule(rule.id, { ...editedRule, data_type: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  >
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="boolean">Boolean</option>
                                    <option value="date">Date</option>
                                  </select>
                                </td>
                                <td className="border px-3 py-2">
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editedRule.custom_rule || ''}
                                      onChange={e => updateRule(rule.id, { ...editedRule, custom_rule: e.target.value })}
                                      className="w-full px-2 py-1 border rounded text-sm"
                                      placeholder='Description (e.g., must end with ")'
                                    />
                                    <input
                                      type="text"
                                      value={editedRule.custom_rule_regex || ''}
                                      onChange={e => updateRule(rule.id, { ...editedRule, custom_rule_regex: e.target.value })}
                                      className="w-full px-2 py-1 border rounded text-sm font-mono"
                                      placeholder='Regex (e.g., \d"$)'
                                    />
                                  </div>
                                </td>
                                <td className="border px-3 py-2">
                                  <input
                                    type="text"
                                    value={editedRule.example || ''}
                                    onChange={e => updateRule(rule.id, { ...editedRule, example: e.target.value })}
                                    className="w-full px-2 py-1 border rounded text-sm"
                                  />
                                </td>
                                <td className="border px-3 py-2">
                                  <div className="flex gap-1">
                                    <button onClick={() => setEditingRule(null)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                      <Save className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => {
                                      setEditingRule(null);
                                      const newEdited = { ...editedRules };
                                      delete newEdited[rule.id];
                                      setEditedRules(newEdited);
                                    }} className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={rule.id}
                              className={`${getRowBgColor(rule)} hover:bg-opacity-75 cursor-pointer`}
                              onDoubleClick={() => {
                                setEditedRules(prev => ({ ...prev, [rule.id]: rule }));
                                setEditingRule(rule.id);
                              }}
                            >
                              <td className="border px-3 py-2 text-gray-500">{index + 1}</td>
                              <td className="border px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${getColorIndicator(rule)}`}></span>
                                  <span className="font-medium">{rule.column_name}</span>
                                </div>
                              </td>
                              <td className="border px-3 py-2 text-center">{rule.is_required ? '✓' : '—'}</td>
                              <td className="border px-3 py-2 text-center">{rule.is_unique ? '✓' : '—'}</td>
                              <td className="border px-3 py-2 text-center">{rule.allow_blank ? '✓' : '—'}</td>
                              <td className="border px-3 py-2 text-gray-600">{rule.max_length || '—'}</td>
                              <td className="border px-3 py-2 text-gray-600 capitalize">{rule.data_type}</td>
                              <td className="border px-3 py-2 text-gray-500 text-xs max-w-40">
                                {rule.custom_rule || rule.custom_rule_regex ? (
                                  <div className="space-y-0.5">
                                    {rule.custom_rule && <div className="truncate" title={rule.custom_rule}>{rule.custom_rule}</div>}
                                    {rule.custom_rule_regex && <div className="font-mono text-gray-400 truncate" title={rule.custom_rule_regex}>{rule.custom_rule_regex}</div>}
                                  </div>
                                ) : '—'}
                              </td>
                              <td className="border px-3 py-2 text-gray-500 font-mono text-xs">
                                {rule.example ? rule.example.slice(0, 25) : '—'}
                              </td>
                              <td className="border px-3 py-2">
                                <button
                                  onClick={() => {
                                    setEditedRules(prev => ({ ...prev, [rule.id]: rule }));
                                    setEditingRule(rule.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                                >
                                  <Settings className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {(template.rules?.length || 0) > 15 && (
                    <p className="mt-4 text-sm text-gray-500 text-center">
                      Showing 15 of {template.rules?.length || 0} columns.{' '}
                      <Link href={`/admin/templates/${template.id}/edit`} className="text-temetra-blue-600 hover:underline">
                        View all
                      </Link>
                    </p>
                  )}

                  {/* Instructions */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Editing Tips:</p>
                        <ul className="mt-1 list-disc list-inside space-y-1">
                          <li>Double-click on any row to edit that field&apos;s rules</li>
                          <li>Click &quot;Save Changes&quot; to persist your edits</li>
                          <li>Color codes update based on the rules you set</li>
                          <li><strong>Custom Rule:</strong> Enter a description (e.g., &quot;must end with &apos; after a number&quot;) and a regex pattern for validation</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Last updated info */}
                  <p className="mt-4 text-xs text-gray-500">
                    Last updated: {formatDate(template.updated_at)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="card text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No templates found</p>
            <Link href="/admin/templates/new" className="mt-4 btn-primary inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Template
            </Link>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Template?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this template? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTemplate(showDeleteConfirm)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
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
