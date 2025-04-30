/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  trailingSlash: true,
  async rewrites() {
      return [
          {
              source: '/api/:path*',
              destination: 'https://backend-3ih2.onrender.com/api/:path*'
          },
          {
              source: '/actors/:path*',
              destination: 'https://backend-3ih2.onrender.com/actors/:path*'
          }
      ];
  },
  //  налаштування CORS 
  async headers() {
      return [
          {
              source: '/:path*',
              headers: [
                  { key: 'Access-Control-Allow-Credentials', value: 'true' },
                  { key: 'Access-Control-Allow-Origin', value: '*' },
                  { key: 'Access-Control-Allow-Methods', value: 'GET, DELETE, PATCH, POST, PUT' },
                  { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
              ],
          },
      ];
  }
};

export default nextConfig;
