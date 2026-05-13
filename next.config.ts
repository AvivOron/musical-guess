import type { NextConfig } from 'next';

const basePath = '/musical-guess';

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
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
