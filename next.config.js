/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const basePath = isProd ? '/stahnsdorf' : ''

const nextConfig = {
  output: isProd ? 'export' : undefined,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}
module.exports = nextConfig
