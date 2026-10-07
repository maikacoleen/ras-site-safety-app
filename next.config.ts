import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["heic-convert", "libheif-js"],
};

export default nextConfig;
