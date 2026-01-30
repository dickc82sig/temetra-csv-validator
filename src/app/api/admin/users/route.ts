/**
 * Admin Users API Route
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * Creates users in both Supabase Auth and the users table.
 * Requires SUPABASE_SERVICE_ROLE_KEY for admin operations.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { name, email, password, role, company_name } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'A user with this email already exists in authentication' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 400 }
      );
    }

    // Step 2: Create user in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use the same ID from auth
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role || 'developer',
        company_name: company_name?.trim() || null,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.error('User table insertion error:', userError);
      // If users table insert fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      if (userError.code === '23505') {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: `Failed to create user record: ${userError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userData,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
