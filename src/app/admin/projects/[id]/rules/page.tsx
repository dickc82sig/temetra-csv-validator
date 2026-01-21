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
  GripVertical,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { DEFAULT_VALIDATION_RULES, ValidationRule } from '@/lib/validation-rules';

interface Project {
  id: string;
  name: string;
}

export default function ProjectRulesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingRule, setEditingRule] = useState<string | null>(null);

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
          // Mock project data
          const mockProjects: Record<string, Project> = {
            '1': { id: '1', name: 'Acme Water Company' },
            '2': { id: '2', name: 'City Utilities Department' },
            '3': { id: '3', name: 'Regional Gas Co' },
            '4': { id: '4', name: 'Metro Electric' },
          };
          setProject(mockProjects[projectId] || { id: projectId, name: 'Unknown Project' });
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
  const updateRule = (columnName: string, updates: Partial<ValidationRule>) => {
    setRules(prev => prev.map(rule =>
      rule.columnName === columnName ? { ...rule, ...updates } : rule
    ));
  };

  // Add a new rule
  const addRule = () => {
    const newRule: ValidationRule = {
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
    setError('');
    setSuccess('');

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

      setSuccess('Validation rules saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving rules:', err);
      setError('Failed to save rules. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const getDataTypeColor = (dataType: string) => {
    const colors: Record<string, string> = {
      string: 'bg-blue-100 text-blue-700',
      number: 'bg-green-100 text-green-700',
      date: 'bg-purple-100 text-purple-700',
      boolean: 'bg-amber-100 text-amber-700',
      email: 'bg-pink-100 text-pink-700',
    };
    return colors[dataType] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-6xl mx-auto px-4 py-8">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href={`/admin/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Validation Rules</h1>
            <p className="mt-1 text-gray-600">
              {project?.name} &bull; Configure column validation settings
            </p>
          </div>
          <div className="flex gap-2">
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
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Rules table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Column Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Display Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Data Type</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Required</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Validation</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map((rule, index) => (
                <tr key={rule.columnName} className="hover:bg-gray-50">
                  <td className="px-2">
                    <GripVertical className="h-4 w-4 text-gray-300 cursor-move" />
                  </td>
                  <td className="px-4 py-3">
                    {editingRule === rule.columnName ? (
                      <input
                        type="text"
                        value={rule.columnName}
                        onChange={e => updateRule(rule.columnName, { columnName: e.target.value })}
                        className="input-field text-sm py-1"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="font-mono text-sm cursor-pointer hover:text-temetra-blue-600"
                        onClick={() => setEditingRule(rule.columnName)}
                      >
                        {rule.columnName}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={rule.displayName}
                      onChange={e => updateRule(rule.columnName, { displayName: e.target.value })}
                      className="w-full bg-transparent border-0 focus:ring-0 text-sm py-1 px-0"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={rule.dataType}
                      onChange={e => updateRule(rule.columnName, { dataType: e.target.value as ValidationRule['dataType'] })}
                      className={`px-2 py-1 text-xs rounded border-0 focus:ring-2 focus:ring-temetra-blue-500 ${getDataTypeColor(rule.dataType)}`}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="boolean">Boolean</option>
                      <option value="email">Email</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={rule.required}
                      onChange={e => updateRule(rule.columnName, { required: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {rule.minLength && <span>Min: {rule.minLength} </span>}
                    {rule.maxLength && <span>Max: {rule.maxLength} </span>}
                    {rule.pattern && <span>Pattern </span>}
                    {rule.allowedValues && <span>{rule.allowedValues.length} values </span>}
                    {!rule.minLength && !rule.maxLength && !rule.pattern && !rule.allowedValues && (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeRule(rule.columnName)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Remove column"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No validation rules defined. Click &quot;Add Column&quot; to create one.
            </div>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Tips for validation rules</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>&bull; <strong>Column Name</strong> must match exactly the CSV header</li>
            <li>&bull; <strong>Required</strong> columns will flag an error if empty</li>
            <li>&bull; <strong>Data Type</strong> determines how the value is validated</li>
            <li>&bull; Changes are not saved until you click &quot;Save Rules&quot;</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
