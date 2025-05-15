
import type { NextConfig } from 'next';

const WORKSTATIONS_DOMAIN_1 = "3000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev";
const WORKSTATIONS_DOMAIN_2 = "firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev";


const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Changed from true
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed from true
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
    `https://${WORKSTATIONS_DOMAIN_1}`,
     WORKSTATIONS_DOMAIN_1, // Without scheme
    `https://${WORKSTATIONS_DOMAIN_2}`,
     WORKSTATIONS_DOMAIN_2, // Without scheme
  ],
};

export default config;
