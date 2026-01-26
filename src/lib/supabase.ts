/**
 * Supabase Client Configuration
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Supabase is our database and authentication service.
 * This file sets up the connection to Supabase.
 *
 * IMPORTANT: You'll need to replace the placeholder values with your
 * actual Supabase project credentials. See the setup.md file for instructions.
 */

import { createClient } from '@supabase/supabase-js';

/**
 * These values come from your Supabase project settings.
 * Go to: https://supabase.com/dashboard → Your Project → Settings → API
 *
 * For security, these should be in environment variables (.env.local file)
 * The values below are placeholders - replace them with your actual values!
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

/**
 * Create the Supabase client
 * This is what we use to talk to the database and handle authentication
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Database table names
 * Using constants prevents typos when referencing tables
 */
export const TABLES = {
  USERS: 'users',
  PROJECTS: 'projects',
  VALIDATION_TEMPLATES: 'validation_templates',
  FILE_UPLOADS: 'file_uploads',
  ACTIVITY_LOGS: 'activity_logs',
  CHAT_MESSAGES: 'chat_messages',
  CHAT_NOTIFICATIONS: 'chat_notifications',
};

/**
 * Storage bucket names
 * Supabase Storage is where we keep uploaded files
 */
export const STORAGE_BUCKETS = {
  CSV_FILES: 'csv-files',           // Developer CSV uploads
  KEY_FILES: 'key-files',           // Admin template CSV files
  DOCUMENTATION: 'documentation',    // PDF documentation files
};
