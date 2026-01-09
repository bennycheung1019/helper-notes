/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: require("next-pwa/cache"),
  fallbacks: {
    document: "/fallback.html",
  },
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  turbopack: {}, // ✅ 可選：避免 Next 16 再提示
};

module.exports = withPWA(nextConfig);