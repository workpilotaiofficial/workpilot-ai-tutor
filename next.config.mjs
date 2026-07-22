const apiUpstreamUrl = (process.env.API_UPSTREAM_URL ?? 'https://tutor-ai.up.railway.app').replace(/\/+$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiUpstreamUrl}/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ]
  },
}

export default nextConfig
