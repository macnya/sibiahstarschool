
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
  // allowedDevOrigins was commented out to simplify production build config.
  // For local development, if cross-origin issues reappear with HMR,
  // you might need to re-add or adjust this, but it's unlikely to be the
  // cause of "Cannot find module" errors related to build artifacts.
  // allowedDevOrigins: [
  //    `https://${cloudWorkstationHost_3000}`,
  //    cloudWorkstationHost_3000, // Without scheme
  // ],
};

export default config;
