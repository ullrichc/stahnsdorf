/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  output: isProd ? 'export' : undefined,
  basePath: isProd ? '/stahnsdorf' : '',
  assetPrefix: isProd ? '/stahnsdorf/' : '',
}
module.exports = nextConfig
