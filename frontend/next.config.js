/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "meta-miss-master-production.up.railway.app"],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_FLW_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
  }
};

module.exports = nextConfig;
