/**
 * Root Layout
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This is the main layout that wraps all pages in the application.
 * It includes the global styles and sets up the HTML structure.
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Load the Inter font (clean, modern font for UI)
const inter = Inter({ subsets: ['latin'] });

// Page metadata (shows in browser tab)
export const metadata: Metadata = {
  title: 'Temetra CSV Validation Tool',
  description: 'Validate CSV files against Temetra specifications',
  keywords: ['CSV', 'validation', 'Temetra', 'utility', 'metering'],
};

/**
 * Root Layout Component
 *
 * This wraps every page in the application.
 * It provides the basic HTML structure and loads global styles.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        {/* The main content of each page goes here */}
        {children}
      </body>
    </html>
  );
}
