/**
 * Supabase Database Schema
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * INSTRUCTIONS:
 * 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
 * 2. Select your project
 * 3. Go to "SQL Editor" in the left sidebar
 * 4. Create a new query and paste this entire file
 * 5. Click "Run" to create all the tables
 *
 * This creates all the database tables needed for the Temetra CSV Validator.
 */

-- Enable UUID generation (for unique IDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- Stores all user accounts (admins, developers, end customers)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Login credentials (email is the username)
    email TEXT UNIQUE NOT NULL,

    -- Personal info
    name TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,

    -- Role determines what they can do
    -- 'admin' = full access
    -- 'developer' = can upload CSVs for assigned project
    -- 'end_customer' = can view their project's data
    role TEXT NOT NULL CHECK (role IN ('admin', 'developer', 'end_customer')),

    -- For developers/end_customers: which project they're assigned to
    assigned_project_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,

    -- Soft delete (don't actually remove users, just mark them inactive)
    is_active BOOLEAN DEFAULT TRUE
);

-- Index for faster email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- PROJECTS TABLE
-- Each customer gets their own project with unique settings
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Project identification
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly name (e.g., "acme-water")
    description TEXT,

    -- The unique link developers use to access this project
    -- Format: /validate/{slug}
    public_link TEXT UNIQUE NOT NULL,

    -- Which validation template to use
    validation_template_id UUID NOT NULL,

    -- Settings
    alert_on_upload BOOLEAN DEFAULT TRUE, -- Email admin when file uploaded?

    -- Admin who manages this project (gets notifications)
    admin_email TEXT NOT NULL,

    -- Timestamps
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Project status: 'active', 'retired', or 'deleted'
    status TEXT DEFAULT 'active' NOT NULL
);

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_public_link ON projects(public_link);

-- ============================================
-- VALIDATION TEMPLATES TABLE
-- Stores the validation rules for each CSV format
-- ============================================
CREATE TABLE IF NOT EXISTS validation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template identification
    name TEXT NOT NULL,
    description TEXT,

    -- The actual rules (stored as JSON)
    -- This is an array of ValidationRule objects
    rules JSONB NOT NULL,

    -- Track who created and modified
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Is this the default template?
    is_default BOOLEAN DEFAULT FALSE,

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- FILE UPLOADS TABLE
-- Records every file that's uploaded to the system
-- ============================================
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Which project this belongs to
    project_id UUID NOT NULL REFERENCES projects(id),

    -- File info
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Supabase Storage
    file_size INTEGER NOT NULL, -- Size in bytes

    -- Who uploaded it
    uploaded_by_name TEXT NOT NULL,
    uploaded_by_email TEXT NOT NULL,
    additional_emails TEXT[], -- Array of extra emails to notify

    -- Upload metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,

    -- What type of upload is this?
    -- 'developer_submission' = Developer uploaded a CSV to validate
    -- 'admin_key_file' = Admin uploaded a template/key CSV
    -- 'admin_documentation' = Admin uploaded a PDF/doc
    upload_type TEXT NOT NULL CHECK (upload_type IN ('developer_submission', 'admin_key_file', 'admin_documentation')),

    -- Validation results
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
    errors JSONB, -- Array of ValidationError objects
    validation_summary TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_file_uploads_project ON file_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_at ON file_uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_uploads_type ON file_uploads(upload_type);

-- ============================================
-- ACTIVITY LOGS TABLE
-- Tracks all actions for audit purposes
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What happened
    action TEXT NOT NULL, -- e.g., 'user_login', 'file_uploaded', 'project_created'
    details TEXT, -- Additional context

    -- Who did it (optional - some actions are anonymous)
    user_id UUID REFERENCES users(id),
    user_email TEXT,

    -- Where did it happen
    project_id UUID REFERENCES projects(id),

    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,

    -- When
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster log queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON activity_logs(project_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- This ensures users can only see data they're allowed to see
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR USERS TABLE
-- ============================================

-- Admins can see all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT
    USING (id = auth.uid());

-- Admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Admins can update users
CREATE POLICY "Admins can update users" ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE
    USING (id = auth.uid());

-- ============================================
-- RLS POLICIES FOR PROJECTS TABLE
-- ============================================

-- Admins can see all projects
CREATE POLICY "Admins can view all projects" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Developers/End Customers can see their assigned project
CREATE POLICY "Assigned users can view their project" ON projects
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.assigned_project_id = projects.id
        )
    );

-- Admins can create/update/delete projects
CREATE POLICY "Admins can manage projects" ON projects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================
-- RLS POLICIES FOR FILE UPLOADS TABLE
-- ============================================

-- Admins can see all uploads
CREATE POLICY "Admins can view all uploads" ON file_uploads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Users can see uploads for their assigned project
CREATE POLICY "Users can view their project uploads" ON file_uploads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.assigned_project_id = file_uploads.project_id
        )
    );

-- Anyone can insert uploads (developers upload without accounts)
CREATE POLICY "Anyone can upload files" ON file_uploads
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- RLS POLICIES FOR VALIDATION TEMPLATES
-- ============================================

-- Anyone can view templates (needed for validation)
CREATE POLICY "Anyone can view templates" ON validation_templates
    FOR SELECT
    USING (true);

-- Only admins can create/modify templates
CREATE POLICY "Admins can manage templates" ON validation_templates
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- ============================================
-- RLS POLICIES FOR ACTIVITY LOGS
-- ============================================

-- Admins can see all logs
CREATE POLICY "Admins can view all logs" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Anyone can create logs
CREATE POLICY "Anyone can create logs" ON activity_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_validation_templates_updated_at
    BEFORE UPDATE ON validation_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert the default NewNetworkUpload template
-- (You'll need to run this after creating your first admin user)
-- The actual rules will be inserted by the application

COMMENT ON TABLE users IS 'All user accounts - admins, developers, and end customers';
COMMENT ON TABLE projects IS 'Customer projects with unique validation settings';
COMMENT ON TABLE validation_templates IS 'Saved validation rule sets';
COMMENT ON TABLE file_uploads IS 'Record of all uploaded files';
COMMENT ON TABLE activity_logs IS 'Audit trail of all system actions';
