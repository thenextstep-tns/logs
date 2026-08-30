/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  basePath: basePath,
  reactStrictMode: true,
  // Optional asset prefix if using external CDN
  assetPrefix: basePath ? `${basePath}/` : undefined,
};

export default nextConfig;
