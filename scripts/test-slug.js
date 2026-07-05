// Node script to test getFullMockCatalog output
const fs = require('fs');
const path = require('path');

// To evaluate fallback-data without compiling TS, we can convert it on the fly or inspect the file.
// Let's write a node script that matches the structure of getFullMockCatalog
const FALLBACK_GAMES = [
  { id: '1', title: 'Neon Velocity', slug: 'neon-velocity' },
  { id: '2', title: 'Cosmic Tetris', slug: 'cosmic-tetris' },
  { id: '3', title: 'Flappy Cyber', slug: 'flappy-cyber' },
  { id: '4', title: 'Retro Space Invaders', slug: 'space-invaders-retro' },
  { id: '5', title: 'Crypto Clicker', slug: 'crypto-clicker' }
];

const suffixes = ['Championship', 'Deluxe', 'Extreme', 'Evolution', 'Battle Royale', 'Saga', 'Tycoon', 'Arena', 'Reborn'];

function getFullMockCatalog() {
  const result = [...FALLBACK_GAMES];
  for (let i = 6; i <= 102; i++) {
    const baseTemplate = FALLBACK_GAMES[(i - 1) % FALLBACK_GAMES.length];
    const suffix = suffixes[i % suffixes.length];
    const title = `${baseTemplate.title} ${suffix}`;
    const slug = `${baseTemplate.slug}-${suffix.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    result.push({ id: i.toString(), title, slug });
  }
  return result;
}

const catalog = getFullMockCatalog();
const neon = catalog.find(g => g.slug === 'neon-velocity');
console.log('Search for neon-velocity in simulated list:', neon);
console.log('Total catalog length:', catalog.length);
