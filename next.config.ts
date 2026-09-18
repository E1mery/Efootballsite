import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    cpus: 1,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/teams",
        destination: "/standings",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
