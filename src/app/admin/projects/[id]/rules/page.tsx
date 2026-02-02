/**
 * Project Validation Rules Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows admins to view and modify a project's validation rules.
 * Rules are loaded from the project's assigned template.
 * Changes are saved as a new template (save-as-new flow).
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
  ChevronDown,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';

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

interface TemplateOption {
  id: string;
  name: string;
  ruleCount: number;
}

interface Project {
  id: string;
  name: string;
  validation_template_id: string;
}

export default function ProjectRulesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<TemplateRule[]>([]);
  const [currentTemplateName, setCurrentTemplateName] = useState('');
  const [currentTemplateId, setCurrentTemplateId] = useState('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editedRules, setEditedRules] = useState<Record<string, TemplateRule>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [aiRuleInput, setAiRuleInput] = useState<Record<string, string>>({});
  const [aiRuleLoading, setAiRuleLoading] = useState<string | null>(null);
  const [aiRuleError, setAiRuleError] = useState<Record<string, string>>({});

  // Load project, template, and template list
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, validation_template_id')
          .eq('id', projectId)
          .single();

        if (!projectData) {
          setProject(null);
          setIsLoading(false);
          return;
        }

        setProject(projectData);

        // Load all templates for dropdown
        const { data: allTemplates } = await supabase
          .from('validation_templates')
          .select('id, name, rules')
          .eq('is_active', true)
          .order('name');

        if (allTemplates) {
          setTemplates(allTemplates.map(t => ({
            id: t.id,
            name: t.name,
            ruleCount: Array.isArray(t.rules) ? t.rules.length : 0,
          })));
        }

        // Load the assigned template's rules
        if (projectData.validation_template_id) {
          const { data: templateData } = await supabase
            .from('validation_templates')
            .select('id, name, rules')
            .eq('id', projectData.validation_template_id)
            .single();

          if (templateData) {
            setCurrentTemplateId(templateData.id);
            setCurrentTemplateName(templateData.name);
            setRules(templateData.rules || []);
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Switch template via dropdown
  const handleTemplateChange = async (templateId: string) => {
    if (!templateId || templateId === currentTemplateId) return;

    try {
      // Load the new template's rules
      const { data: templateData } = await supabase
        .from('validation_templates')
        .select('id, name, rules')
        .eq('id', templateId)
        .single();

      if (templateData) {
        // Update project to point to new template
        const { error: updateError } = await supabase
          .from('projects')
          .update({ validation_template_id: templateId })
          .eq('id', projectId);

        if (updateError) throw updateError;

        setCurrentTemplateId(templateData.id);
        setCurrentTemplateName(templateData.name);
        setRules(templateData.rules || []);
        setEditedRules({});
        setEditingRule(null);
        setMessage({ type: 'success', text: `Switched to template "${templateData.name}"` });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error switching template:', err);
      setMessage({ type: 'error', text: 'Failed to switch template' });
    }
  };

  // Get the effective rule (edited or original)
  const getEffectiveRule = (rule: TemplateRule) => editedRules[rule.id] || rule;

  // Update a rule field
  const updateRule = (ruleId: string, field: string, value: string | number | boolean | undefined) => {
    setEditedRules(prev => {
      const currentRule = prev[ruleId] || rules.find(r => r.id === ruleId);
      if (!currentRule) return prev;
      return {
        ...prev,
        [ruleId]: { ...currentRule, [field]: value },
      };
    });
  };

  // Add a new rule
  const addNewRule = () => {
    const newRule: TemplateRule = {
      id: `rule-${Date.now()}`,
      column_name: 'New Column',
      column_index: rules.length,
      is_required: false,
      allow_blank: true,
      is_unique: false,
      data_type: 'text',
    };
    setRules(prev => [...prev, newRule]);
    setEditedRules(prev => ({ ...prev, [newRule.id]: newRule }));
    setEditingRule(newRule.id);
  };

  // Remove a rule
  const removeRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    const newEdited = { ...editedRules };
    delete newEdited[ruleId];
    setEditedRules(newEdited);
  };

  // Generate a custom rule using AI
  const generateAiRule = async (ruleId: string) => {
    const input = aiRuleInput[ruleId];
    if (!input?.trim()) return;

    const currentRule = editedRules[ruleId] || rules.find(r => r.id === ruleId);
    if (!currentRule) return;

    setAiRuleLoading(ruleId);
    setAiRuleError(prev => ({ ...prev, [ruleId]: '' }));

    try {
      const response = await fetch('/api/admin/ai-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: input,
          columnName: currentRule.column_name,
          dataType: currentRule.data_type,
          example: currentRule.example,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate rule');
      }

      if (data.regex) {
        updateRule(ruleId, 'custom_rule_regex', data.regex);
      }
      if (data.description) {
        updateRule(ruleId, 'custom_rule', data.description);
      }
      if (data.example && !currentRule.example) {
        updateRule(ruleId, 'example', data.example);
      }

      setAiRuleInput(prev => ({ ...prev, [ruleId]: '' }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate rule';
      setAiRuleError(prev => ({ ...prev, [ruleId]: errorMessage }));
    } finally {
      setAiRuleLoading(null);
    }
  };

  // Handle save - prompts for new template name
  const handleSaveClick = () => {
    setNewTemplateName(`${project?.name || 'Project'} Template - ${new Date().toLocaleDateString()}`);
    setShowSaveModal(true);
  };

  // Save as new template
  const handleSaveAsNew = async () => {
    if (!newTemplateName.trim() || !project) return;

    setIsSaving(true);
    setMessage(null);

    try {
      // Merge edited rules into the full rules array
      const updatedRules = rules.map(rule => {
        const edited = editedRules[rule.id];
        return edited ? { ...rule, ...edited } : rule;
      });

      // Create a new template with these rules
      const { data: newTemplate, error: insertError } = await supabase
        .from('validation_templates')
        .insert({
          name: newTemplateName.trim(),
          description: `Custom template for ${project.name}`,
          rules: updatedRules,
          is_active: true,
          is_default: false,
        })
        .select('id, name')
        .single();

      if (insertError) throw insertError;

      if (newTemplate) {
        // Update project to point to new template
        const { error: updateError } = await supabase
          .from('projects')
          .update({ validation_template_id: newTemplate.id })
          .eq('id', projectId);

        if (updateError) throw updateError;

        setCurrentTemplateId(newTemplate.id);
        setCurrentTemplateName(newTemplate.name);
        setRules(updatedRules);
        setEditedRules({});
        setEditingRule(null);

        // Add new template to dropdown
        setTemplates(prev => [...prev, {
          id: newTemplate.id,
          name: newTemplate.name,
          ruleCount: updatedRules.length,
        }]);

        setMessage({ type: 'success', text: `Saved as new template "${newTemplate.name}"` });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error saving template:', err);
      setMessage({ type: 'error', text: 'Failed to save template. Please try again.' });
    } finally {
      setIsSaving(false);
      setShowSaveModal(false);
    }
  };

  const hasChanges = Object.keys(editedRules).length > 0;

  const getColorIndicators = (rule: TemplateRule): string[] => {
    const colors: string[] = [];
    if (rule.is_required && !rule.allow_blank) colors.push('bg-red-500');
    if (rule.is_unique) colors.push('bg-purple-500');
    if (rule.max_length) colors.push('bg-yellow-500');
    if (!rule.is_required) colors.push('bg-green-500');
    if (colors.length === 0) colors.push('bg-gray-400');
    return colors;
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
              onClick={addNewRule}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Column
            </button>
            {hasChanges && (
              <button
                onClick={handleSaveClick}
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
                    Save as New Template
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Template selector */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Active Template:
            </label>
            <div className="relative flex-1 max-w-md">
              <select
                value={currentTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="input-field pr-8 appearance-none"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.ruleCount} columns)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
            <span className="text-xs text-gray-500">
              Switching templates will update this project&apos;s validation rules immediately.
            </span>
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
                {rules.map((rule, index) => {
                  const effectiveRule = getEffectiveRule(rule);
                  const isEditing = editingRule === rule.id;

                  if (isEditing) {
                    return (
                      <tr key={rule.id} className="bg-yellow-50">
                        <td className="border px-3 py-2">{index + 1}</td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            value={effectiveRule.column_name}
                            onChange={e => updateRule(rule.id, 'column_name', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={effectiveRule.is_required}
                            onChange={e => updateRule(rule.id, 'is_required', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={effectiveRule.is_unique}
                            onChange={e => updateRule(rule.id, 'is_unique', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={effectiveRule.allow_blank}
                            onChange={e => updateRule(rule.id, 'allow_blank', e.target.checked)}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="number"
                            value={effectiveRule.max_length || ''}
                            onChange={e => updateRule(rule.id, 'max_length', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <select
                            value={effectiveRule.data_type}
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
                          <div className="space-y-2">
                            {/* AI Natural Language Input */}
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                              <label className="flex items-center gap-1 text-xs font-medium text-purple-700 mb-1">
                                <Sparkles className="h-3 w-3" />
                                Describe rule in plain English
                              </label>
                              <div className="flex gap-1">
                                <input
                                  type="text"
                                  value={aiRuleInput[rule.id] || ''}
                                  onChange={e => setAiRuleInput(prev => ({ ...prev, [rule.id]: e.target.value }))}
                                  className="flex-1 px-2 py-1 border border-purple-300 rounded text-sm"
                                  placeholder='e.g., "only allow yes, no, or N/A"'
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      generateAiRule(rule.id);
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => generateAiRule(rule.id)}
                                  disabled={aiRuleLoading === rule.id || !aiRuleInput[rule.id]?.trim()}
                                  className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1 whitespace-nowrap"
                                >
                                  {aiRuleLoading === rule.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                  Generate
                                </button>
                              </div>
                              {aiRuleError[rule.id] && (
                                <p className="text-xs text-red-600 mt-1">{aiRuleError[rule.id]}</p>
                              )}
                            </div>

                            {/* Manual Rule Fields */}
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={effectiveRule.custom_rule || ''}
                                onChange={e => updateRule(rule.id, 'custom_rule', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm"
                                placeholder="Rule description (for error messages)"
                              />
                              <input
                                type="text"
                                value={effectiveRule.custom_rule_regex || ''}
                                onChange={e => updateRule(rule.id, 'custom_rule_regex', e.target.value)}
                                className="w-full px-2 py-1 border rounded text-sm font-mono"
                                placeholder="Regex pattern (auto-generated or manual)"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="text"
                            value={effectiveRule.example || ''}
                            onChange={e => updateRule(rule.id, 'example', e.target.value)}
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
                      className={`${getRowBgColor(effectiveRule)} hover:bg-opacity-75 cursor-pointer`}
                      onDoubleClick={() => {
                        setEditedRules(prev => ({ ...prev, [rule.id]: prev[rule.id] || rule }));
                        setEditingRule(rule.id);
                      }}
                    >
                      <td className="border px-3 py-2 text-gray-500">{index + 1}</td>
                      <td className="border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {getColorIndicators(effectiveRule).map((color, i) => (
                              <span key={i} className={`w-2 h-2 rounded-full ${color}`}></span>
                            ))}
                          </div>
                          <span className="font-medium">{effectiveRule.column_name}</span>
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">{effectiveRule.is_required ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-center">{effectiveRule.is_unique ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-center">{effectiveRule.allow_blank ? '✓' : '—'}</td>
                      <td className="border px-3 py-2 text-gray-600">{effectiveRule.max_length || '—'}</td>
                      <td className="border px-3 py-2 text-gray-600 capitalize">{effectiveRule.data_type}</td>
                      <td className="border px-3 py-2 text-gray-500 text-xs">
                        {effectiveRule.custom_rule || effectiveRule.custom_rule_regex ? (
                          <div className="space-y-1">
                            {effectiveRule.custom_rule && <div className="break-words whitespace-normal">{effectiveRule.custom_rule}</div>}
                            {effectiveRule.custom_rule_regex && <div className="font-mono text-gray-400 break-all whitespace-normal">{effectiveRule.custom_rule_regex}</div>}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="border px-3 py-2 text-gray-500 font-mono text-xs break-words whitespace-normal">
                        {effectiveRule.example || '—'}
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
                            onClick={() => removeRule(rule.id)}
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
                <li>Use the template dropdown to switch to a different template</li>
                <li>When you modify rules, you&apos;ll be prompted to save as a new template</li>
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
            Validation Rule Help & Documentation
          </button>
        </div>
      </main>

      {/* Save As New Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Save as New Template</h2>
              <p className="text-sm text-gray-600 mt-1">
                Your changes will be saved as a new template and assigned to this project.
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="input-field"
                placeholder="Enter template name..."
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveAsNew();
                  }
                }}
              />
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsNew}
                disabled={!newTemplateName.trim() || isSaving}
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
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <h4 className="font-medium text-gray-900">Unique</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, all values in this column must be unique. Duplicate values will be flagged as errors.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Allow Blank</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      When checked, empty/blank values are permitted in this column.
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900">Data Type</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Text:</strong> Any string value<br />
                      <strong>Number:</strong> Numeric values only<br />
                      <strong>Boolean:</strong> True/false, yes/no, 1/0 values<br />
                      <strong>Date:</strong> Date values in standard formats
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
