import type { NextConfig } from 'next';

const config: NextConfig = {
  // NOTE: 'output: standalone' was removed. Render's Web Service runs
  // `npm start` (i.e. `next start`), which needs the standard .next build.
  // Standalone mode would require manually copying public/ and .next/static
  // into .next/standalone, which is unnecessary here.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      // Placeholder host used by the current sample content.
      // Remove once real images are served from Supabase Storage.
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      // Supabase Storage public bucket. Replace <project-ref> with yours.
      // { protocol: 'https', hostname: '<project-ref>.supabase.co', pathname: '/storage/v1/object/public/**' },
    ],
  },
};

export default config;
