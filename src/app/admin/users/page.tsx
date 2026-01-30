/**
 * Admin Users Management Page
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Allows admins to manage all users in the system.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Shield,
  User,
  Building,
  UserCheck,
  UserX,
  Loader2,
  X,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import { formatDate, isAlex } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'end_customer';
  company_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  assigned_project_id: string | null;
}

const roleLabels = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  developer: { label: 'Developer', color: 'bg-blue-100 text-blue-800' },
  end_customer: { label: 'End Customer', color: 'bg-green-100 text-green-800' },
};

export default function AdminUsersPage() {
  // Data state
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // UI state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'developer' as 'admin' | 'developer' | 'end_customer',
    company_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load users from Supabase
   */
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        // Use empty array if error
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  /**
   * Handle form field changes
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Add a new user (creates in both Supabase Auth and users table)
   */
  const handleAddUser = async () => {
    setFormError('');
    setFormSuccess('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call our API route to create user in both Auth and users table
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role,
          company_name: formData.company_name.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setFormError(result.error || 'Failed to create user');
        return;
      }

      // Success - show message, close modal and refresh list
      setFormSuccess(`User "${formData.name}" created successfully! They can now log in with their email and temporary password.`);
      setTimeout(() => {
        setShowAddModal(false);
        setFormData({ name: '', email: '', password: '', role: 'developer', company_name: '' });
        setFormSuccess('');
        loadUsers();
      }, 2000);
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Update an existing user
   */
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setFormError('');

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
          company_name: formData.company_name.trim() || null,
        })
        .eq('id', editingUser.id);

      if (error) {
        setFormError(`Failed to update user: ${error.message}`);
        return;
      }

      // Success - close modal and refresh list
      setShowEditModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', role: 'developer', company_name: '' });
      loadUsers();
    } catch (err) {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Toggle user active status
   */
  const handleToggleActive = async (user: UserData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) {
        alert(`Failed to update user: ${error.message}`);
        return;
      }

      loadUsers();
      setOpenMenu(null);
    } catch (err) {
      alert('An unexpected error occurred');
    }
  };

  /**
   * Delete a user
   */
  const handleDeleteUser = async (user: UserData) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (error) {
        alert(`Failed to delete user: ${error.message}`);
        return;
      }

      loadUsers();
      setOpenMenu(null);
    } catch (err) {
      alert('An unexpected error occurred');
    }
  };

  /**
   * Open edit modal for a user
   */
  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      company_name: user.company_name || '',
    });
    setFormError('');
    setShowEditModal(true);
    setOpenMenu(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn={true} userName="Admin" userRole="admin" />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-gray-600">
              Manage user accounts and permissions
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', password: '', role: 'developer', company_name: '' });
              setFormError('');
              setFormSuccess('');
              setShowPassword(false);
              setShowAddModal(true);
            }}
            className="mt-4 sm:mt-0 btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-auto"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="developer">Developers</option>
            <option value="end_customer">End Customers</option>
          </select>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="card flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading users...</span>
          </div>
        ) : (
          <>
            {/* Users table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b bg-gray-50">
                      <th className="px-6 py-3 font-medium">User</th>
                      <th className="px-6 py-3 font-medium">Role</th>
                      <th className="px-6 py-3 font-medium">Company</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Created</th>
                      <th className="px-6 py-3 font-medium sr-only">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {isAlex(user.name) ? user.name.replace(/Alex/i, 'Alexa') : user.name}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleLabels[user.role].color}`}>
                            {user.role === 'admin' && <Shield className="h-3 w-3" />}
                            {roleLabels[user.role].label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {user.company_name ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="h-4 w-4 text-gray-400" />
                              {user.company_name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                              <UserCheck className="h-4 w-4" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                              <UserX className="h-4 w-4" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                              className="p-1 rounded hover:bg-gray-100"
                            >
                              <MoreVertical className="h-5 w-5 text-gray-400" />
                            </button>

                            {openMenu === user.id && (
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-10">
                                <button
                                  onClick={() => openEditModal(user)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit User
                                </button>
                                <button
                                  onClick={() => handleToggleActive(user)}
                                  className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${user.is_active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                >
                                  {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                  {user.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <hr className="my-1" />
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete User
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-gray-500">
                    {users.length === 0 ? 'No users yet. Add your first user!' : 'No users match your search.'}
                  </p>
                </div>
              )}
            </div>

            {/* User stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="card bg-gray-50">
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="card bg-purple-50">
                <p className="text-sm text-purple-600">Admins</p>
                <p className="text-2xl font-bold text-purple-700">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="card bg-blue-50">
                <p className="text-sm text-blue-600">Developers</p>
                <p className="text-2xl font-bold text-blue-700">
                  {users.filter(u => u.role === 'developer').length}
                </p>
              </div>
              <div className="card bg-green-50">
                <p className="text-sm text-green-600">End Customers</p>
                <p className="text-2xl font-bold text-green-700">
                  {users.filter(u => u.role === 'end_customer').length}
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {formSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <span className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    Temporary Password *
                  </span>
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="input-field pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Share this password with the user so they can log in. They can change it in Settings.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                >
                  <option value="developer">Developer</option>
                  <option value="end_customer">End Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                >
                  <option value="developer">Developer</option>
                  <option value="end_customer">End Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleFormChange}
                  className="input-field mt-1"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setShowEditModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
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
