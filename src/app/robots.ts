import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/'],
    },
    sitemap: [
      'https://arcadecore.in/sitemap.xml',
      'https://arcadecore.in/sitemap-images.xml',
      'https://arcadecore.in/sitemap-videos.xml'
    ],
  }
}
