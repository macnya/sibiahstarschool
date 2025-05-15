
import type { NextConfig } from 'next';

const WORKSTATIONS_DOMAIN = "3000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev";

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
    WORKSTATIONS_DOMAIN, // Try without scheme
    `https://${WORKSTATIONS_DOMAIN}`, // Keep with HTTPS as well
  ],
};

export default config;
