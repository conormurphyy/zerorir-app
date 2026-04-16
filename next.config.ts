import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/~offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https?.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "http-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);
