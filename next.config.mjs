/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/mandarin-app',
  output: 'export',            // ← required for static export
  images: { unoptimized: true }, // ← disable Image Optimization
  trailingSlash: true,         // ← optional but avoids 404 on GH-Pages
};

export default nextConfig;
