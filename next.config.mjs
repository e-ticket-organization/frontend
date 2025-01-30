/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ігноруємо помилки під час білду
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/api/:path*'
      },
      {
        source: '/actors/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL + '/actors/:path*'
      }
    ];
  },

  // Ваші налаштування CORS
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Налаштування для Netlify
  images: {
    unoptimized: true
  },
  output: 'standalone'
};

export default nextConfig;
