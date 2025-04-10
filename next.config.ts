import type { NextConfig } from "next";
import path from 'path';
import webpack from 'webpack'; // Make sure to import webpack

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Force browser versions
        'node:fs': false,
        'node:os': false,
        'node:path': false,
        fs: false,
        os: false,
        path: require.resolve("path-browserify"),
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        zlib: require.resolve("browserify-zlib"),
        assert: require.resolve("assert"),
        process: require.resolve("process/browser"),
        buffer: require.resolve("buffer/"),
      };
    
      // Add buffer to plugins
      if (!config.plugins) {
        config.plugins = [];
      }
      
      // Add buffer support with correct 'new' keyword for ProvidePlugin
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    return config;
  },
  // Add transpilePackages to ensure the Solana packages are correctly processed
  transpilePackages: [
    "@coral-xyz/anchor",
    "@coral-xyz/anchor-30",
    "@project-serum/anchor",
    "@drift-labs/sdk",
    "@openbook-dex/openbook-v2",
    "@solana/spl-token"
  ],
};

export default nextConfig;
