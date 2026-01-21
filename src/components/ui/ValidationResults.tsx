/**
 * Validation Results Component
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Displays the results of CSV validation in a clear, organized format.
 * Shows errors grouped by type with relevant notes and examples.
 */

'use client';

import { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
} from 'lucide-react';
import { ValidationResult } from '@/lib/csv-validator';
import { ValidationError } from '@/types';

interface ValidationResultsProps {
  results: ValidationResult;
  onDownloadReport?: () => void;
}

export default function ValidationResults({ results, onDownloadReport }: ValidationResultsProps) {
  // State for expanding/collapsing error groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['errors']));

  /**
   * Toggle a group's expanded state
   */
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  /**
   * Group errors by column for easier navigation
   */
  const errorsByColumn: Record<string, ValidationError[]> = {};
  const warningsByColumn: Record<string, ValidationError[]> = {};

  results.errors.forEach(error => {
    if (error.severity === 'error') {
      if (!errorsByColumn[error.column]) {
        errorsByColumn[error.column] = [];
      }
      errorsByColumn[error.column].push(error);
    } else {
      if (!warningsByColumn[error.column]) {
        warningsByColumn[error.column] = [];
      }
      warningsByColumn[error.column].push(error);
    }
  });

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className={`card ${results.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-start gap-4">
          {/* Status icon */}
          <div className="flex-shrink-0">
            {results.isValid ? (
              <CheckCircle className="h-10 w-10 text-green-500" />
            ) : (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>

          {/* Summary text */}
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${results.isValid ? 'text-green-800' : 'text-red-800'}`}>
              {results.isValid ? 'Validation Passed!' : 'Validation Failed'}
            </h3>
            <p className={`mt-1 ${results.isValid ? 'text-green-700' : 'text-red-700'}`}>
              {results.summary}
            </p>

            {/* Stats */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{results.totalRows} rows checked</span>
              </div>
              {results.totalErrors > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">{results.totalErrors} errors</span>
                </div>
              )}
              {results.totalWarnings > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-600">{results.totalWarnings} warnings</span>
                </div>
              )}
            </div>
          </div>

          {/* Download button */}
          {onDownloadReport && (
            <button onClick={onDownloadReport} className="btn-secondary flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </button>
          )}
        </div>
      </div>

      {/* Missing columns warning */}
      {results.missingColumns.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800">Missing Columns</h4>
              <p className="text-sm text-orange-700 mt-1">
                The following expected columns are missing from your file:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {results.missingColumns.map(col => (
                  <span key={col} className="px-2 py-1 bg-orange-100 rounded text-sm text-orange-800">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra columns info */}
      {results.extraColumns.length > 0 && (
        <div className="card border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Extra Columns Found</h4>
              <p className="text-sm text-blue-700 mt-1">
                These columns are in your file but not in the template (they will be ignored):
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {results.extraColumns.map(col => (
                  <span key={col} className="px-2 py-1 bg-blue-100 rounded text-sm text-blue-800">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Errors by Column */}
      {Object.keys(errorsByColumn).length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleGroup('errors')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Errors ({results.totalErrors})</h3>
            </div>
            {expandedGroups.has('errors') ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedGroups.has('errors') && (
            <div className="mt-4 space-y-4">
              {Object.entries(errorsByColumn).map(([column, errors]) => (
                <ErrorGroup key={column} column={column} errors={errors} type="error" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Warnings by Column */}
      {Object.keys(warningsByColumn).length > 0 && (
        <div className="card">
          <button
            onClick={() => toggleGroup('warnings')}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Warnings ({results.totalWarnings})</h3>
            </div>
            {expandedGroups.has('warnings') ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedGroups.has('warnings') && (
            <div className="mt-4 space-y-4">
              {Object.entries(warningsByColumn).map(([column, errors]) => (
                <ErrorGroup key={column} column={column} errors={errors} type="warning" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success message when no errors */}
      {results.isValid && results.totalWarnings === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">All checks passed!</h3>
          <p className="mt-2 text-gray-600">
            Your CSV file is valid and ready for import into Temetra.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Component to display a group of errors for a specific column
 */
function ErrorGroup({
  column,
  errors,
  type,
}: {
  column: string;
  errors: ValidationError[];
  type: 'error' | 'warning';
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Limit displayed errors to prevent overwhelming the UI
  const displayLimit = 5;
  const displayedErrors = showAll ? errors : errors.slice(0, displayLimit);
  const hiddenCount = errors.length - displayLimit;

  const bgColor = type === 'error' ? 'bg-red-50' : 'bg-yellow-50';
  const borderColor = type === 'error' ? 'border-red-200' : 'border-yellow-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-yellow-800';

  // Get the notes from the first error (they should all be the same for this column)
  const columnNotes = errors[0]?.notes;

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}>
      {/* Column header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-opacity-80"
      >
        <div className="flex items-center gap-2">
          <span className={`font-medium ${textColor}`}>{column}</span>
          <span className="text-sm text-gray-500">({errors.length} issues)</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Error details */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Column notes/documentation */}
          {columnNotes && (
            <div className="mb-3 p-3 bg-white rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Documentation Notes:</p>
              <p className="text-sm text-gray-700">{columnNotes}</p>
            </div>
          )}

          {/* Individual errors */}
          <div className="space-y-2">
            {displayedErrors.map((error, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 w-16 flex-shrink-0">Row {error.row}:</span>
                <div className="flex-1">
                  <span className={textColor}>{error.message}</span>
                  {error.value && (
                    <span className="text-gray-500 ml-1">
                      (value: &quot;{error.value.length > 30 ? error.value.slice(0, 30) + '...' : error.value}&quot;)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Show more/less button */}
          {errors.length > displayLimit && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-sm text-temetra-blue-600 hover:text-temetra-blue-700"
            >
              {showAll ? 'Show less' : `Show ${hiddenCount} more...`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
