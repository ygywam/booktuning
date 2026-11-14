/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => {
    return `build-v4.4.6-${Date.now()}`;
  },
};

module.exports = nextConfig;
