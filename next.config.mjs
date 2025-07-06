/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  // Remova o comentário da linha abaixo se o site não estiver na raiz do domínio
  // basePath: '/luirdi.github.io',
}

export default nextConfig
