/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.kabum.com.br' },
      { protocol: 'https', hostname: 'static.kabum.com.br' },
      { protocol: 'https', hostname: 'img.terabyteshop.com.br' },
      { protocol: 'https', hostname: 'media.pichau.com.br' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'http2.mlstatic.com' },
      { protocol: 'https', hostname: 'placehold.co' },
    ],
  },
};

export default nextConfig;
