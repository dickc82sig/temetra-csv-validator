/**
 * Next.js Configuration
 * Copyright (c) 2024 Vanzora, LLC. All rights reserved.
 *
 * This configures the Next.js framework settings.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  // Allow images from Supabase storage
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
