import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MiniMarket',
    short_name: 'MiniMarket',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf9f7',
    theme_color: '#1f6f5c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
