/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Transpile api package
  transpilePackages: ['@codebase-wiki/api'],
}

module.exports = nextConfig
