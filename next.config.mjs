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
  // Adicione esta linha se o repositório não estiver na raiz do domínio
  // basePath: '/nome-do-repositorio',
}

export default nextConfig
