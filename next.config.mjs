/** @type {import('next').NextConfig} */
import path from 'path'

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'googleapis'],
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/pg/**', './node_modules/pg-hstore/**', './node_modules/sequelize/**'],
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
}

export default nextConfig
