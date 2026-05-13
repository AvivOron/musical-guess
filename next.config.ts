import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/musical-guess',
  images: {
    remotePatterns: [
      { hostname: 'is1-ssl.mzstatic.com' },
      { hostname: 'is2-ssl.mzstatic.com' },
      { hostname: 'is3-ssl.mzstatic.com' },
      { hostname: 'is4-ssl.mzstatic.com' },
      { hostname: 'is5-ssl.mzstatic.com' },
    ],
  },
};

export default nextConfig;
