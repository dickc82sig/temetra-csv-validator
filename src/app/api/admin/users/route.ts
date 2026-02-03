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

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { userId, action, password } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    if (action === 'send_reset_email') {
      // Look up the user's email
      const { data: userData, error: lookupError } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (lookupError || !userData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Send password reset email via Supabase Auth
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        userData.email
      );

      if (resetError) {
        console.error('Password reset email error:', resetError);
        return NextResponse.json(
          { error: `Failed to send reset email: ${resetError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Password reset email sent to ${userData.email}`,
      });
    }

    if (action === 'set_password') {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Update the user's password via Supabase Admin Auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (updateError) {
        console.error('Password update error:', updateError);
        return NextResponse.json(
          { error: `Failed to update password: ${updateError.message}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "send_reset_email" or "set_password"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
