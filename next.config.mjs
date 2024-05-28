/** @type {import('next').NextConfig} */
import withSerwistInit from "@serwist/next";
import path from "path";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-leaflet-cluster"],
  productionBrowserSourceMaps: true,
  webpack: (
    config,
    { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack },
  ) => {
    if (dev) {
      config.watchOptions = {
        followSymlinks: true,
      };

      config.snapshot.managedPaths = [];
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      react: "/node_modules/react",
      "react-dom": "/node_modules/react-dom",
    };

    return config;
  },
};

export default withSerwist({
  ...nextConfig,
});
