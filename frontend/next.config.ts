import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  webpack: (config) => {
    // Required for snarkjs — it uses Node built-ins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      readline: false,
      path: false,
      crypto: false,
    };
    // Allow snarkjs WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
