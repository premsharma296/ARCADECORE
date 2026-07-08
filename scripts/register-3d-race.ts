import db from '../src/lib/db'

async function register3DRaceGame() {
  console.log('Registering Neon Race 3D in database...')

  try {
    // Check if it already exists
    const existing = await db.game.findUnique({ where: { slug: 'neon-race-3d' } })
    if (existing) {
      console.log('Game "neon-race-3d" already exists. Updating...')
      await db.game.update({
        where: { slug: 'neon-race-3d' },
        data: {
          title: 'Neon Race 3D',
          description: 'A high-speed futuristic 3D WebGL synthwave highway racer. Dodge slow obstacle vehicles, collect glowing battery cores to replenish energy, activate speed boosts, and listen to dynamic synthetic engine sounds as you travel down the cyber-grid.',
          instructions: 'Steer your low-poly cyber car across the three lanes. Dodge slow obstacle cubes, collect yellow battery cores to recharge your energy grid, and active speed boosts to warp your score multiplier!',
          controls: 'Keyboard: A / D or Left / Right Arrows to Steer, Spacebar to Speed Boost. Mobile: Tap Left / Right Arrows to Steer, Hold the central BOOST button to activate warp speed.',
          iframeUrl: '/game-files/neon-race-3d/index.html',
          thumbnailUrl: '/game-files/neon-race-3d/banner.jpg',
          bannerUrl: '/game-files/neon-race-3d/banner.jpg',
          playCount: 245900,
          rating: 4.9,
          isPublished: true,
          isFeatured: true,
          version: '1.0.0',
          seoTitle: 'Neon Race 3D - Free Online WebGL Cyber Highway Racer | ArcadeCore',
          seoDescription: 'Play Neon Race 3D free online. A futuristic synthwave 3D highway racer built in WebGL and Three.js with sound synthesizers and speed boosts.',
          seoKeywords: '3d racing game, webgl racer, neon racer, synthwave game, three.js game, browser racer',
          categories: {
            set: [],
            connect: [
              { slug: 'racing' },
              { slug: 'arcade' },
              { slug: 'action' },
              { slug: 'simulation' }
            ]
          },
          tags: {
            set: [],
            connect: [
              { slug: 'webgl' },
              { slug: 'neon' },
              { slug: 'retro' },
              { slug: 'infinite' },
              { slug: 'html5' },
              { slug: 'physics' }
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
          title: 'Neon Race 3D',
          slug: 'neon-race-3d',
          description: 'A high-speed futuristic 3D WebGL synthwave highway racer. Dodge slow obstacle vehicles, collect glowing battery cores to replenish energy, activate speed boosts, and listen to dynamic synthetic engine sounds as you travel down the cyber-grid.',
          instructions: 'Steer your low-poly cyber car across the three lanes. Dodge slow obstacle cubes, collect yellow battery cores to recharge your energy grid, and active speed boosts to warp your score multiplier!',
          controls: 'Keyboard: A / D or Left / Right Arrows to Steer, Spacebar to Speed Boost. Mobile: Tap Left / Right Arrows to Steer, Hold the central BOOST button to activate warp speed.',
          iframeUrl: '/game-files/neon-race-3d/index.html',
          thumbnailUrl: '/game-files/neon-race-3d/banner.jpg',
          bannerUrl: '/game-files/neon-race-3d/banner.jpg',
          playCount: 245900,
          rating: 4.9,
          isPublished: true,
          isFeatured: true,
          version: '1.0.0',
          seoTitle: 'Neon Race 3D - Free Online WebGL Cyber Highway Racer | ArcadeCore',
          seoDescription: 'Play Neon Race 3D free online. A futuristic synthwave 3D highway racer built in WebGL and Three.js with sound synthesizers and speed boosts.',
          seoKeywords: '3d racing game, webgl racer, neon racer, synthwave game, three.js game, browser racer',
          categories: {
            connect: [
              { slug: 'racing' },
              { slug: 'arcade' },
              { slug: 'action' },
              { slug: 'simulation' }
            ]
          },
          tags: {
            connect: [
              { slug: 'webgl' },
              { slug: 'neon' },
              { slug: 'retro' },
              { slug: 'infinite' },
              { slug: 'html5' },
              { slug: 'physics' }
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

register3DRaceGame()
