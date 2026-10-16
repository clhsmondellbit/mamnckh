import type { NextConfig } from 'next';
module.exports = {
  allowedDevOrigins: ['test.quangtrioj.edu.vn'],
}
const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: process.cwd(),
  experimental: {
    useTypeScriptCli: false,
  },
};

export default nextConfig;
