
import type { NextConfig } from 'next';

// This should be the hostname your browser uses to access the Next.js app
// and the one that appeared in previous "Blocked cross-origin request" server warnings.
const APP_HOSTNAME_IN_WORKSTATION = "3000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev";

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
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
  // This allows the Next.js development server (running on port 3000)
  // to accept HMR WebSocket connections from this origin.
  allowedDevOrigins: [
    `https://${APP_HOSTNAME_IN_WORKSTATION}`,
     APP_HOSTNAME_IN_WORKSTATION, // Without scheme, just in case Next.js is flexible here
  ],
};

export default config;
