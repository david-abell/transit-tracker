/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-leaflet-cluster"],
  productionBrowserSourceMaps: true,
};

module.exports = nextConfig;
