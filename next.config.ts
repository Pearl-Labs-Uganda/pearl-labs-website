import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/internship",
        destination: "/bootcamps",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
