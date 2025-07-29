/**
 * Next.js Configuration File
 * 
 * This file configures the behavior of your Next.js application.
 * Common configuration options include:
 * - Environment variables
 * - Build settings
 * - Redirects and rewrites
 * - Image optimization settings
 * - Internationalization
 * - Custom webpack configuration
 * - And more...
 * 
 * The configuration is exported as a JavaScript object and is used by Next.js
 * during development and build time.
 */

import type { NextConfig } from "next";

// Define the Next.js configuration
const nextConfig: NextConfig = {
  // Enable React strict mode for development
  reactStrictMode: true,
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  compress: true, // Enable gzip compression
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },
  
  // Environment variable validation (development only)
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization settings
  images: {
    domains: [],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
