import db from '../src/lib/db'

async function boostSnakeGame() {
  try {
    await db.game.update({
      where: { slug: 'snake-game' },
      data: {
        playCount: 189420,
        rating: 4.9,
        isFeatured: true,
      }
    })
    console.log('✅ Spike Snake boosted — playCount: 189,420 | rating: 4.9 | featured: true')
  } catch (e: any) {
    console.error('❌ Error:', e.message)
  } finally {
    await db.$disconnect()
  }
}

boostSnakeGame()
