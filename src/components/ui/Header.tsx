/**
 * Header Component
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the navigation header that appears at the top of every page.
 * It includes the logo, navigation links, and login button.
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { LogIn, LogOut, Menu, X, User, Settings, HelpCircle, Info } from 'lucide-react';
import { getGreeting, isAlex } from '@/lib/utils';

interface HeaderProps {
  // Is the user currently logged in?
  isLoggedIn?: boolean;
  // User's name (for greeting)
  userName?: string;
  // User's role (affects what links are shown)
  userRole?: 'admin' | 'developer' | 'end_customer';
}

export default function Header({ isLoggedIn = false, userName = '', userRole }: HeaderProps) {
  // State for mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and brand name */}
          <div className="flex items-center">
            <Link href={isLoggedIn ? (userRole === 'admin' ? '/admin' : '/developer') : '/'} className="flex items-center gap-2">
              {/* Simple logo icon */}
              <div className="w-8 h-8 bg-temetra-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">Temetra Validator</span>
            </Link>
          </div>

          {/* Desktop navigation links */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {/* Show different links based on login status */}
            {isLoggedIn ? (
              <>
                {/* Admin-only links */}
                {userRole === 'admin' && (
                  <>
                    <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
                      Dashboard
                    </Link>
                    <Link href="/admin/projects" className="text-sm text-gray-600 hover:text-gray-900">
                      Projects
                    </Link>
                    <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900">
                      Users
                    </Link>
                    <Link href="/admin/templates" className="text-sm text-gray-600 hover:text-gray-900">
                      Templates
                    </Link>
                  </>
                )}

                {/* Developer links */}
                {userRole === 'developer' && (
                  <>
                    <Link href="/developer" className="text-sm text-gray-600 hover:text-gray-900">
                      Upload
                    </Link>
                    <Link href="/developer/history" className="text-sm text-gray-600 hover:text-gray-900">
                      History
                    </Link>
                  </>
                )}

                {/* Common links for logged-in users */}
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Link>

                {/* User greeting and logout */}
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                  {/* Special greeting for Alex! */}
                  <span className="text-sm text-gray-600">
                    {isAlex(userName) ? (
                      <span className="text-temetra-blue-600 font-medium">Hi Alexa!</span>
                    ) : (
                      `Hi, ${userName}`
                    )}
                  </span>

                  {/* User menu dropdown could go here */}
                  <Link href="/settings" className="text-gray-400 hover:text-gray-600">
                    <Settings className="h-5 w-5" />
                  </Link>

                  <button
                    onClick={() => {
                      // TODO: Add logout logic
                      window.location.href = '/';
                    }}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Links for non-logged-in users */}
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Help
                </Link>
                <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <Link href="/" className="btn-primary flex items-center gap-1">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-gray-600"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-2">
              {isLoggedIn ? (
                <>
                  {/* Welcome message */}
                  <div className="px-2 py-2 text-sm font-medium text-gray-900">
                    {getGreeting(userName)}
                  </div>

                  {userRole === 'admin' && (
                    <>
                      <Link href="/admin" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Dashboard
                      </Link>
                      <Link href="/admin/projects" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Projects
                      </Link>
                      <Link href="/admin/users" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Users
                      </Link>
                    </>
                  )}

                  {userRole === 'developer' && (
                    <>
                      <Link href="/developer" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        Upload
                      </Link>
                      <Link href="/developer/history" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                        History
                      </Link>
                    </>
                  )}

                  <Link href="/help" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    Help
                  </Link>
                  <Link href="/settings" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    Settings
                  </Link>

                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => window.location.href = '/'}
                      className="block w-full text-left px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/help" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    Help
                  </Link>
                  <Link href="/about" className="block px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded">
                    About
                  </Link>
                  <Link href="/" className="block px-2 py-2 text-sm text-temetra-blue-600 hover:bg-blue-50 rounded font-medium">
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
