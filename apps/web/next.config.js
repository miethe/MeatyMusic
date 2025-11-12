const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker
  output: 'standalone',

  // Enable App Router (default in Next.js 14)
  experimental: {
    // Future flags can go here
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
    // Fail build on ESLint errors
    ignoreDuringBuilds: false,
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
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
