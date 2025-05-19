
import type { NextConfig } from 'next';

// This should be the hostname your browser uses to access the Next.js app
// and the one that appeared in previous "Blocked cross-origin request" server warnings.
const cloudWorkstationHost_3000 = "3000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev";
// const cloudWorkstationHost_4000 = "4000-firebase-studio-1747199218566.cluster-6vyo4gb53jczovun3dxslzjahs.cloudworkstations.dev"; // For Firebase Emulator UI if needed

const config: NextConfig = {
  output: 'standalone', // Recommended for App Hosting / Cloud Run
  typescript: {
    ignoreBuildErrors: false, // Set to false for production builds
  },
  eslint: {
    ignoreDuringBuilds: false, // Set to false for production builds
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
  // to accept HMR WebSocket connections from these origins.
  // This is primarily for local development proxying scenarios.
  // For production rollouts, this setting is less relevant.
  allowedDevOrigins: [
     `https://${cloudWorkstationHost_3000}`,
     cloudWorkstationHost_3000, // Without scheme
    //  `https://${cloudWorkstationHost_4000}`, // If Firebase Emulator UI needs to connect for HMR (unlikely for main app HMR)
    //  cloudWorkstationHost_4000,
  ],
};

export default config;
