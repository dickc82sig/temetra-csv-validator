/**
 * Utility Functions
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file contains helpful functions used throughout the application.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine CSS class names intelligently
 * This handles conflicts between Tailwind classes properly
 *
 * Example: cn('p-4', 'p-2') → 'p-2' (not 'p-4 p-2')
 *
 * @param inputs - CSS class names to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 *
 * @param date - Date string or Date object
 * @returns Formatted date string like "Jan 15, 2024 at 3:30 PM"
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a file size for display
 *
 * @param bytes - File size in bytes
 * @returns Human-readable size like "1.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Create a URL-friendly "slug" from a string
 *
 * @param text - The text to convert
 * @returns URL-safe string like "my-project-name"
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');     // Remove leading/trailing hyphens
}

/**
 * Generate a unique ID
 * Uses crypto.randomUUID if available, falls back to timestamp
 *
 * @returns Unique identifier string
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if a name is "Alex" (for the Easter egg!)
 * If so, we'll call them "Alexa" instead
 *
 * @param name - The user's name
 * @returns The name to display (might be "Alexa"!)
 */
export function getDisplayName(name: string): string {
  const lowerName = name.toLowerCase().trim();

  // Check for variations of "Alex"
  if (lowerName === 'alex' || lowerName === 'alexander' || lowerName === 'alexandra') {
    // Replace the first part with "Alexa"
    return 'Alexa' + name.slice(4);
  }

  return name;
}

/**
 * Check if this user should get the "Alexa" treatment
 *
 * @param name - The user's name
 * @returns True if they're an Alex
 */
export function isAlex(name: string): boolean {
  const lowerName = name.toLowerCase().trim();
  return (
    lowerName === 'alex' ||
    lowerName.startsWith('alex ') ||
    lowerName === 'alexander' ||
    lowerName === 'alexandra'
  );
}

/**
 * Get a greeting message
 * Special greeting for Alex!
 *
 * @param name - The user's name
 * @returns Greeting message
 */
export function getGreeting(name: string): string {
  if (isAlex(name)) {
    return `Hi Alexa! Welcome back.`;
  }
  return `Welcome back, ${name}!`;
}

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ... if needed
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Delay execution (useful for loading states, etc.)
 *
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Download a file from a blob
 *
 * @param blob - The file data
 * @param filename - Name for the downloaded file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert CSV text to downloadable blob
 *
 * @param csvContent - CSV text content
 * @returns Blob ready for download
 */
export function csvToBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
}
