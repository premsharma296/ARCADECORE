import db from '../src/lib/db'

async function registerSnakeGame() {
  console.log('Registering Spike Snake game in database...')

  try {
    // Check if it already exists
    const existing = await db.game.findUnique({ where: { slug: 'snake-game' } })
    if (existing) {
      console.log('Game "snake-game" already exists. Updating...')
      await db.game.update({
        where: { slug: 'snake-game' },
        data: {
          title: 'Spike Snake',
          description: 'Play Spike Snake, the ultimate glowing HTML5 multiplayer snake game with WebRTC PeerJS multiplayer, AI bots, Battle Royale shrinking modes, and vibrant spikey neon physics.',
          instructions: 'Steer your glowing neon snake around the arena. Eat energy pellets to grow longer. Avoid crashing into other snakes. Encircle opponents to eliminate them and absorb their cells!',
          controls: 'Mouse: Steer direction\nLeft Click / Space: Speed Boost\nESC: Pause',
          iframeUrl: '/games/snake-game/index.html',
          thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
          isPublished: true,
          isFeatured: true,
          version: '1.0.0',
          seoTitle: 'Spike Snake - Free Online Multiplayer Neon Snake Game | ArcadeCore',
          seoDescription: 'Play Spike Snake free online. A glowing HTML5 multiplayer snake battle with AI bots, Battle Royale mode, and WebRTC PeerJS peer-to-peer connections.',
          seoKeywords: 'snake game, multiplayer snake, neon snake, slither, browser game, HTML5 game',
          categories: {
            set: [],
            connect: [
              { slug: 'arcade' },
              { slug: 'action' },
              { slug: 'multiplayer' }
            ]
          },
          tags: {
            set: [],
            connect: [
              { slug: 'neon' },
              { slug: 'webgl' }
            ]
          }
        }
      })
      console.log('✅ Game updated successfully!')
    } else {
      // Find developer
      let developer = await db.developer.findFirst({ where: { name: 'ArcadeCore Studios' } })

      await db.game.create({
        data: {
          title: 'Spike Snake',
          slug: 'snake-game',
          description: 'Play Spike Snake, the ultimate glowing HTML5 multiplayer snake game with WebRTC PeerJS multiplayer, AI bots, Battle Royale shrinking modes, and vibrant spikey neon physics.',
          instructions: 'Steer your glowing neon snake around the arena. Eat energy pellets to grow longer. Avoid crashing into other snakes. Encircle opponents to eliminate them and absorb their cells!',
          controls: 'Mouse: Steer direction\nLeft Click / Space: Speed Boost\nESC: Pause',
          iframeUrl: '/games/snake-game/index.html',
          thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
          bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
          playCount: 0,
          rating: 4.8,
          isPublished: true,
          isFeatured: true,
          version: '1.0.0',
          seoTitle: 'Spike Snake - Free Online Multiplayer Neon Snake Game | ArcadeCore',
          seoDescription: 'Play Spike Snake free online. A glowing HTML5 multiplayer snake battle with AI bots, Battle Royale mode, and WebRTC PeerJS peer-to-peer connections.',
          seoKeywords: 'snake game, multiplayer snake, neon snake, slither, browser game, HTML5 game',
          categories: {
            connect: [
              { slug: 'arcade' },
              { slug: 'action' },
              { slug: 'multiplayer' }
            ]
          },
          tags: {
            connect: [
              { slug: 'neon' },
              { slug: 'webgl' }
            ]
          },
          ...(developer ? { developer: { connect: { id: developer.id } } } : {})
        }
      })
      console.log('✅ Game registered successfully!')
    }
  } catch (e: any) {
    console.error('❌ Error:', e.message)
  } finally {
    await db.$disconnect()
  }
}

registerSnakeGame()
