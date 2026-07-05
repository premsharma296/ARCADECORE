import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/'],
    },
    sitemap: [
      'https://arcadecore.com/sitemap.xml',
      'https://arcadecore.com/sitemap-images.xml',
      'https://arcadecore.com/sitemap-videos.xml'
    ],
  }
}
