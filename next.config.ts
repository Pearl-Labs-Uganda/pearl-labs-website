import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/internship",
        destination: "/bootcamps",
        permanent: true,
      },
      // Temporary: bootcamp page hidden while the aerospace bootcamp lives on kate-d.com.
      // Remove this entry to bring /bootcamps back.
      {
        source: "/bootcamps",
        destination: "https://kate-d.com/bootcamps/aerospace/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
