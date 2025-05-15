
import type { NextConfig } from 'next';

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  allowedDevOrigins: [
    "https://3000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev",
  ],
};

export default config;
