import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/apply",
        destination: "/internship/apply",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
