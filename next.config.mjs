/**
 * @type {import('next').NextConfig}
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  reactStrictMode: true,
  basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  output: 'export',
};

export default nextConfig;
