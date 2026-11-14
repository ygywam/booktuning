/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return `build-v4.5.0-${Date.now()}`;
  },
};

module.exports = nextConfig;
