import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@surveyos/shared'],
  poweredByHeader: false,
  typedRoutes: true,
};

export default nextConfig;
