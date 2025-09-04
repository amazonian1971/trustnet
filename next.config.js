/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This is the key setting - ignore ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable Turbopack for faster builds (optional but recommended)
    turbo: {}
  }
};

module.exports = nextConfig;