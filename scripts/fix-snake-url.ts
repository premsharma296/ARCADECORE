import db from '../src/lib/db'

async function fixSnakeUrl() {
  try {
    await db.game.update({
      where: { slug: 'snake-game' },
      data: {
        iframeUrl: '/game-files/snake-game/index.html'
      }
    })
    console.log('✅ Updated iframeUrl to /game-files/snake-game/index.html')
  } catch (e: any) {
    console.error('❌ Error:', e.message)
  } finally {
    await db.$disconnect()
  }
}

fixSnakeUrl()
