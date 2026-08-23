/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.discogs.com" },
      { protocol: "https", hostname: "i.discogs.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
      { protocol: "https", hostname: "**.coverartarchive.org" },
    ],
  },
};

export default nextConfig;
