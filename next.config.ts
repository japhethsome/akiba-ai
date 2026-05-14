import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // This helps with ngrok "Invalid Host Header" issues
  experimental: {
    serverActions: {
      allowedOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "localhost:3000"]
    }
  }
};

export default nextConfig;
