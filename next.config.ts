import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL || 'https://court-management-api.onrender.com';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ];
  },
  devIndicators: false,
};

export default nextConfig;
