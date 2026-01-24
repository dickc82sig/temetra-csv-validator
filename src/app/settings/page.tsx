/**
 * Settings Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This page allows users to configure their account and application settings.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Bell,
  Lock,
  Mail,
  Palette,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();

  // User profile state
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    role: 'admin' | 'developer' | 'end_customer';
  }>({
    name: '',
    email: '',
    role: 'admin',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailOnUpload: true,
    emailOnError: true,
    dailyDigest: false,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    compactMode: false,
  });

  // Password change
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Get user profile from our users table
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (userData) {
            setProfile({
              name: userData.name || '',
              email: userData.email || user.email || '',
              role: userData.role || 'admin',
            });
          } else {
            setProfile(prev => ({
              ...prev,
              email: user.email || '',
            }));
          }
        } else {
          // Demo mode - use default values
          setProfile({
            name: 'Admin User',
            email: 'admin@demo.com',
            role: 'admin',
          });
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        // Fallback to demo values
        setProfile({
          name: 'Admin User',
          email: 'admin@demo.com',
          role: 'admin',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Save profile settings
  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          updated_at: new Date().toISOString(),
        })
        .eq('email', profile.email);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Save notification settings
  const saveNotifications = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the database
      // For now, just show success
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: 'success', text: 'Notification settings saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) throw error;

      setPasswords({ current: '', new: '', confirm: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn={true} userName="Admin" userRole="admin" />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-temetra-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName={profile.name || 'Admin'} userRole={profile.role} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {message.text}
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                    activeTab === tab.id
                      ? 'bg-temetra-blue-50 text-temetra-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content area */}
          <div className="flex-1">
            {/* Profile tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="input-field pl-10 bg-gray-50"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-sm text-gray-600 capitalize">{profile.role}</p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end">
                  <button
                    onClick={saveProfile}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Notifications tab */}
            {activeTab === 'notifications' && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Email Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">File Upload Notifications</p>
                      <p className="text-sm text-gray-500">Receive an email when a new file is uploaded</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailOnUpload}
                      onChange={(e) => setNotifications(prev => ({ ...prev, emailOnUpload: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Validation Error Alerts</p>
                      <p className="text-sm text-gray-500">Get notified when a file fails validation</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.emailOnError}
                      onChange={(e) => setNotifications(prev => ({ ...prev, emailOnError: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Daily Digest</p>
                      <p className="text-sm text-gray-500">Receive a daily summary of all uploads</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.dailyDigest}
                      onChange={(e) => setNotifications(prev => ({ ...prev, dailyDigest: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end">
                  <button
                    onClick={saveNotifications}
                    disabled={isSaving}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="card">
                  <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                        Current Password
                      </label>
                      <div className="relative mt-1">
                        <input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                        New Password
                      </label>
                      <div className="relative mt-1">
                        <input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwords.new}
                          onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                          className="input-field pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm New Password
                      </label>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className="input-field mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <button
                      onClick={changePassword}
                      disabled={isSaving || !passwords.new || !passwords.confirm}
                      className="btn-primary flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                      Change Password
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h2 className="font-semibold text-gray-900 mb-4">Session</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Sign out of your current session on this device.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Appearance tab */}
            {activeTab === 'appearance' && (
              <div className="card">
                <h2 className="font-semibold text-gray-900 mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setAppearance(prev => ({ ...prev, theme: 'light' }))}
                        className={`flex-1 p-4 border rounded-lg text-center ${
                          appearance.theme === 'light' ? 'border-temetra-blue-500 bg-temetra-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 mx-auto mb-2 bg-white border rounded shadow-sm"></div>
                        <span className="text-sm">Light</span>
                      </button>
                      <button
                        onClick={() => setAppearance(prev => ({ ...prev, theme: 'dark' }))}
                        className={`flex-1 p-4 border rounded-lg text-center ${
                          appearance.theme === 'dark' ? 'border-temetra-blue-500 bg-temetra-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 mx-auto mb-2 bg-gray-800 border rounded shadow-sm"></div>
                        <span className="text-sm">Dark</span>
                      </button>
                      <button
                        onClick={() => setAppearance(prev => ({ ...prev, theme: 'system' }))}
                        className={`flex-1 p-4 border rounded-lg text-center ${
                          appearance.theme === 'system' ? 'border-temetra-blue-500 bg-temetra-blue-50' : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-r from-white to-gray-800 border rounded shadow-sm"></div>
                        <span className="text-sm">System</span>
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Note: Dark mode is coming soon. Currently using light theme.
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium text-gray-900">Compact Mode</p>
                      <p className="text-sm text-gray-500">Use smaller spacing and text</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appearance.compactMode}
                      onChange={(e) => setAppearance(prev => ({ ...prev, compactMode: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                    />
                  </div>
                </div>
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
