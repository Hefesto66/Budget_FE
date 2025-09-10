
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
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
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // Adicionado para permitir o acesso a partir do ambiente de desenvolvimento em nuvem.
    allowedDevOrigins: ["https://9000-firebase-studio-1756859969016.cluster-lqzyk3r5hzdcaqv6zwm7wv6pwa.cloudworkstations.dev"],
  },
};

export default nextConfig;
