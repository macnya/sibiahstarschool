import type { NextConfig } from 'next';

const config: NextConfig = {
  // REQUIRED for cPanel/Passenger. Produces .next/standalone/server.js,
  // a self-contained Node server with only the dependencies it needs.
  output: 'standalone',

  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'zssukotccfkketryembq.supabase.co',
        pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default config;