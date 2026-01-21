/**
 * Password Utilities
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file handles password validation using Microsoft-style complexity rules.
 * It ensures users create strong, secure passwords.
 *
 * PASSWORD REQUIREMENTS (Microsoft-style):
 * - At least 12 characters long
 * - Contains at least one uppercase letter (A-Z)
 * - Contains at least one lowercase letter (a-z)
 * - Contains at least one number (0-9)
 * - Contains at least one special character (!@#$%^&* etc.)
 */

import { PasswordValidation } from '@/types';

/**
 * Validate a password against Microsoft-style complexity rules
 *
 * @param password - The password to check
 * @returns An object showing which rules pass/fail
 */
export function validatePassword(password: string): PasswordValidation {
  // Check each requirement individually
  const minLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // All requirements must pass for the password to be valid
  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;

  return {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    isValid,
  };
}

/**
 * Get a human-readable list of what's wrong with a password
 *
 * @param validation - The result from validatePassword()
 * @returns Array of error messages
 */
export function getPasswordErrors(validation: PasswordValidation): string[] {
  const errors: string[] = [];

  if (!validation.minLength) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!validation.hasUppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!validation.hasLowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!validation.hasNumber) {
    errors.push('Password must contain at least one number (0-9)');
  }
  if (!validation.hasSpecial) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return errors;
}

/**
 * Generate a password strength indicator (for UI display)
 *
 * @param validation - The result from validatePassword()
 * @returns A strength level from 0-5
 */
export function getPasswordStrength(validation: PasswordValidation): number {
  let strength = 0;

  if (validation.minLength) strength++;
  if (validation.hasUppercase) strength++;
  if (validation.hasLowercase) strength++;
  if (validation.hasNumber) strength++;
  if (validation.hasSpecial) strength++;

  return strength;
}

/**
 * Get a color for the password strength indicator
 *
 * @param strength - Number from 0-5
 * @returns Tailwind CSS color class
 */
export function getPasswordStrengthColor(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return 'bg-red-500';      // Very weak
    case 2:
      return 'bg-orange-500';   // Weak
    case 3:
      return 'bg-yellow-500';   // Medium
    case 4:
      return 'bg-lime-500';     // Good
    case 5:
      return 'bg-green-500';    // Strong
    default:
      return 'bg-gray-300';
  }
}

/**
 * Get a label for the password strength
 *
 * @param strength - Number from 0-5
 * @returns Human-readable strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Medium';
    case 4:
      return 'Good';
    case 5:
      return 'Strong';
    default:
      return '';
  }
}
