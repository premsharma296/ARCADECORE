export interface MockGame {
  id: string
  title: string
  slug: string
  description: string
  instructions: string
  controls: string
  iframeUrl: string
  thumbnailUrl: string
  bannerUrl: string
  playCount: number
  rating: number
  isFeatured: boolean
  isSponsored: boolean
  categories: { name: string; slug: string }[]
  tags: { name: string; slug: string }[]
  screenshots: string[]
}

export const FALLBACK_GAMES: MockGame[] = [
  {
    id: '1',
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
    categories: [{ name: 'Racing', slug: 'racing' }, { name: 'Arcade', slug: 'arcade' }, { name: 'Action', slug: 'action' }],
    tags: [{ name: 'Neon', slug: 'neon' }, { name: 'Retro', slug: 'retro' }],
    screenshots: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '2',
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
    categories: [{ name: 'Puzzle', slug: 'puzzle' }, { name: 'Arcade', slug: 'arcade' }],
    tags: [{ name: 'Retro', slug: 'retro' }, { name: 'Casual', slug: 'casual' }],
    screenshots: [
      'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '3',
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
    categories: [{ name: 'Arcade', slug: 'arcade' }, { name: 'Kids', slug: 'kids' }],
    tags: [{ name: 'Physics', slug: 'physics' }, { name: 'Casual', slug: 'casual' }],
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '4',
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
    categories: [{ name: 'Shooting', slug: 'shooting' }, { name: 'Arcade', slug: 'arcade' }, { name: 'Action', slug: 'action' }],
    tags: [{ name: 'Retro', slug: 'retro' }, { name: 'Pixel Art', slug: 'pixel-art' }],
    screenshots: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '5',
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
    categories: [{ name: 'Idle', slug: 'idle' }, { name: 'Simulation', slug: 'simulation' }],
    tags: [{ name: 'Clicker', slug: 'clicker' }, { name: 'Casual', slug: 'casual' }],
    screenshots: [
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '6',
    title: 'Neon Showdown Online',
    slug: 'neon-showdown',
    description: 'An advanced real-time multiplayer neon tank battle game. Establish low-latency WebRTC peer connections or play split-screen co-op. Move, aim, fire, and outsmart your rival!',
    instructions: 'Controls: Local Co-op uses WASD/Arrows. Online PvP establishes zero-latency WebRTC direct peer links. Fire bullets to decrease the rival tank health.',
    controls: 'Player 1: WASD keys to steer tank. Q / E : Rotate Turret. Space : Shoot Projectile.\nPlayer 2: Arrow keys to steer tank. Slash / Period : Rotate Turret. Enter : Shoot Projectile.',
    iframeUrl: '/games/neon-showdown',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
    playCount: 1250,
    rating: 4.9,
    isFeatured: true,
    isSponsored: false,
    categories: [{ name: 'Multiplayer', slug: 'multiplayer' }, { name: 'Action', slug: 'action' }, { name: 'Arcade', slug: 'arcade' }],
    tags: [{ name: 'Neon', slug: 'neon' }, { name: 'Physics', slug: 'physics' }],
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=500&auto=format&fit=crop'
    ]
  },
  {
    id: '7',
    title: 'Spike Snake',
    slug: 'spike-snake',
    description: 'A glowing multiplayer WebRTC arena snake battle. Steer your snake, consume energy pellets to grow, avoid collisions, and encircle your opponent!',
    instructions: 'Controls: Local Co-op uses WASD and Arrows. Online PvP utilizes zero-latency direct WebRTC connection. Collect glowing energy dots to expand and grow!',
    controls: 'Player 1: Mouse or WASD to navigate. Space to Boost.\nPlayer 2: Arrow keys to navigate. Enter to Boost.',
    iframeUrl: '/games/spike-snake',
    thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1200&auto=format&fit=crop',
    playCount: 4200,
    rating: 4.8,
    isFeatured: true,
    isSponsored: false,
    categories: [{ name: 'Multiplayer', slug: 'multiplayer' }, { name: 'Arcade', slug: 'arcade' }, { name: 'Action', slug: 'action' }],
    tags: [{ name: 'Neon', slug: 'neon' }, { name: 'WebGL', slug: 'webgl' }],
    screenshots: [
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=500&auto=format&fit=crop'
    ]
  }
]

// Dynamically generate extra 95 mock items for local scroll play testing!
export const getFullMockCatalog = (): MockGame[] => {
  const result = [...FALLBACK_GAMES]
  const suffixes = ['Championship', 'Deluxe', 'Extreme', 'Evolution', 'Battle Royale', 'Saga', 'Tycoon', 'Arena', 'Reborn']
  const categories = [
    { name: 'Racing', slug: 'racing' },
    { name: 'Puzzle', slug: 'puzzle' },
    { name: 'Arcade', slug: 'arcade' },
    { name: 'Shooting', slug: 'shooting' },
    { name: 'Action', slug: 'action' },
    { name: 'Simulation', slug: 'simulation' },
    { name: 'Adventure', slug: 'adventure' },
    { name: 'Sports', slug: 'sports' },
    { name: 'Strategy', slug: 'strategy' },
    { name: 'IO Games', slug: 'io-games' },
    { name: 'Educational', slug: 'educational' },
    { name: 'Board Games', slug: 'board-games' },
    { name: 'Card Games', slug: 'card-games' }
  ]
  const tags = [{ name: 'WebGL', slug: 'webgl' }, { name: 'Phaser', slug: 'phaser' }, { name: 'Physics', slug: 'physics' }]
  const thumbnails = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605901309584-818e25960a8f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop'
  ]

  for (let i = 6; i <= 102; i++) {
    const baseTemplate = FALLBACK_GAMES[(i - 1) % FALLBACK_GAMES.length]
    const suffix = suffixes[i % suffixes.length]
    const title = `${baseTemplate.title} ${suffix}`
    const slug = `${baseTemplate.slug}-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`
    
    // Choose categories and tags
    const cat = categories[i % categories.length]
    const gameCategories = [cat]
    if (i % 3 === 0) gameCategories.push({ name: 'Multiplayer', slug: 'multiplayer' })
    if (i % 5 === 0) gameCategories.push({ name: 'Kids', slug: 'kids' })

    result.push({
      id: i.toString(),
      title,
      slug,
      description: `Play the awesome ${title}! A dynamic browser game loaded in the ${cat.name} category. Compete with players worldwide, rank up and claim your in-game coins!`,
      instructions: `Objective: Complete all missions and survive hazards. Collect energy tokens to purchase speed upgrades in the catalog.`,
      controls: `Arrow keys / WASD : Steer & Navigate\nSpace : Trigger Speed boost\nP : Pause game`,
      iframeUrl: `/games/procedural-arcade/index.html?gameId=${slug}&title=${encodeURIComponent(title)}&category=${cat.slug}`,
      thumbnailUrl: thumbnails[i % thumbnails.length],
      bannerUrl: thumbnails[i % thumbnails.length],
      playCount: Math.floor(Math.random() * 95000) + 1500,
      rating: Number((3.8 + Math.random() * 1.2).toFixed(1)),
      isFeatured: i < 9,
      isSponsored: i % 12 === 0,
      categories: gameCategories,
      tags: tags.slice(0, 1 + (i % 2)),
      screenshots: [thumbnails[(i + 1) % thumbnails.length]]
    })
  }

  return result
}
