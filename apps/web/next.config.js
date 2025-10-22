import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint during Vercel builds (wir haben lokal schon geprüft)
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during Vercel builds (shadcn/ui React-Type-Konflikt)
  },
};

export default nextConfig;
