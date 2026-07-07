import db from '../src/lib/db'

async function updateSnakeBanner() {
  try {
    await db.game.update({
      where: { slug: 'snake-game' },
      data: {
        bannerUrl: '/game-files/snake-game/banner.jpg',
        thumbnailUrl: '/game-files/snake-game/banner.jpg',
      }
    })
    console.log('✅ Updated Spike Snake banner and thumbnail to use the generated banner image')
  } catch (e: any) {
    console.error('❌ Error:', e.message)
  } finally {
    await db.$disconnect()
  }
}

updateSnakeBanner()
