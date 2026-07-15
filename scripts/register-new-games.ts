import db from '../src/lib/db'

async function registerNewGames() {
  console.log('Registering Neon Breakout and Cyber Jump in PostgreSQL database...')

  const games = [
    {
      title: 'Neon Breakout',
      slug: 'neon-breakout',
      description: 'A glowing retro-cyberpunk brick breaker game. Launch the neon orb, bounce off your hover-paddle, smash cyber-bricks, collect multi-ball powerups, and clear levels to score big!',
      instructions: 'Move your glowing paddle left and right to bounce the balls. Smash all active neon blocks on the board to complete the level. Collect split-ball powerups to handle multiple balls at once.',
      controls: 'Mouse / Touch: Drag to steer paddle\nArrow Left / A: Steer Left\nArrow Right / D: Steer Right\nSpace: Start Game',
      iframeUrl: '/games/neon-breakout/index.html',
      thumbnailUrl: '/games/neon-breakout/banner.jpg',
      bannerUrl: '/games/neon-breakout/banner.jpg',
      rating: 4.8,
      categories: ['arcade', 'puzzle'],
      tags: ['neon', 'retro']
    },
    {
      title: 'Cyber Jump',
      slug: 'cyber-jump',
      description: 'A fast-paced infinite neon runner. Control a glowing data-cube leaping over high-voltage lasers and barriers on a virtual grid. Perform double-jumps, collect distance, and beat the record!',
      instructions: 'Jump over obstacles that slide towards you. Avoid crashing into the high-voltage neon barriers. Perform double jumps in mid-air to clear larger gaps or laser gates.',
      controls: 'Space / Arrow Up / W / Touch: Jump (Press again in mid-air to double-jump)',
      iframeUrl: '/games/cyber-jump/index.html',
      thumbnailUrl: '/games/cyber-jump/banner.jpg',
      bannerUrl: '/games/cyber-jump/banner.jpg',
      rating: 4.7,
      categories: ['arcade', 'action'],
      tags: ['neon', 'physics']
    }
  ]

  try {
    const dev = await db.developer.findFirst({ where: { name: 'ArcadeCore Studios' } })

    for (const g of games) {
      const existing = await db.game.findUnique({ where: { slug: g.slug } })
      
      const payload: any = {
        title: g.title,
        description: g.description,
        instructions: g.instructions,
        controls: g.controls,
        iframeUrl: g.iframeUrl,
        thumbnailUrl: g.thumbnailUrl,
        bannerUrl: g.bannerUrl,
        rating: g.rating,
        isPublished: true,
        isFeatured: true,
        version: '1.0.0',
        categories: {
          connect: g.categories.map(slug => ({ slug }))
        },
        tags: {
          connect: g.tags.map(slug => ({ slug }))
        },
        ...(dev ? { developer: { connect: { id: dev.id } } } : {})
      }

      if (existing) {
        console.log(`Game "${g.slug}" already exists. Updating details...`)
        await db.game.update({
          where: { slug: g.slug },
          data: payload
        })
      } else {
        console.log(`Creating new game: ${g.title}...`)
        await db.game.create({
          data: {
            slug: g.slug,
            playCount: Math.floor(Math.random() * 5000) + 1200,
            ...payload
          }
        })
      }
    }
    console.log('✅ All games registered successfully in DB!')
  } catch (err: any) {
    console.error('❌ Database error:', err.message)
  } finally {
    await db.$disconnect()
  }
}

registerNewGames()
