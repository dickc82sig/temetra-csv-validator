/**
 * Tailwind CSS Configuration
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This file configures the styling framework for the Temetra CSV Validation Tool.
 * Tailwind CSS is a utility-first CSS framework that makes styling easier.
 */
import type { Config } from 'tailwindcss'

const config: Config = {
  // These are the folders where Tailwind will look for class names to include
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Custom colors for the Temetra brand
      colors: {
        // Primary brand colors
        'temetra-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Validation result colors
        'validation': {
          'success': '#22c55e',  // Green for valid
          'error': '#ef4444',    // Red for errors
          'warning': '#f59e0b',  // Yellow for warnings
          'info': '#3b82f6',     // Blue for info
        },
        // Rule type colors (for the visual editor)
        'rule': {
          'required': '#dc2626',     // Red - field is required
          'optional': '#22c55e',     // Green - field is optional
          'unique': '#8b5cf6',       // Purple - must be unique
          'character-limit': '#f59e0b', // Yellow - has character limit
          'pattern': '#06b6d4',      // Cyan - has pattern/format
        }
      },
      // Custom background for the login page
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'login-pattern': "url('/images/login-bg.svg')",
      },
    },
  },
  plugins: [],
}
export default config
