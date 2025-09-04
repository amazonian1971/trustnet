/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Critical setting - ignores ESLint errors during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Critical setting - ignores TypeScript type errors during production builds
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig;