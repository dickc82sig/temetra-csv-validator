/**
 * Type Definitions
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file defines all the data types used throughout the application.
 * TypeScript types help prevent bugs by ensuring data is in the expected format.
 */

/**
 * User Roles - What type of user someone is
 * - admin: Full access, can manage everything
 * - developer: Can upload CSVs and view validation results
 * - end_customer: Can view their project's uploads and results
 */
export type UserRole = 'admin' | 'developer' | 'end_customer';

/**
 * User - A person who uses the application
 */
export interface User {
  id: string;                    // Unique identifier (UUID)
  email: string;                 // Login email address
  name: string;                  // Full name
  role: UserRole;                // Their permission level
  company_name?: string;         // Company they work for
  phone?: string;                // Contact phone number
  created_at: string;            // When they signed up
  updated_at: string;            // Last profile update
  assigned_project_id?: string;  // For developers: which project they can access
}

/**
 * Project - A customer's CSV validation setup
 * Each project has its own validation rules and unique link
 */
export interface Project {
  id: string;                    // Unique identifier (UUID)
  name: string;                  // Project name (e.g., "Acme Water Company")
  slug: string;                  // URL-friendly name (e.g., "acme-water")
  description?: string;          // Optional description
  created_by: string;            // Admin who created it
  created_at: string;            // Creation date
  updated_at: string;            // Last update date

  // Project settings
  alert_on_upload: boolean;      // Send email to admin when file uploaded?
  validation_template_id: string; // Which validation rules to use

  // The unique link for developers
  public_link: string;           // e.g., "/validate/acme-water"
}

/**
 * ValidationRule - A single rule for validating a CSV column
 */
export interface ValidationRule {
  id: string;                    // Unique identifier
  column_name: string;           // The CSV column header this applies to
  column_index: number;          // Position in the CSV (0-based)

  // Rule settings (all optional, checked if true)
  is_required: boolean;          // Must this field have a value?
  allow_blank: boolean;          // Can this field be empty?
  is_unique: boolean;            // Must all values in this column be different?

  // Character/length rules
  min_length?: number;           // Minimum characters allowed
  max_length?: number;           // Maximum characters allowed

  // Data type
  data_type: 'text' | 'number' | 'boolean' | 'date';

  // Pattern matching (advanced)
  pattern?: string;              // Regular expression pattern
  invalid_characters?: string;   // Characters that are NOT allowed

  // Help text
  notes?: string;                // Description/instructions for this field
  example?: string;              // Example valid value

  // Display settings
  color_code?: string;           // Color for visual editor
}

/**
 * ValidationTemplate - A saved set of rules for a CSV format
 */
export interface ValidationTemplate {
  id: string;
  name: string;                  // Template name (e.g., "NewNetworkUpload")
  description?: string;
  rules: ValidationRule[];       // All the column rules
  created_by: string;            // Admin who created it
  created_at: string;
  updated_at: string;
}

/**
 * FileUpload - Record of a CSV file that was uploaded
 */
export interface FileUpload {
  id: string;
  project_id: string;            // Which project this belongs to
  file_name: string;             // Original filename
  file_path: string;             // Where it's stored in Supabase
  file_size: number;             // Size in bytes

  // Who uploaded it
  uploaded_by_name: string;
  uploaded_by_email: string;
  additional_emails?: string[];  // Other people to notify

  // Upload metadata
  uploaded_at: string;
  ip_address?: string;
  user_agent?: string;

  // Validation results
  validation_status: 'pending' | 'valid' | 'invalid';
  errors?: ValidationError[];    // List of problems found

  // Type of upload
  upload_type: 'developer_submission' | 'admin_key_file' | 'admin_documentation';
}

/**
 * ValidationError - A single problem found during validation
 */
export interface ValidationError {
  row: number;                   // Which row has the problem (1-based)
  column: string;                // Which column has the problem
  value: string;                 // The problematic value
  rule: string;                  // Which rule was violated
  message: string;               // Human-readable error message
  severity: 'error' | 'warning'; // How serious is it?
  notes?: string;                // Related notes/instructions from the template
}

/**
 * ActivityLog - Record of an action in the system
 */
export interface ActivityLog {
  id: string;
  project_id?: string;
  user_id?: string;
  action: string;                // What happened (e.g., "file_uploaded")
  details?: string;              // Additional info
  ip_address?: string;
  created_at: string;
}

/**
 * NewNetworkUpload Column Definition
 * This matches your Excel specification exactly
 */
export interface NewNetworkUploadColumn {
  name: string;
  required: boolean;
  allowBlank: boolean;
  uniqueRequired: boolean;
  dataType: 'Boolean' | 'Character';
  length?: number | string;       // Can be "5-48" for ranges
  example: string;
  notes: string;
}

/**
 * Password validation rules (Microsoft-style complexity)
 */
export interface PasswordValidation {
  minLength: boolean;            // At least 12 characters
  hasUppercase: boolean;         // Has capital letter
  hasLowercase: boolean;         // Has lowercase letter
  hasNumber: boolean;            // Has digit
  hasSpecial: boolean;           // Has special character
  isValid: boolean;              // Passes all rules
}
