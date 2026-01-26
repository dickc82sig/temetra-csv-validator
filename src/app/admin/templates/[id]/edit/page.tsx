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

  const updateRule = (ruleId: string, updates: Partial<TemplateRule>) => {
    setEditedRules(prev => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], ...updates },
    }));
  };

  const saveChanges = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
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
        .eq('id', template.id);

      if (error) throw error;

      setTemplate(prev => prev ? { ...prev, rules: updatedRules } : prev);
      setEditedRules({});
      setEditingRule(null);
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving template:', err);
      setMessage({ type: 'error', text: 'Failed to save template' });
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
                            className="w-full px-2 py-1 border rounded text-sm"
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
                              placeholder="Description"
                            />
                            <input
                              type="text"
                              value={editedRule.custom_rule_regex || ''}
                              onChange={e => updateRule(rule.id, { ...editedRule, custom_rule_regex: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm font-mono"
                              placeholder="Regex pattern"
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
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => setEditingRule(null)}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Done editing"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingRule(null);
                                const newEdited = { ...editedRules };
                                delete newEdited[rule.id];
                                setEditedRules(newEdited);
                              }}
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
                      <td className="border px-3 py-2 text-gray-500 text-xs max-w-48">
                        {rule.custom_rule || rule.custom_rule_regex ? (
                          <div className="space-y-0.5">
                            {rule.custom_rule && <div className="truncate" title={rule.custom_rule}>{rule.custom_rule}</div>}
                            {rule.custom_rule_regex && <div className="font-mono text-gray-400 truncate" title={rule.custom_rule_regex}>{rule.custom_rule_regex}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="border px-3 py-2 text-gray-500 font-mono text-xs">
                        {rule.example ? rule.example.slice(0, 30) : '—'}
                      </td>
                      <td className="border px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditedRules(prev => ({ ...prev, [rule.id]: rule }));
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
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
