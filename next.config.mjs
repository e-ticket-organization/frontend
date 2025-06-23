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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backend-3ih2.onrender.com';
      console.log('API URL:', apiUrl);
      
      // Видаляємо зайві слеші з API URL
      const cleanApiUrl = apiUrl.replace(/\/+$/, '');
      
      return [
          {
              source: '/api/:path*',
              destination: `${cleanApiUrl}/api/:path*`
          },
          {
              source: '/actors/:path*',
              destination: `${cleanApiUrl}/actors/:path*`
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
                  { key: 'Access-Control-Allow-Methods', value: 'GET, DELETE, PATCH, POST, PUT, OPTIONS' },
                  { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
              ],
          },
      ];
  }
};

export default nextConfig;
