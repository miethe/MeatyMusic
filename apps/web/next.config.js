const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // Enable App Router (default in Next.js 14) and OpenTelemetry instrumentation
  experimental: {
    instrumentationHook: true,
  },

  // Transpile workspace packages
  transpilePackages: ['@meatymusic/ui', '@meatymusic/tokens'],

  // TypeScript configuration
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Temporarily ignore during builds - ESLint config has conflicting import/order rules
    // TODO: Fix ESLint import order configuration
    ignoreDuringBuilds: true,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
    NEXT_PUBLIC_APP_NAME: 'MeatyMusic',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  },

  // Images configuration (if needed)
  images: {
    domains: [],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: '__clerk_db_jwt',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
