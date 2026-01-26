/**
 * Template Edit Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Full editing view for all template columns/rules.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  HelpCircle,
} from 'lucide-react';
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
  color_code?: string;
  custom_rule?: string;
  custom_rule_regex?: string;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  rules: TemplateRule[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const defaultTemplate = getDefaultTemplate();

export default function TemplateEditPage() {
  const params = useParams();
  const templateId = params.id as string;
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editedRules, setEditedRules] = useState<Record<string, TemplateRule>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('validation_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      if (data) {
        setTemplate({
          ...data,
          rules: data.rules || defaultTemplate.rules,
        });
      }
    } catch (err) {
      console.error('Error loading template:', err);
      setMessage({ type: 'error', text: 'Failed to load template' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRule = (ruleId: string, field: string, value: string | number | boolean | undefined) => {
    setEditedRules(prev => {
      const currentRule = prev[ruleId] || template?.rules.find(r => r.id === ruleId);
      if (!currentRule) return prev;
      return {
        ...prev,
        [ruleId]: { ...currentRule, [field]: value },
      };
    });
  };

  // Save a single rule and close edit mode
  const saveRuleAndClose = async (ruleId: string) => {
    if (!template) return;

    const editedRule = editedRules[ruleId];
    if (!editedRule) {
      // No changes to save, just close
      setEditingRule(null);
      return;
    }

    setIsSaving(true);
    try {
      // Merge the edited rule into template rules
      const updatedRules = template.rules.map(rule => {
        if (rule.id === ruleId) {
          return { ...rule, ...editedRule };
        }
        return rule;
      });

      // Save to Supabase
      const { data, error } = await supabase
        .from('validation_templates')
        .update({
          rules: updatedRules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Database update failed');
      }

      // Update local state with data from database
      if (data) {
        setTemplate({
          ...data,
          rules: data.rules || updatedRules,
        });
      } else {
        setTemplate(prev => prev ? { ...prev, rules: updatedRules } : prev);
      }

      // Clear the edited rule and close edit mode
      const newEdited = { ...editedRules };
      delete newEdited[ruleId];
      setEditedRules(newEdited);
      setEditingRule(null);
      setMessage({ type: 'success', text: 'Rule saved!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error('Error saving rule:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save rule';
      setMessage({ type: 'error', text: `Save failed: ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  };

  const saveChanges = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      // Merge edited rules into template rules
      const updatedRules = template.rules.map(rule => {
        const edited = editedRules[rule.id];
        if (edited) {
          return { ...rule, ...edited };
        }
        return rule;
      });

      // Save to Supabase
      const { data, error } = await supabase
        .from('validation_templates')
        .update({
          rules: updatedRules,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Database update failed');
      }

      // Update local state with data from database to confirm save
      if (data) {
        setTemplate({
          ...data,
          rules: data.rules || updatedRules,
        });
      } else {
        // Fallback: update local state with our changes
        setTemplate(prev => prev ? { ...prev, rules: updatedRules } : prev);
      }

      setEditedRules({});
      setEditingRule(null);
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setMessage({ type: 'error', text: `Save failed: ${errorMessage}` });
    } finally {
      setIsSaving(false);
    }
  };

  const addNewRule = () => {
    if (!template) return;

    const newRule: TemplateRule = {
      id: `rule-${Date.now()}`,
      column_name: 'New Column',
      column_index: template.rules.length,
      is_required: false,
      allow_blank: true,
      is_unique: false,
      data_type: 'text',
    };

    setTemplate(prev => prev ? {
      ...prev,
      rules: [...prev.rules, newRule],
    } : prev);

    setEditedRules(prev => ({
      ...prev,
      [newRule.id]: newRule,
    }));
    setEditingRule(newRule.id);
  };

  const deleteRule = (ruleId: string) => {
    if (!template) return;

    setTemplate(prev => prev ? {
      ...prev,
      rules: prev.rules.filter(r => r.id !== ruleId),
    } : prev);

    const newEdited = { ...editedRules };
    delete newEdited[ruleId];
    setEditedRules(newEdited);
  };

  const getColorIndicator = (rule: TemplateRule) => {
    if (rule.is_unique) return 'bg-purple-500';
    if (rule.is_required && !rule.allow_blank) return 'bg-red-500';
    if (rule.max_length) return 'bg-yellow-500';
    if (!rule.is_required) return 'bg-green-500';
    return 'bg-gray-400';
  };

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

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Template not found</p>
            <Link href="/admin/templates" className="mt-4 btn-primary inline-block">
              Back to Templates
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const hasChanges = Object.keys(editedRules).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin/templates"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-temetra-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-gray-600">{template.description || 'No description'}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={addNewRule}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Column
            </button>
            {hasChanges && (
              <button
                onClick={saveChanges}
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
                    Save Changes
                  </>
                )}
              </button>
            )}
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
          </div>
        </div>

        {/* Rules table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              All Columns ({template.rules.length})
            </h3>
            <p className="text-sm text-gray-500">Double-click a row to edit, or use the settings icon</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left font-medium text-gray-700 w-10">#</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Column Name</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-20">Required</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-20">Unique</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-24">Allow Blank</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700 w-24">Max Length</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700 w-24">Type</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Custom Rule</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-700">Example</th>
                  <th className="border px-3 py-2 text-center font-medium text-gray-700 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {template.rules.map((rule, index) => {
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
                            onChange={e => updateRule(rule.id, 'column_name', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={editedRule.is_required}
                            onChange={e => updateRule(rule.id, 'is_required', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={editedRule.is_unique}
                            onChange={e => updateRule(rule.id, 'is_unique', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={editedRule.allow_blank}
                            onChange={e => updateRule(rule.id, 'allow_blank', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="number"
                            value={editedRule.max_length || ''}
                            onChange={e => updateRule(rule.id, 'max_length', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <select
                            value={editedRule.data_type}
                            onChange={e => updateRule(rule.id, 'data_type', e.target.value)}
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
                              onChange={e => updateRule(rule.id, 'custom_rule', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Description"
                            />
                            <input
                              type="text"
                              value={editedRule.custom_rule_regex || ''}
                              onChange={e => updateRule(rule.id, 'custom_rule_regex', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-sm font-mono"
                              placeholder="Regex pattern"
                            />
                          </div>
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            value={editedRule.example || ''}
                            onChange={e => updateRule(rule.id, 'example', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => saveRuleAndClose(rule.id)}
                              disabled={isSaving}
                              className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                              title="Save and close"
                            >
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingRule(null);
                                const newEdited = { ...editedRules };
                                delete newEdited[rule.id];
                                setEditedRules(newEdited);
                              }}
                              disabled={isSaving}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
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
                      key={rule.id}
                      className={`${getRowBgColor(editedRule)} hover:bg-opacity-75 cursor-pointer`}
                      onDoubleClick={() => {
                        setEditedRules(prev => ({ ...prev, [rule.id]: prev[rule.id] || rule }));
                        setEditingRule(rule.id);
                      }}
                    >
                      <td className="border px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getColorIndicator(editedRule)}`}></span>
                          <span className="font-medium">{editedRule.column_name}</span>
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">{editedRule.is_required ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-center">{editedRule.is_unique ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-center">{editedRule.allow_blank ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-gray-600">{editedRule.max_length || '—'}</td>
                      <td className="border px-3 py-2 text-gray-600 capitalize">{editedRule.data_type}</td>
                      <td className="border px-3 py-2 text-gray-500 text-xs">
                        {editedRule.custom_rule || editedRule.custom_rule_regex ? (
                          <div className="space-y-1">
                            {editedRule.custom_rule && <div className="break-words whitespace-normal">{editedRule.custom_rule}</div>}
                            {editedRule.custom_rule_regex && <div className="font-mono text-gray-400 break-all whitespace-normal">{editedRule.custom_rule_regex}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="border px-3 py-2 text-gray-500 font-mono text-xs break-words whitespace-normal">
                        {editedRule.example || '—'}
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditedRules(prev => ({ ...prev, [rule.id]: prev[rule.id] || rule }));
                              setEditingRule(rule.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Edit rule"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteRule(rule.id)}
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

          {template.rules.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">No columns defined</p>
              <button onClick={addNewRule} className="mt-4 btn-primary">
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
                <li>Click &quot;Save Changes&quot; to persist all your edits</li>
                <li>Color codes update automatically based on the rules you set</li>
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
            Custom Rule Help & Documentation
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
                <h2 className="text-xl font-semibold text-gray-900">Custom Rule Documentation</h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {/* Column Options */}
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Column Validation Options</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Required</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, this column must exist in the CSV file. Validation will fail if the column is missing.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Unique</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, all values in this column must be unique. Duplicate values will be flagged as errors.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Allow Blank</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, empty/blank values are permitted in this column. When unchecked, every row must have a value.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Max Length</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Maximum number of characters allowed in this column. Leave empty for no limit.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Data Type</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Text:</strong> Any string value<br />
                      <strong>Number:</strong> Numeric values only (integers or decimals)<br />
                      <strong>Boolean:</strong> True/false, yes/no, 1/0 values<br />
                      <strong>Date:</strong> Date values in standard formats
                    </p>
                  </div>
                </div>
              </section>

              {/* Custom Rules */}
              <section className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Rules</h3>
                <p className="text-gray-600 mb-4">
                  Custom rules allow you to define advanced validation using regular expressions (regex).
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Description Field</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      A human-readable description of what the rule validates. This is shown in error messages to help users understand why their data failed validation.
                    </p>
                    <p className="text-sm text-gray-500 mt-2 italic">
                      Example: &quot;Must end with a quote after a number&quot;
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Regex Pattern Field</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      A regular expression pattern that values must match. The entire value must match the pattern.
                    </p>
                  </div>
                </div>
              </section>

              {/* Regex Examples */}
              <section className="mb-8">
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
                        <td className="border px-3 py-2 font-mono text-xs">^\d{"{3}"}-\d{"{3}"}-\d{"{4}"}$</td>
                        <td className="border px-3 py-2">US Phone (xxx-xxx-xxxx)</td>
                        <td className="border px-3 py-2">555-123-4567</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border px-3 py-2 font-mono text-xs">^\d+&quot;$</td>
                        <td className="border px-3 py-2">Ends with quote after number</td>
                        <td className="border px-3 py-2">12&quot;</td>
                      </tr>
                      <tr>
                        <td className="border px-3 py-2 font-mono text-xs">^(Yes|No|N/A)$</td>
                        <td className="border px-3 py-2">Specific allowed values</td>
                        <td className="border px-3 py-2">Yes, No, N/A</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border px-3 py-2 font-mono text-xs">^[A-Z]{"{2}"}\d{"{6}"}$</td>
                        <td className="border px-3 py-2">2 letters + 6 digits</td>
                        <td className="border px-3 py-2">AB123456</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Regex Reference */}
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Regex Quick Reference</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">^</code> - Start of string
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">$</code> - End of string
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">\d</code> - Any digit (0-9)
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">\w</code> - Any word character
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">.</code> - Any single character
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">+</code> - One or more
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">*</code> - Zero or more
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">?</code> - Zero or one (optional)
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">{"{n}"}</code> - Exactly n times
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">{"{n,m}"}</code> - Between n and m times
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">[abc]</code> - Any of a, b, or c
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">[A-Z]</code> - Any uppercase letter
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">(a|b)</code> - Either a or b
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <code className="text-temetra-blue-600">\.</code> - Literal period
                  </div>
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
