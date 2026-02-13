/** @type {import('next').NextConfig} */
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
}

export default nextConfig
