import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // コンパイル最適化（本番環境でconsole.logを削除）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
