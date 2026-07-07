import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = [
  { name: 'Action', slug: 'action', icon: 'Sword' },
  { name: 'Adventure', slug: 'adventure', icon: 'Compass' },
  { name: 'Arcade', slug: 'arcade', icon: 'Gamepad2' },
  { name: 'Puzzle', slug: 'puzzle', icon: 'Puzzle' },
  { name: 'Racing', slug: 'racing', icon: 'Car' },
  { name: 'Shooting', slug: 'shooting', icon: 'Target' },
  { name: 'Sports', slug: 'sports', icon: 'Trophy' },
  { name: 'Strategy', slug: 'strategy', icon: 'Brain' },
  { name: 'Idle', slug: 'idle', icon: 'Clock' },
  { name: 'Simulation', slug: 'simulation', icon: 'Cpu' },
  { name: 'Multiplayer', slug: 'multiplayer', icon: 'Users' },
  { name: 'IO Games', slug: 'io-games', icon: 'Globe' },
  { name: 'Educational', slug: 'educational', icon: 'GraduationCap' },
  { name: 'Kids', slug: 'kids', icon: 'Smile' },
  { name: 'Board Games', slug: 'board-games', icon: 'Grid3X3' },
  { name: 'Card Games', slug: 'card-games', icon: 'Layers' },
]

const TAGS = [
  { name: 'Retro', slug: 'retro' },
  { name: 'Neon', slug: 'neon' },
  { name: 'Phaser', slug: 'phaser' },
  { name: 'HTML5', slug: 'html5' },
  { name: 'WebGL', slug: 'webgl' },
  { name: 'Physics', slug: 'physics' },
  { name: 'Clicker', slug: 'clicker' },
  { name: 'Infinite', slug: 'infinite' },
  { name: 'Sci-Fi', slug: 'sci-fi' },
  { name: 'Pixel Art', slug: 'pixel-art' },
  { name: 'Survival', slug: 'survival' },
  { name: 'Casual', slug: 'casual' },
]

const DEVELOPERS = [
  { name: 'ArcadeCore Studios', website: 'https://arcadecore.com' },
  { name: 'Neon Devs', website: 'https://neondevs.io' },
  { name: 'Pixel Craft', website: 'https://pixelcraft.net' },
  { name: 'Phaser Master', website: 'https://phasermaster.com' },
]

async function main() {
  console.log('Starting DB Seed...')

  // 1. Clean up database
  await prisma.userAchievement.deleteMany()
  await prisma.achievement.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.leaderboard.deleteMany()
  await prisma.gameView.deleteMany()
  await prisma.game.deleteMany()
  await prisma.category.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.developer.deleteMany()
  await prisma.user.deleteMany()

  console.log('Database cleaned.')

  // 2. Seed Categories
  const categoryMap: { [key: string]: any } = {}
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: cat,
    })
    categoryMap[cat.slug] = created
  }
  console.log('Categories seeded.')

  // 3. Seed Tags
  const tagMap: { [key: string]: any } = {}
  for (const tag of TAGS) {
    const created = await prisma.tag.create({
      data: tag,
    })
    tagMap[tag.slug] = created
  }
  console.log('Tags seeded.')

  // 4. Seed Developers
  const devMap: { [key: string]: any } = {}
  for (const dev of DEVELOPERS) {
    const created = await prisma.developer.create({
      data: dev,
    })
    devMap[dev.name] = created
  }
  console.log('Developers seeded.')

  // 5. Seed Achievements
  const achievements = [
    { title: 'First Steps', description: 'Play your first game on ArcadeCore', xpReward: 50, iconUrl: '/achievements/first-steps.png' },
    { title: 'Level 5 Challenger', description: 'Reach Level 5', xpReward: 200, iconUrl: '/achievements/level-5.png' },
    { title: 'Speed Demon', description: 'Score over 10,000 points in Neon Velocity', xpReward: 150, iconUrl: '/achievements/speed-demon.png' },
    { title: 'Puzzle Master', description: 'Score over 5,000 in Cosmic Tetris', xpReward: 150, iconUrl: '/achievements/puzzle-master.png' },
    { title: 'Daily Spinner', description: 'Spin the wheel for the first time', xpReward: 100, iconUrl: '/achievements/daily-spinner.png' },
    { title: 'Social Gamer', description: 'Write a comment on any game', xpReward: 50, iconUrl: '/achievements/social.png' },
  ]

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach })
  }
  console.log('Achievements seeded.')

  // 6. Create Real/Built-in Games
  const builtinGames = [
    {
      title: 'Neon Velocity',
      slug: 'neon-velocity',
      description: 'A thrilling retro-synthwave pseudo-3D highway racer. Dodge obstacles, collect glowing battery packs, boost your speed, and set the highest record in this fast-paced neon dashboard simulator.',
      instructions: 'Drive along the neon-glowing highway. Dodge slow obstacle vehicles and collect yellow batteries to replenish energy. Do not let your energy bar empty!',
      controls: 'Arrow Left / A : Steer Left\nArrow Right / D : Steer Right\nSpace : Boost (uses extra energy)\nEsc : Pause Game',
      iframeUrl: '/games/neon-velocity/index.html',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop',
      playCount: 154820,
      rating: 4.8,
      isFeatured: true,
      isSponsored: false,
      categories: ['racing', 'arcade', 'action'],
      tags: ['neon', 'retro', 'infinite', 'html5', 'webgl'],
      developerName: 'ArcadeCore Studios',
      screenshots: [
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=500&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500&auto=format&fit=crop'
      ]
    },
    {
      title: 'Cosmic Tetris',
      slug: 'cosmic-tetris',
      description: 'Standard retro block puzzle game floating in a cosmic visual design. Complete rows, trigger full-board combos, and watch blocks pulse to retro cyberbeats.',
      instructions: 'Manipulate falling block shapes (tetrominoes) to form full solid horizontal lines. As lines are cleared, game speed increases.',
      controls: 'Arrow Left / A : Move Left\nArrow Right / D : Move Right\nArrow Up / W : Rotate\nArrow Down / S : Soft Drop\nSpace : Hard Drop\nEsc : Pause',
      iframeUrl: '/games/cosmic-tetris/index.html',
      thumbnailUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=400&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=1200&auto=format&fit=crop',
      playCount: 98450,
      rating: 4.6,
      isFeatured: true,
      isSponsored: false,
      categories: ['puzzle', 'arcade'],
      tags: ['retro', 'casual', 'html5'],
      developerName: 'Pixel Craft',
      screenshots: [
        'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=500&auto=format&fit=crop'
      ]
    },
    {
      title: 'Flappy Cyber',
      slug: 'flappy-cyber',
      description: 'Navigate a mechanical cyber-bird through narrow green neon lasers. One single touch will blow up your bird into beautiful particle explosions!',
      instructions: 'Flap upward to maintain altitude and pass safely between laser obstacles. Score rises with every gate cleared.',
      controls: 'Left Click / Space / Touch : Flap wings upward',
      iframeUrl: '/games/flappy-cyber/index.html',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1200&auto=format&fit=crop',
      playCount: 245030,
      rating: 4.4,
      isFeatured: false,
      isSponsored: true,
      categories: ['arcade', 'kids'],
      tags: ['physics', 'infinite', 'casual', 'pixel-art'],
      developerName: 'Neon Devs',
      screenshots: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=500&auto=format&fit=crop'
      ]
    },
    {
      title: 'Retro Space Invaders',
      slug: 'space-invaders-retro',
      description: 'Dodge descending alien grids in this arcade classic. Take cover behind glowing force fields and shoot lasers at the mothership.',
      instructions: 'Move your shield laser ship back and forth, shooting rows of marching alien ships before they descend to the ground.',
      controls: 'Arrow Left / A : Move Left\nArrow Right / D : Move Right\nSpace : Fire Laser\nP : Pause',
      iframeUrl: '/games/space-invaders-retro/index.html',
      thumbnailUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop',
      playCount: 120400,
      rating: 4.7,
      isFeatured: false,
      isSponsored: false,
      categories: ['shooting', 'arcade', 'action'],
      tags: ['retro', 'pixel-art', 'survival'],
      developerName: 'Phaser Master',
      screenshots: [
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=500&auto=format&fit=crop'
      ]
    },
    {
      title: 'Crypto Clicker',
      slug: 'crypto-clicker',
      description: 'Click to mine virtual cyber-coins. Hire AI bots, buy mining rigs, lease server farms, and compound your earnings into billions of coins!',
      instructions: 'Click the big glowing central bitcoin to mine blocks. Spend blocks on background mining upgrades.',
      controls: 'Left Click : Mine Coin / Buy Upgrade\nS : Quick save',
      iframeUrl: '/games/crypto-clicker/index.html',
      thumbnailUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=400&auto=format&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
      playCount: 387400,
      rating: 4.5,
      isFeatured: false,
      isSponsored: false,
      categories: ['idle', 'simulation'],
      tags: ['clicker', 'infinite', 'casual'],
      developerName: 'Neon Devs',
      screenshots: [
        'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=500&auto=format&fit=crop'
      ]
    }
  ]

  // Insert builtin games
  for (const game of builtinGames) {
    const dbCategories = game.categories.map(slug => ({ id: categoryMap[slug].id }))
    const dbTags = game.tags.map(slug => ({ id: tagMap[slug].id }))

    await prisma.game.create({
      data: {
        title: game.title,
        slug: game.slug,
        description: game.description,
        instructions: game.instructions,
        controls: game.controls,
        iframeUrl: game.iframeUrl,
        thumbnailUrl: game.thumbnailUrl,
        bannerUrl: game.bannerUrl,
        playCount: game.playCount,
        rating: game.rating,
        isFeatured: game.isFeatured,
        isSponsored: game.isSponsored,
        developer: {
          connect: { id: devMap[game.developerName].id }
        },
        categories: {
          connect: dbCategories
        },
        tags: {
          connect: dbTags
        },
        screenshots: game.screenshots,
      }
    })
  }

  // 7. Procedural Games Generation (to reach 100+ total games!)
  console.log('Seeding procedural games catalog...')
  const templates = [
    { title: 'Cyber Hunter', category: 'shooting', tagList: ['webgl', 'sci-fi', 'survival'], suffix: 'Strike' },
    { title: 'Pixel Quest', category: 'adventure', tagList: ['pixel-art', 'retro', 'casual'], suffix: 'Chamber' },
    { title: 'Grid Puzzle', category: 'puzzle', tagList: ['casual', 'html5'], suffix: 'Block' },
    { title: 'Micro Racer', category: 'racing', tagList: ['retro', 'physics', 'casual'], suffix: 'Championship' },
    { title: 'Hex Tower', category: 'strategy', tagList: ['physics', 'webgl'], suffix: 'Defense' },
    { title: 'Neon Run', category: 'arcade', tagList: ['neon', 'infinite', 'retro'], suffix: 'Dash' },
    { title: 'Retro Ball', category: 'sports', tagList: ['physics', 'casual'], suffix: 'Pong' },
    { title: 'Clicker Kingdom', category: 'idle', tagList: ['clicker', 'casual'], suffix: 'Tycoon' },
    { title: 'Chess Royale', category: 'board-games', tagList: ['multiplayer', 'casual'], suffix: 'Online' },
    { title: 'Neon Solitaire', category: 'card-games', tagList: ['casual', 'retro'], suffix: 'Classic' },
  ]

  const thumbnails = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop',
  ]

  // Generate 97 more games
  for (let i = 1; i <= 97; i++) {
    const template = templates[i % templates.length]
    const devName = DEVELOPERS[i % DEVELOPERS.length].name
    const title = `${template.title} ${template.suffix} ${Math.floor(i / templates.length) + 1}`
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`
    
    // Choose categories and tags
    const categorySlugs = [template.category]
    if (i % 5 === 0) categorySlugs.push('multiplayer')
    if (i % 7 === 0) categorySlugs.push('kids')
    
    const dbCategories = categorySlugs.map(slug => ({ id: categoryMap[slug].id }))
    const dbTags = template.tagList
      .filter(slug => tagMap[slug] !== undefined)
      .map(slug => ({ id: tagMap[slug].id }))

    // All these procedural games point to a beautiful built-in Canvas dynamic procedural mini-game
    // to ensure there are no dead links, and players can enjoy them all!
    const iframeUrl = `/games/procedural-arcade/index.html?gameId=${slug}&title=${encodeURIComponent(title)}&category=${template.category}`

    await prisma.game.create({
      data: {
        title,
        slug,
        description: `Experience the epic ${title}! A premium browser gaming experience in the ${template.category} category. Master your strategies, conquer high scores, and unlock custom badges. Fully optimized for mobile-first play.`,
        instructions: `Welcome to ${title}! Your objective is to achieve the maximum score possible. Avoid hazards, react quickly, and collect power-ups to secure your ranking.`,
        controls: `Arrow keys / WASD : Navigation\nSpace / Left Click : Trigger Action\nP / Esc : Pause Game`,
        iframeUrl,
        thumbnailUrl: thumbnails[i % thumbnails.length],
        bannerUrl: thumbnails[i % thumbnails.length],
        playCount: Math.floor(Math.random() * 80000) + 1200,
        rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
        isFeatured: i < 6, // mark first few as featured
        isSponsored: i % 15 === 0,
        developer: {
          connect: { id: devMap[devName].id }
        },
        categories: {
          connect: dbCategories
        },
        tags: {
          connect: dbTags
        },
        screenshots: [
          thumbnails[(i + 1) % thumbnails.length]
        ]
      }
    })
  }

  // 8. Seed Advertisements
  const ads = [
    { zone: 'HEADER', code: '<!-- Header banner ad placeholder -->', isActive: true },
    { zone: 'SIDEBAR', code: '<!-- Sidebar ad placeholder -->', isActive: true },
    { zone: 'INTERSTITIAL', code: '<!-- Interstitial ad placeholder -->', isActive: true },
    { zone: 'REWARDED', code: '<!-- Rewarded ad placeholder -->', isActive: true },
  ]
  for (const ad of ads) {
    await prisma.advertisement.create({ data: ad })
  }

  console.log(`Seeding complete! Successfully seeded ${await prisma.game.count()} games, ${await prisma.category.count()} categories, and ${await prisma.tag.count()} tags.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
