/**
 * Help Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page provides documentation and help for using the application.
 * It covers all tasks users might need to perform.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Upload,
  FileText,
  Users,
  Settings,
  Shield,
  Mail,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowLeft,
} from 'lucide-react';
import Header from '@/components/ui/Header';

// Help topics organized by category
const helpTopics = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: HelpCircle,
    articles: [
      {
        id: 'what-is-temetra',
        title: 'What is Temetra CSV Validator?',
        content: `
Temetra CSV Validator is a web application that helps developers validate their CSV files before importing them into the Temetra system. It checks your data against predefined rules to ensure everything is formatted correctly.

**Key Features:**
- Instant validation of CSV files
- Detailed error reports showing exactly what needs to be fixed
- Email notifications when validation is complete
- Support for multiple file formats (NewNetworkUpload, Reads.csv, etc.)
- Project-based organization for different customers

**Who Uses This Tool:**
- **Developers**: Upload and validate CSV files
- **End Customers**: View validation results for their project
- **Admins**: Manage projects, users, and validation rules
        `,
      },
      {
        id: 'creating-account',
        title: 'Creating an Account',
        content: `
To create a new account:

1. Click the **Create a new account** link on the login page
2. Fill in your information:
   - Full Name
   - Email Address (this will be your username)
   - Company Name (optional)
   - Phone Number (optional)
   - Select your role (Developer or End Customer)
3. Create a strong password that meets our security requirements
4. Complete the verification check
5. Click **Create Account**

**Note:** Admin accounts cannot be self-created. Only existing admins can create new admin accounts.

**After Signup:**
You'll need to wait for an administrator to assign you to a project before you can upload files. You'll receive an email notification once your account is activated.
        `,
      },
      {
        id: 'password-requirements',
        title: 'Password Requirements',
        content: `
We use Microsoft-style password complexity rules to keep your account secure:

**Your password must have:**
- At least 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;':",.<>?)

**Tips for Creating a Strong Password:**
- Use a passphrase (e.g., "MyDog!Likes2RunFast")
- Don't use personal information (birthdays, names)
- Don't reuse passwords from other websites
- Consider using a password manager
        `,
      },
    ],
  },
  {
    id: 'developers',
    title: 'For Developers',
    icon: Upload,
    articles: [
      {
        id: 'uploading-files',
        title: 'Uploading CSV Files',
        content: `
**To upload a CSV file for validation:**

1. Go to the **Developer** page (after logging in)
2. Drag and drop your CSV file into the upload area, or click to browse
3. Wait for the file to be processed
4. Click **Preview & Validate** to see the results

**File Requirements:**
- Must be a valid CSV file (.csv extension)
- Maximum file size: 10MB
- Must contain a header row with column names
- Must match the expected column format for your project

**After Uploading:**
- Review any errors shown in the validation results
- Fix issues in your original file
- Re-upload to verify fixes
- Once valid, click **Submit for Review**
        `,
      },
      {
        id: 'understanding-errors',
        title: 'Understanding Validation Errors',
        content: `
When validation finds issues, you'll see them organized by type:

**Error Types:**

🔴 **Required Field Empty**
The column is marked as required but has no value.
*Fix: Add a value to the empty cell*

🔴 **Unique Value Violation**
A value appears more than once in a column that requires unique values.
*Fix: Make sure each value is different*

🔴 **Character Limit Exceeded**
The value is too long for the column's maximum length.
*Fix: Shorten the value*

🔴 **Invalid Data Type**
The value doesn't match the expected format (e.g., text in a number field).
*Fix: Correct the value format*

⚠️ **Warnings**
These won't prevent submission but may indicate potential issues.
*Review: Check if the values are intentional*

**Pro Tip:** Click on any error to see the documentation notes for that column, which explain exactly what format is expected.
        `,
      },
      {
        id: 'email-notifications',
        title: 'Email Notifications',
        content: `
After submitting a file, you'll receive an email with the validation results.

**The email includes:**
- A summary of the validation (passed/failed)
- Total number of errors and warnings
- A link to download the full validation report
- Instructions for fixing common issues

**Adding Additional Recipients:**
When uploading, you can add additional email addresses to receive copies of the validation results. This is useful for notifying team members or managers.

1. In the upload form, find "Additional Email Recipients"
2. Enter an email address
3. Click the + button to add it
4. Add as many as needed
5. All recipients will be logged for audit purposes
        `,
      },
      {
        id: 'download-template',
        title: 'Downloading the Template',
        content: `
You can download a template file with the expected format:

1. On the Developer page, click **Download Template**
2. A CSV file will download with all required column headers
3. Use this as a starting point for your data
4. Fill in your data following the column specifications
5. Upload for validation when ready

**Viewing Format Specifications:**
Click **See Format Spec** to view detailed documentation about each column, including:
- Whether it's required or optional
- Maximum character length
- Expected data format
- Example values
- Notes and special rules
        `,
      },
    ],
  },
  {
    id: 'admins',
    title: 'For Administrators',
    icon: Shield,
    articles: [
      {
        id: 'managing-projects',
        title: 'Managing Projects',
        content: `
**Creating a New Project:**

1. Go to **Admin Dashboard** → **Projects**
2. Click **New Project**
3. Fill in the project details:
   - Project Name (e.g., "Acme Water Company")
   - Description
   - Admin Email (for notifications)
   - Validation Template to use
4. Configure settings:
   - Enable/disable upload alerts
5. Click **Create Project**

**The project will have:**
- A unique public link for developers to use
- Its own upload history and logs
- Assigned users who can access it

**Editing a Project:**
1. Go to **Projects**
2. Click the menu (⋮) on the project card
3. Select **Edit Project**
4. Make changes and save
        `,
      },
      {
        id: 'managing-users',
        title: 'Managing Users',
        content: `
**Adding a New User:**

1. Go to **Admin Dashboard** → **Users**
2. Click **Add User**
3. Enter their information:
   - Name and Email
   - Role (Developer, End Customer, or Admin)
   - Assign to a Project
4. Click **Create User**

The user will receive an email with login instructions.

**User Roles:**
- **Admin**: Full access to everything
- **Developer**: Can upload CSVs for assigned project
- **End Customer**: Can view validation results for assigned project

**Deactivating a User:**
1. Find the user in the list
2. Click the menu (⋮)
3. Select **Deactivate**
(The user won't be deleted, just disabled)
        `,
      },
      {
        id: 'validation-templates',
        title: 'Validation Templates',
        content: `
Templates define the rules for validating CSV files.

**Viewing/Editing Templates:**

1. Go to **Admin Dashboard** → **Templates**
2. Click on a template to expand it
3. Double-click or right-click any column to edit its rules

**You can configure for each column:**
- Required or Optional
- Must be Unique
- Allow Blank Values
- Maximum Character Length
- Data Type (Text, Number, Boolean, Date)
- Invalid Characters
- Notes for developers

**Color Codes:**
- 🔴 Red: Required field
- 🟣 Purple: Must be unique
- 🟡 Yellow: Has character limit
- 🟢 Green: Optional field

**Creating a New Template:**
1. Click **New Template**
2. Upload a key CSV file with example data
3. The system will suggest rules based on the data
4. Review and adjust the rules
5. Save with a name for later use
        `,
      },
      {
        id: 'viewing-logs',
        title: 'Viewing Upload Logs',
        content: `
**To view all uploads:**

1. Go to **Admin Dashboard** → **Logs**
2. You'll see all uploads across all projects

**Filter Options:**
- By Project
- By Status (Valid/Invalid/Pending)
- By Date Range
- By Uploader

**For each upload, you can see:**
- File name and size
- Who uploaded it and when
- Validation status
- Number of errors/warnings
- Additional email recipients
- IP address and browser info

**Downloading Files:**
Click on any upload to download:
- The original CSV file
- The validation report
- Error details in CSV format
        `,
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: Settings,
    articles: [
      {
        id: 'common-errors',
        title: 'Common Errors and Solutions',
        content: `
**"File is too large"**
- Maximum file size is 10MB
- Solution: Split your data into smaller files

**"Invalid file type"**
- Only CSV files are accepted
- Solution: Save your Excel file as CSV

**"Column headers don't match"**
- The first row must contain exact column names
- Solution: Download the template and copy column headers exactly

**"Encoding error"**
- File might have special characters the system can't read
- Solution: Save the CSV with UTF-8 encoding

**"Session expired"**
- You've been logged out due to inactivity
- Solution: Log in again and re-upload

**"Access denied"**
- You don't have permission for this project
- Solution: Contact your administrator to check your assignment
        `,
      },
      {
        id: 'contact-support',
        title: 'Contact Support',
        content: `
If you need help that isn't covered in this documentation:

**For Technical Issues:**
Contact your organization's administrator first.

**For Account Issues:**
- Forgot password: Use the "Forgot password?" link on login
- Account access: Contact your administrator

**For System Issues:**
Report bugs or feature requests to your Temetra account representative.

**When Reporting an Issue, Include:**
- What you were trying to do
- What error message you saw
- Your browser and operating system
- Screenshots if possible
        `,
      },
    ],
  },
];

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>('getting-started');
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  // Filter articles by search term
  const searchResults = searchTerm
    ? helpTopics.flatMap(topic =>
        topic.articles.filter(
          article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.content.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(article => ({ ...article, topicId: topic.id, topicTitle: topic.title }))
      )
    : [];

  // Find the currently selected article
  const currentArticle = selectedArticle
    ? helpTopics.flatMap(t => t.articles).find(a => a.id === selectedArticle)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="mt-2 text-gray-600">
            Find answers and learn how to use Temetra CSV Validator
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-temetra-blue-500 focus:border-temetra-blue-500"
            />
          </div>

          {/* Search results */}
          {searchTerm && searchResults.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border shadow-sm">
              {searchResults.map(result => (
                <button
                  key={result.id}
                  onClick={() => {
                    setSelectedArticle(result.id);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                >
                  <p className="font-medium text-gray-900">{result.title}</p>
                  <p className="text-sm text-gray-500">{result.topicTitle}</p>
                </button>
              ))}
            </div>
          )}

          {searchTerm && searchResults.length === 0 && (
            <p className="mt-4 text-center text-gray-500">No results found for &quot;{searchTerm}&quot;</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            <nav className="card sticky top-8">
              {helpTopics.map(topic => {
                const Icon = topic.icon;
                return (
                  <div key={topic.id} className="mb-4 last:mb-0">
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                      className="w-full flex items-center justify-between text-left py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-temetra-blue-600" />
                        <span className="font-medium text-gray-900">{topic.title}</span>
                      </div>
                      {expandedTopic === topic.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {expandedTopic === topic.id && (
                      <div className="ml-7 mt-1 space-y-1">
                        {topic.articles.map(article => (
                          <button
                            key={article.id}
                            onClick={() => setSelectedArticle(article.id)}
                            className={`w-full text-left px-3 py-2 rounded text-sm ${
                              selectedArticle === article.id
                                ? 'bg-temetra-blue-50 text-temetra-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {article.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Content area */}
          <div className="lg:col-span-3">
            {currentArticle ? (
              <div className="card">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to topics
                </button>

                <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentArticle.title}</h2>

                <div className="prose prose-gray max-w-none">
                  {/* Render markdown-like content */}
                  {currentArticle.content.split('\n').map((line, i) => {
                    if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold mt-4">{line.slice(2, -2)}</p>;
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4">{line.slice(2)}</li>;
                    }
                    if (line.startsWith('*') && line.endsWith('*')) {
                      return <p key={i} className="italic text-gray-600">{line.slice(1, -1)}</p>;
                    }
                    if (line.trim() === '') {
                      return <br key={i} />;
                    }
                    return <p key={i} className="my-2">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              // Default view showing topic cards
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {helpTopics.map(topic => {
                  const Icon = topic.icon;
                  return (
                    <div
                      key={topic.id}
                      className="card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setExpandedTopic(topic.id);
                        setSelectedArticle(topic.articles[0].id);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-temetra-blue-100 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-temetra-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {topic.articles.slice(0, 3).map(article => (
                          <li key={article.id}>• {article.title}</li>
                        ))}
                        {topic.articles.length > 3 && (
                          <li className="text-temetra-blue-600">+ {topic.articles.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
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
