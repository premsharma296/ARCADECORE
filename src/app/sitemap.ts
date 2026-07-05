import { MetadataRoute } from 'next'
import { getFullMockCatalog } from '@/lib/fallback-data'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://arcadecore.com'
  
  // Define categories array
  const categories = [
    'racing', 'arcade', 'action', 'shooting', 'puzzle', 'sports', 
    'strategy', 'idle', 'simulation', 'multiplayer', 'adventure',
    'io-games', 'educational', 'kids', 'board-games', 'card-games'
  ]
  
  const catUrls = categories.map(cat => ({
    url: `${baseUrl}/categories/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Fetch dynamic game pages
  const catalog = getFullMockCatalog()
  const gameUrls = catalog.map(game => ({
    url: `${baseUrl}/games/${game.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Dynamic tags
  const tags = ['retro', 'neon', 'phaser', 'html5', 'webgl', 'physics', 'clicker', 'infinite', 'sci-fi', 'pixel-art', 'survival', 'casual']
  const tagUrls = tags.map(tag => ({
    url: `${baseUrl}/tags/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Dynamic developers
  const developers = ['arcadecore-studios', 'neon-devs', 'pixel-craft', 'phaser-master']
  const devUrls = developers.map(dev => ({
    url: `${baseUrl}/developers/${dev}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Curated collections
  const collections = ['best-retro-games', 'cyber-neon-classics', 'casual-time-killers']
  const collectionUrls = collections.map(col => ({
    url: `${baseUrl}/collections/${col}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rewards`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    },
    ...catUrls,
    ...gameUrls,
    ...tagUrls,
    ...devUrls,
    ...collectionUrls
  ]
}
