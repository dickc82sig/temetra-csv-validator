/**
 * CSV Validation Engine
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the heart of the validation system. It reads CSV files and checks
 * every cell against the rules defined in the validation template.
 *
 * HOW IT WORKS:
 * 1. Parse the CSV file into rows and columns
 * 2. Check each row against all the rules
 * 3. Collect all errors and warnings
 * 4. Return a report of what's wrong (and what's right!)
 */

import Papa from 'papaparse';
import { ValidationRule, ValidationError, ValidationTemplate } from '@/types';
import { VALID_UNITS, VALID_COLLECTION_METHODS } from './validation-rules';

/**
 * The result of validating a CSV file
 */
export interface ValidationResult {
  isValid: boolean;              // Did the file pass all checks?
  totalRows: number;             // How many data rows were checked
  totalErrors: number;           // Number of errors found
  totalWarnings: number;         // Number of warnings found
  errors: ValidationError[];     // List of all problems
  summary: string;               // Human-readable summary
  columnMatches: boolean;        // Do the headers match the template?
  missingColumns: string[];      // Columns that should be there but aren't
  extraColumns: string[];        // Columns that are there but shouldn't be
}

/**
 * Main validation function
 *
 * @param csvContent - The raw CSV file contents as a string
 * @param template - The validation template with all the rules
 * @returns ValidationResult with all errors and a summary
 */
export function validateCSV(
  csvContent: string,
  template: ValidationTemplate
): ValidationResult {
  const errors: ValidationError[] = [];

  // Step 1: Parse the CSV file
  // Papa Parse is a library that converts CSV text into JavaScript objects
  const parsed = Papa.parse(csvContent, {
    header: true,        // First row is column names
    skipEmptyLines: true, // Ignore blank lines
    transformHeader: (header) => header.trim().toUpperCase(), // Normalize headers
  });

  const rows = parsed.data as Record<string, string>[];
  const headers = parsed.meta.fields || [];

  // Step 2: Check if the columns match what we expect
  const expectedColumns = template.rules.map(r => r.column_name.toUpperCase());
  const actualColumns = headers.map(h => h.toUpperCase());

  const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
  const extraColumns = actualColumns.filter(col => !expectedColumns.includes(col));

  // Add error for each missing required column
  missingColumns.forEach(col => {
    const rule = template.rules.find(r => r.column_name.toUpperCase() === col);
    if (rule?.is_required) {
      errors.push({
        row: 0,
        column: col,
        value: '',
        rule: 'missing_column',
        message: `Required column "${col}" is missing from the file`,
        severity: 'error',
        notes: rule.notes,
      });
    }
  });

  // Step 3: Validate each row
  // We track unique values to check for duplicates
  const uniqueValues: Record<string, Set<string>> = {};

  // Initialize unique value trackers for columns that require uniqueness
  template.rules.forEach(rule => {
    if (rule.is_unique) {
      uniqueValues[rule.column_name.toUpperCase()] = new Set();
    }
  });

  // Check each row
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2; // +2 because: arrays start at 0, plus header row

    // Check each rule against the corresponding column
    template.rules.forEach(rule => {
      const columnName = rule.column_name.toUpperCase();
      const value = row[columnName]?.trim() || '';

      // Skip if column doesn't exist (already reported as missing)
      if (!actualColumns.includes(columnName)) {
        return;
      }

      // Check: Is this required field empty?
      if (rule.is_required && !rule.allow_blank && value === '') {
        errors.push({
          row: rowNumber,
          column: rule.column_name,
          value: value,
          rule: 'required',
          message: `"${rule.column_name}" is required but is empty`,
          severity: 'error',
          notes: rule.notes,
        });
        return; // Skip other checks if empty
      }

      // Skip further validation if value is blank and blanks are allowed
      if (value === '' && rule.allow_blank) {
        return;
      }

      // Check: Is this value unique when it should be?
      if (rule.is_unique && value !== '') {
        const upperValue = value.toUpperCase();
        if (uniqueValues[columnName].has(upperValue)) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'unique',
            message: `"${rule.column_name}" must be unique, but "${value}" appears more than once`,
            severity: 'error',
            notes: rule.notes,
          });
        } else {
          uniqueValues[columnName].add(upperValue);
        }
      }

      // Check: Is the value too short?
      if (rule.min_length && value.length < rule.min_length) {
        errors.push({
          row: rowNumber,
          column: rule.column_name,
          value: value,
          rule: 'min_length',
          message: `"${rule.column_name}" must be at least ${rule.min_length} characters (got ${value.length})`,
          severity: 'error',
          notes: rule.notes,
        });
      }

      // Check: Is the value too long?
      if (rule.max_length && value.length > rule.max_length) {
        errors.push({
          row: rowNumber,
          column: rule.column_name,
          value: value,
          rule: 'max_length',
          message: `"${rule.column_name}" must be at most ${rule.max_length} characters (got ${value.length})`,
          severity: 'error',
          notes: rule.notes,
        });
      }

      // Check: Is it a valid boolean?
      if (rule.data_type === 'boolean' && value !== '') {
        const validBooleans = ['yes', 'no', 'true', 'false', '1', '0'];
        if (!validBooleans.includes(value.toLowerCase())) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'data_type',
            message: `"${rule.column_name}" must be yes/no or true/false (got "${value}")`,
            severity: 'error',
            notes: rule.notes,
          });
        }
      }

      // Check: Does it contain invalid characters?
      if (rule.invalid_characters && value !== '') {
        const invalidChars = rule.invalid_characters.split('');
        const foundInvalid = invalidChars.filter(char => value.includes(char));
        if (foundInvalid.length > 0) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'invalid_characters',
            message: `"${rule.column_name}" contains invalid characters: ${foundInvalid.join(', ')}`,
            severity: 'error',
            notes: rule.notes,
          });
        }
      }

      // Check: Does it match a required pattern?
      if (rule.pattern && value !== '') {
        try {
          const regex = new RegExp(rule.pattern);
          if (!regex.test(value)) {
            errors.push({
              row: rowNumber,
              column: rule.column_name,
              value: value,
              rule: 'pattern',
              message: `"${rule.column_name}" doesn't match the required format`,
              severity: 'error',
              notes: rule.notes,
            });
          }
        } catch {
          // Invalid regex pattern - skip this check
        }
      }

      // Special validation for specific columns
      // These are business rules specific to Temetra

      // Validate METERUNITS against known valid values
      if (columnName === 'METERUNITS' && value !== '') {
        const allValidUnits = [
          ...VALID_UNITS.gas,
          ...VALID_UNITS.water,
          ...VALID_UNITS.electric,
        ];
        if (!allValidUnits.includes(value)) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'invalid_value',
            message: `"${value}" is not a valid unit. Valid units are: ${allValidUnits.join(', ')}`,
            severity: 'warning',
            notes: rule.notes,
          });
        }
      }

      // Validate COLLECTIONMETHOD
      if (columnName === 'COLLECTIONMETHOD' && value !== '') {
        if (!VALID_COLLECTION_METHODS.includes(value)) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'invalid_value',
            message: `"${value}" may not be a valid collection method. Expected: ${VALID_COLLECTION_METHODS.join(', ')}`,
            severity: 'warning',
            notes: rule.notes,
          });
        }
      }

      // Validate LAT/LON format (should be decimal degrees)
      if ((columnName === 'LAT' || columnName === 'LON') && value !== '') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'data_type',
            message: `"${rule.column_name}" should be a decimal number (got "${value}")`,
            severity: 'error',
            notes: rule.notes,
          });
        } else {
          // Check reasonable ranges
          if (columnName === 'LAT' && (num < -90 || num > 90)) {
            errors.push({
              row: rowNumber,
              column: rule.column_name,
              value: value,
              rule: 'range',
              message: `Latitude should be between -90 and 90 (got ${num})`,
              severity: 'warning',
              notes: rule.notes,
            });
          }
          if (columnName === 'LON' && (num < -180 || num > 180)) {
            errors.push({
              row: rowNumber,
              column: rule.column_name,
              value: value,
              rule: 'range',
              message: `Longitude should be between -180 and 180 (got ${num})`,
              severity: 'warning',
              notes: rule.notes,
            });
          }
        }
      }

      // Validate email format
      if (columnName === 'CUSTOMEREMAIL1' && value !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'format',
            message: `"${value}" doesn't look like a valid email address`,
            severity: 'warning',
            notes: rule.notes,
          });
        }
      }

      // Validate phone format (basic check)
      if (columnName === 'PHONE' && value !== '') {
        const digitsOnly = value.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          errors.push({
            row: rowNumber,
            column: rule.column_name,
            value: value,
            rule: 'format',
            message: `Phone number should have at least 10 digits`,
            severity: 'warning',
            notes: rule.notes,
          });
        }
      }

      // Check for cellular endpoints requiring cellular-device-installed tag
      if (columnName === 'COLLECTIONMETHOD' && value !== '') {
        if (value.includes('Cellular')) {
          const addTag = row['ADDTAG'] || '';
          if (!addTag.toLowerCase().includes('cellular-device-installed')) {
            errors.push({
              row: rowNumber,
              column: 'ADDTAG',
              value: addTag,
              rule: 'business_rule',
              message: `When COLLECTIONMETHOD is "${value}", ADDTAG should include "cellular-device-installed"`,
              severity: 'warning',
              notes: 'For cellular endpoints, pass an addtag value of "Cellular-Device-Installed" to enable automatic provisioning.',
            });
          }
        }
      }
    });
  });

  // Step 4: Build the result summary
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  let summary = '';
  if (errorCount === 0 && warningCount === 0) {
    summary = `Success! All ${rows.length} rows passed validation.`;
  } else if (errorCount === 0) {
    summary = `Validation passed with ${warningCount} warning(s). ${rows.length} rows checked.`;
  } else {
    summary = `Validation failed with ${errorCount} error(s) and ${warningCount} warning(s). ${rows.length} rows checked.`;
  }

  if (missingColumns.length > 0) {
    summary += ` Missing columns: ${missingColumns.join(', ')}.`;
  }

  return {
    isValid: errorCount === 0,
    totalRows: rows.length,
    totalErrors: errorCount,
    totalWarnings: warningCount,
    errors: errors,
    summary: summary,
    columnMatches: missingColumns.length === 0 && extraColumns.length === 0,
    missingColumns: missingColumns,
    extraColumns: extraColumns,
  };
}

/**
 * Parse a CSV file and return just the headers
 * Useful for showing the column structure without full validation
 */
export function getCSVHeaders(csvContent: string): string[] {
  const parsed = Papa.parse(csvContent, {
    header: true,
    preview: 1, // Only parse first row for speed
  });
  return parsed.meta.fields || [];
}

/**
 * Parse CSV and return preview data
 * Shows first few rows for the admin to review
 */
export function getCSVPreview(
  csvContent: string,
  rowLimit: number = 10
): { headers: string[]; rows: Record<string, string>[] } {
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    preview: rowLimit,
  });
  return {
    headers: parsed.meta.fields || [],
    rows: parsed.data as Record<string, string>[],
  };
}
