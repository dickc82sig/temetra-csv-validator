/**
 * Landing Page (Login)
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the first page users see - a welcoming login screen.
 * It has a nice background and clean login form.
 */

'use client'; // This makes the component interactive (can handle clicks, etc.)

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, LogIn, UserPlus, HelpCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  // Form state - tracks what the user types
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle the login form submission
   * Tries Supabase auth first, then falls back to demo credentials
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page refresh
    setError(''); // Clear any previous errors
    setIsLoading(true); // Show loading state

    try {
      // OPTION 1: Check demo credentials first (for testing)
      if (email === 'admin@demo.com' && password === 'Demo123!@#') {
        window.location.href = '/admin';
        return;
      }
      if (email === 'dev@demo.com' && password === 'Demo123!@#') {
        window.location.href = '/developer';
        return;
      }

      // OPTION 2: Try Supabase authentication
      console.log('Attempting Supabase login for:', email);
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase response:', { data, error: authError });

      if (authError) {
        // If Supabase fails, show the actual error message
        console.error('Auth error:', authError);
        setError(`Login failed: ${authError.message}. You can also use demo accounts (admin@demo.com / Demo123!@#)`);
        return;
      }

      if (data.user) {
        // Get user role from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', email)
          .single();

        // Redirect based on role (default to admin if not found)
        if (userData?.role === 'developer') {
          window.location.href = '/developer';
        } else {
          window.location.href = '/admin';
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex">
      {/*
        LEFT SIDE - Decorative background with branding
        This creates a welcoming visual on larger screens
      */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-temetra-blue-600 via-temetra-blue-700 to-temetra-blue-900 p-12 flex-col justify-between">
        {/* Top section with logo/branding */}
        <div>
          <h1 className="text-white text-3xl font-bold">Temetra CSV Validator</h1>
          <p className="text-temetra-blue-200 mt-2">Ensuring data quality for utility metering</p>
        </div>

        {/* Middle section with feature highlights */}
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Instant Validation</h3>
              <p className="text-temetra-blue-200 text-sm">Upload your CSV and get instant feedback on data quality issues</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Custom Rules</h3>
              <p className="text-temetra-blue-200 text-sm">Configure validation rules specific to your data requirements</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Email Reports</h3>
              <p className="text-temetra-blue-200 text-sm">Automatically send validation results to your team</p>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="text-temetra-blue-300 text-sm">
          <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
        </div>
      </div>

      {/*
        RIGHT SIDE - Login form
        This is where users enter their credentials
      */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-gray-50">
        {/* Mobile header (shows on small screens) */}
        <div className="lg:hidden mb-8">
          <h1 className="text-temetra-blue-600 text-2xl font-bold">Temetra CSV Validator</h1>
          <p className="text-gray-500 mt-1">Ensuring data quality for utility metering</p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Login header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Or{' '}
              <Link href="/signup" className="text-temetra-blue-600 hover:text-temetra-blue-500 font-medium">
                create a new account
              </Link>
            </p>
          </div>

          {/* Error message (shows when login fails) */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="you@company.com"
              />
            </div>

            {/* Password field with show/hide toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                />
                {/* Toggle password visibility button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-temetra-blue-600 focus:ring-temetra-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link href="/forgot-password" className="text-sm text-temetra-blue-600 hover:text-temetra-blue-500">
                Forgot password?
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Quick links */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-center space-x-6 text-sm">
              <Link href="/help" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <HelpCircle className="h-4 w-4" />
                Help
              </Link>
              <Link href="/about" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                <Info className="h-4 w-4" />
                About
              </Link>
            </div>
          </div>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Demo Accounts Available:</strong><br />
              Admin: admin@demo.com<br />
              Developer: dev@demo.com<br />
              Password: Demo123!@#
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden mt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Vanzora, LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
