# Temetra CSV Validation Tool - Setup Guide

**Copyright (c) 2024 Vanzora, LLC. All rights reserved.**

This guide will walk you through setting up the Temetra CSV Validation Tool step by step.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create a Supabase Account](#step-1-create-a-supabase-account)
3. [Step 2: Create a New Supabase Project](#step-2-create-a-new-supabase-project)
4. [Step 3: Set Up the Database](#step-3-set-up-the-database)
5. [Step 4: Configure Storage Buckets](#step-4-configure-storage-buckets)
6. [Step 5: Get Your API Keys](#step-5-get-your-api-keys)
7. [Step 6: Configure the Application](#step-6-configure-the-application)
8. [Step 7: Install Dependencies](#step-7-install-dependencies)
9. [Step 8: Run the Application Locally](#step-8-run-the-application-locally)
10. [Step 9: Create Your First Admin User](#step-9-create-your-first-admin-user)
11. [Step 10: Deploy to Vercel](#step-10-deploy-to-vercel)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- [ ] A computer with internet access
- [ ] A web browser (Chrome, Firefox, Safari, or Edge)
- [ ] Node.js installed (version 18 or higher) - [Download here](https://nodejs.org/)
- [ ] A text editor (VS Code recommended) - [Download here](https://code.visualstudio.com/)
- [ ] A GitHub account (optional, for deployment) - [Create one here](https://github.com/)

**How to check if Node.js is installed:**
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Type: `node --version`
3. You should see something like `v18.17.0` or higher

---

## Step 1: Create a Supabase Account

Supabase is the service that stores our data and handles user authentication.

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** (top right)
3. Sign up using:
   - GitHub (recommended - click "Continue with GitHub")
   - Or use your email address
4. Verify your email if prompted

---

## Step 2: Create a New Supabase Project

1. After logging in, click **"New project"**
2. Fill in the form:
   - **Name**: `temetra-csv-validator` (or any name you like)
   - **Database Password**: Create a strong password and **SAVE IT** somewhere safe
   - **Region**: Choose the one closest to you
   - **Pricing Plan**: Free tier is fine for testing
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

---

## Step 3: Set Up the Database

Now we need to create the database tables.

1. In your Supabase project dashboard, find the left sidebar
2. Click **"SQL Editor"** (looks like a terminal icon)
3. Click **"New query"**
4. Open the file `supabase-schema.sql` from the project folder
5. Copy ALL the contents of that file
6. Paste it into the SQL Editor
7. Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
8. You should see "Success. No rows returned" - this means it worked!

**To verify the tables were created:**
1. Click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `users`
   - `projects`
   - `validation_templates`
   - `file_uploads`
   - `activity_logs`

---

## Step 4: Configure Storage Buckets

Storage buckets hold the uploaded CSV and PDF files.

1. In the left sidebar, click **"Storage"**
2. Click **"New bucket"** and create these three buckets:

**Bucket 1:**
- Name: `csv-files`
- Public: No (leave unchecked)
- Click "Create bucket"

**Bucket 2:**
- Name: `key-files`
- Public: No (leave unchecked)
- Click "Create bucket"

**Bucket 3:**
- Name: `documentation`
- Public: Yes (check this one - so users can download docs)
- Click "Create bucket"

---

## Step 5: Get Your API Keys

1. In the left sidebar, click **"Settings"** (gear icon at the bottom)
2. Click **"API"** in the settings menu
3. You'll see two important values:

**Project URL** (copy this):
```
https://[your-project-id].supabase.co
```

**anon public key** (copy this - it's the long string):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Keep this page open - you'll need these values in the next step!**

---

## Step 6: Configure the Application

1. Open the project folder in your text editor (VS Code)
2. Find the file `.env.example` in the main folder
3. Make a copy of it and rename the copy to `.env.local`
4. Open `.env.local` and fill in your values:

```bash
# Replace with your actual Supabase URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Replace with your actual anon key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Leave the rest as-is for now
```

5. Save the file

**IMPORTANT:** Never share your `.env.local` file or commit it to GitHub!

---

## Step 7: Install Dependencies

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to the project folder:
   ```bash
   cd /path/to/temetra-csv-validator
   ```
   (Replace `/path/to/` with your actual folder path)

3. Run this command to install all required packages:
   ```bash
   npm install
   ```

4. Wait for it to finish (may take 2-5 minutes)

**If you see errors:** Try running `sudo npm install` on Mac, or run Command Prompt as Administrator on Windows.

---

## Step 8: Run the Application Locally

1. In the same Terminal window, run:
   ```bash
   npm run dev
   ```

2. You should see:
   ```
   ▲ Next.js 14.x.x
   - Local: http://localhost:3000
   ```

3. Open your web browser and go to: **http://localhost:3000**

4. You should see the login page!

**To stop the application:** Press `Ctrl+C` in the Terminal

---

## Step 9: Create Your First Admin User

Since admin accounts can't be self-created, you need to add one directly to the database.

1. Go back to your Supabase dashboard
2. Click **"SQL Editor"**
3. Run this SQL query (replace the values with your info):

```sql
-- Create the first admin user
-- Replace the email and name with your own!
INSERT INTO users (email, name, role, company_name, is_active)
VALUES (
  'your-email@example.com',  -- Change this to your email
  'Your Name',                -- Change this to your name
  'admin',
  'Vanzora, LLC',
  true
);
```

4. Click **"Run"**

**Now set up authentication:**
1. Go to **"Authentication"** in the left sidebar
2. Click **"Users"** tab
3. Click **"Add user"**
4. Enter:
   - Email: Same email you used above
   - Password: A strong password
5. Click **"Create user"**

Now you can log in with these credentials!

---

## Step 10: Deploy to Vercel

When you're ready to put the app online for others to use:

### Option A: Deploy from GitHub (Recommended)

1. Create a GitHub repository and push your code
2. Go to [https://vercel.com](https://vercel.com)
3. Sign up/login with GitHub
4. Click **"New Project"**
5. Import your GitHub repository
6. Add your environment variables:
   - Click **"Environment Variables"**
   - Add `NEXT_PUBLIC_SUPABASE_URL` and its value
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` and its value
7. Click **"Deploy"**
8. Wait 2-3 minutes for deployment
9. Your app is now live at `https://your-project.vercel.app`!

### Option B: Deploy from Terminal

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Run:
   ```bash
   vercel
   ```

3. Follow the prompts to:
   - Link to your Vercel account
   - Configure the project
   - Deploy

---

## Post-Deployment Setup

After deploying, update these settings:

### 1. Update Supabase URL Settings

1. Go to Supabase → Settings → Authentication
2. Under "URL Configuration", add your Vercel URL:
   - Site URL: `https://your-project.vercel.app`
   - Redirect URLs: `https://your-project.vercel.app/**`

### 2. Configure Email (Optional)

For sending validation result emails:

1. Get SMTP credentials from your email provider
   - Gmail: Use App Passwords (not your regular password)
   - SendGrid: Create an API key
   - Mailgun: Get SMTP credentials

2. Add these to your Vercel environment variables:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`

3. Redeploy on Vercel

---

## Troubleshooting

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### "Port 3000 is already in use"
```bash
# Use a different port
npm run dev -- -p 3001
```

### Can't connect to Supabase
1. Check that your `.env.local` file exists
2. Verify the URL and key are correct (no extra spaces)
3. Make sure your Supabase project is active

### Login not working
1. Check that the user exists in both:
   - Supabase → Authentication → Users
   - Supabase → Table Editor → users table

### Styles look wrong
```bash
# Rebuild the CSS
npm run build
npm run dev
```

---

## Getting Help

If you run into issues:

1. Check this guide again - you may have missed a step
2. Look at the browser console for errors (F12 → Console tab)
3. Check the Terminal for server errors
4. Contact your administrator or Vanzora support

---

## Quick Reference

| What | Where |
|------|-------|
| Supabase Dashboard | https://supabase.com/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Local Development | http://localhost:3000 |
| Your Live App | https://your-project.vercel.app |

---

**Good luck with your setup!**

*Copyright (c) 2024 Vanzora, LLC. All rights reserved.*
