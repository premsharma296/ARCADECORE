import { NextResponse } from 'next/server'
import { getFullMockCatalog } from '@/lib/fallback-data'

export async function GET() {
  const baseUrl = 'https://arcadecore.com'
  const catalog = getFullMockCatalog()

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n'

  for (const game of catalog) {
    xml += '  <url>\n'
    xml += `    <loc>${baseUrl}/games/${game.slug}</loc>\n`
    xml += '    <video:video>\n'
    xml += `      <video:thumbnail_loc>${game.thumbnailUrl}</video:thumbnail_loc>\n`
    xml += `      <video:title>${game.title.replace(/&/g, '&amp;')} Gameplay Walkthrough</video:title>\n`
    xml += `      <video:description>Watch instructions and gameplay trailers for ${game.title.replace(/&/g, '&amp;')}. Play free instantly on ArcadeCore.</video:description>\n`
    // Mock video container URL for sitemap compliance
    xml += `      <video:content_loc>${baseUrl}/videos/${game.slug}.mp4</video:content_loc>\n`
    xml += `      <video:player_loc>${baseUrl}/games/${game.slug}</video:player_loc>\n`
    xml += '    </video:video>\n'
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
