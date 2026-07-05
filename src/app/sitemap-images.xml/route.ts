import { NextResponse } from 'next/server'
import { getFullMockCatalog } from '@/lib/fallback-data'

export async function GET() {
  const baseUrl = 'https://arcadecore.com'
  const catalog = getFullMockCatalog()

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'

  for (const game of catalog) {
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}/games/${game.slug}</loc>\n`
    xml += '    <image:image>\n'
    xml += `      <image:loc>${game.thumbnailUrl}</image:loc>\n`
    xml += `      <image:title>${game.title.replace(/&/g, '&amp;')} Thumbnail</image:title>\n`
    xml += '    </image:image>\n'
    if (game.bannerUrl) {
      xml += '    <image:image>\n'
      xml += `      <image:loc>${game.bannerUrl}</image:loc>\n`
      xml += `      <image:title>${game.title.replace(/&/g, '&amp;')} Banner</image:title>\n`
      xml += '    </image:image>\n'
    }
    xml += '  </url>\n'
  }

  xml += '</urlset>'

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
