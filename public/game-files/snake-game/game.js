// game.js - Spike Snake Core Game Engine with WebRTC P2P Multiplayer & Spikey Aesthetics

// 1. Game State & Configuration
const CONFIG = {
  arenaSize: 3200,          // Width and height of the circular arena
  segmentSpacing: 10,       // Distance between body segments
  minSegmentSpacing: 7,     // Dynamic spacing when boosting
  baseSpeed: 2.2,           // Normal movement speed
  boostSpeed: 4.8,          // Speed when boosting
  foodCount: 350,           // Total ambient food orbs in the arena
  initialBots: 45,          // Number of bots in the arena
  playerStartLength: 10,    // Starting segment count
  brShrinkDelay: 15000,     // Time before safe zone starts shrinking (ms)
  brShrinkDuration: 120000, // Total time for safe zone to shrink to min size (ms)
  brMinRadius: 180,         // Minimum safe zone radius in Battle Royale
  boostEnergyMax: 100,      // Max player boost capacity
  boostEnergyCost: 0.6,     // Energy lost per frame during boost
  boostEnergyRecover: 0.15  // Energy gained per frame when not boosting
};

const STATE = {
  gameState: 'LOBBY',       // LOBBY, PLAYING, GAMEOVER
  mode: 'BATTLE_ROYALE',    // BATTLE_ROYALE, CLASSIC
  controls: 'MOUSE',        // MOUSE, KEYBOARD
  playerNickname: 'Player',
  bestScore: 0,
  currentScore: 0,
  snakesKilled: 0,
  rank: 1,
  activeSnakes: [],
  food: [],
  particles: [],
  floatyTexts: [],          // Floaty point popups (+10 etc)
  safeZone: {
    x: 1600,
    y: 1600,
    radius: 1600,
    targetRadius: 1600,
    shrinkStartTime: 0
  },
  camera: { x: 1600, y: 1600 },
  playerSkin: 0,
  
  // WebRTC Multiplayer parameters
  onlineMode: 'OFFLINE',    // OFFLINE, HOST, GUEST
  peer: null,               // PeerJS instance
  peerId: '',
  roomId: '',
  connToHost: null,         // Connection object (for guest)
  connsToGuests: [],        // Connections objects list (for host)
  networkUpdateTimer: 0
};

// 2. Skins Definition (Updated with Spikey skins)
const SKINS = [
  {
    name: 'Classic Green',
    primary: '#39ff14',
    secondary: '#00aa00',
    style: 'striped',
    glow: 'rgba(57, 255, 20, 0.4)'
  },
  {
    name: 'Spike Poison',
    primary: '#ffea00',
    secondary: '#ff003c',
    style: 'spikey',
    glow: 'rgba(255, 0, 60, 0.4)'
  },
  {
    name: 'Neon Blue',
    primary: '#00f0ff',
    secondary: '#0088ff',
    style: 'solid',
    glow: 'rgba(0, 240, 255, 0.4)'
  },
  {
    name: 'Spike Cyber',
    primary: '#00f0ff',
    secondary: '#cc00ff',
    style: 'spikey',
    glow: 'rgba(204, 0, 255, 0.45)'
  },
  {
    name: 'Cyber Pink',
    primary: '#ff003c',
    secondary: '#cc00ff',
    style: 'striped',
    glow: 'rgba(255, 0, 60, 0.4)'
  },
  {
    name: 'Gold Rush',
    primary: '#ffea00',
    secondary: '#ffaa00',
    style: 'border',
    glow: 'rgba(255, 234, 0, 0.4)'
  },
  {
    name: 'Rainbow Glow',
    primary: '#ffffff',
    secondary: '#000000',
    style: 'rainbow',
    glow: 'rgba(255, 255, 255, 0.4)'
  }
];

function getRainbowColor(index, shiftSpeed = 0.05) {
  const hue = (index * 12 + Date.now() * shiftSpeed) % 360;
  return `hsl(${hue}, 100%, 55%)`;
}

// 3. Canvas Elements & Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const skinPreviewCanvas = document.getElementById('skinPreviewCanvas');
const previewCtx = skinPreviewCanvas.getContext('2d');
const minimapCanvas = document.getElementById('minimapCanvas');
const minimapCtx = minimapCanvas.getContext('2d');

let animationFrameId = null;
let previewFrameId = null;

// Track inputs
const input = {
  mouseX: 0,
  mouseY: 0,
  keys: {},
  mouseButtons: {},
  joystickAngle: null,
  touchActive: false
};

// 4. Initialization
window.addEventListener('load', () => {
  setupEventListeners();
  loadSaveData();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Start loops
  startSkinPreviewLoop();
  initLobbyBackground();
  
  // Check room query parameter in URL to auto-join
  checkUrlParams();
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  minimapCanvas.width = 120;
  minimapCanvas.height = 120;
}

function loadSaveData() {
  const savedBest = localStorage.getItem('spike_snake_best');
  if (savedBest) {
    STATE.bestScore = parseInt(savedBest, 10);
    document.getElementById('bestScoreDisplay').innerText = `Best Score: ${STATE.bestScore}`;
    document.getElementById('hudBestScore').innerText = STATE.bestScore;
  }
  const savedName = localStorage.getItem('spike_snake_name');
  if (savedName) {
    document.getElementById('nicknameInput').value = savedName;
    STATE.playerNickname = savedName;
  }
}

function saveScore(score) {
  if (score > STATE.bestScore) {
    STATE.bestScore = score;
    localStorage.setItem('spike_snake_best', score);
    document.getElementById('bestScoreDisplay').innerText = `Best Score: ${score}`;
    document.getElementById('hudBestScore').innerText = score;
  }
}

// 5. Sound Control
const muteToggle = document.getElementById('muteToggle');
const soundOnIcon = document.getElementById('soundOnIcon');
const soundOffIcon = document.getElementById('soundOffIcon');

muteToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  const isMuted = Sound.toggleMute();
  if (isMuted) {
    soundOnIcon.style.display = 'none';
    soundOffIcon.style.display = 'block';
  } else {
    soundOnIcon.style.display = 'block';
    soundOffIcon.style.display = 'none';
  }
  Sound.playClick();
});

// 6. Lobby Background Animation
let lobbyFood = [];
let lobbySnakes = [];

function initLobbyBackground() {
  lobbyFood = [];
  lobbySnakes = [];
  for(let i=0; i<30; i++) {
    lobbyFood.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 360}, 100%, 65%)`
    });
  }
  for(let i=0; i<3; i++) {
    const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
    const segments = [];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const length = 15 + Math.floor(Math.random() * 10);
    const angle = Math.random() * Math.PI * 2;
    for(let j=0; j<length; j++) {
      segments.push({
        x: x - Math.cos(angle) * j * 10,
        y: y - Math.sin(angle) * j * 10
      });
    }
    lobbySnakes.push({
      segments,
      angle,
      speed: 1.2,
      skin,
      width: 11
    });
  }
}

function drawLobbyBackground() {
  ctx.fillStyle = '#08090c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGridPattern(ctx, 0, 0, canvas.width, canvas.height, 0.05);

  lobbyFood.forEach(f => {
    const pulse = 1 + Math.sin(Date.now() * 0.005 + f.x) * 0.15;
    ctx.shadowBlur = 10;
    ctx.shadowColor = f.color;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  lobbySnakes.forEach(s => {
    s.angle += Math.sin(Date.now() * 0.002 + s.segments[0].x) * 0.04;
    const head = s.segments[0];
    const targetX = head.x + Math.cos(s.angle) * s.speed;
    const targetY = head.y + Math.sin(s.angle) * s.speed;
    
    let wrapX = targetX;
    let wrapY = targetY;
    if (targetX < -50) wrapX = canvas.width + 50;
    if (targetX > canvas.width + 50) wrapX = -50;
    if (targetY < -50) wrapY = canvas.height + 50;
    if (targetY > canvas.height + 50) wrapY = -50;

    s.segments.unshift({ x: wrapX, y: wrapY });
    s.segments.pop();

    for(let j = 1; j < s.segments.length; j++) {
      const prev = s.segments[j - 1];
      const curr = s.segments[j];
      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10 && dist < 200) {
        curr.x = prev.x - (dx / dist) * 10;
        curr.y = prev.y - (dy / dist) * 10;
      } else if (dist >= 200) {
        curr.x = prev.x;
        curr.y = prev.y;
      }
    }
    drawSnakeBody(ctx, s.segments, s.skin, s.width, false, 0, 0);
  });
}

function lobbyLoop() {
  if (STATE.gameState !== 'LOBBY') return;
  drawLobbyBackground();
  animationFrameId = requestAnimationFrame(lobbyLoop);
}

// 7. Event Listeners Setup
function setupEventListeners() {
  const nickInput = document.getElementById('nicknameInput');
  nickInput.addEventListener('change', () => {
    STATE.playerNickname = nickInput.value.trim() || 'Player';
    localStorage.setItem('spike_snake_name', STATE.playerNickname);
  });

  document.getElementById('playBtn').addEventListener('click', () => {
    Sound.playClick();
    if (STATE.onlineMode === 'GUEST') {
      // Notify host to spawn/respawn client
      if (STATE.connToHost) {
        STATE.connToHost.send({ type: 'SPAWN' });
      }
    } else {
      startGame();
    }
  });
  
  document.getElementById('restartBtn').addEventListener('click', () => {
    Sound.playClick();
    document.getElementById('gameOverScreen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('gameOverScreen').style.display = 'none';
      document.getElementById('lobbyScreen').style.display = 'flex';
      document.getElementById('lobbyScreen').style.opacity = '1';
      STATE.gameState = 'LOBBY';
      
      // If was online guest, let client return to lobby state ready to play again
      if (STATE.onlineMode !== 'GUEST') {
        initLobbyBackground();
        lobbyLoop();
      } else {
        // If guest, draw lobby background
        initLobbyBackground();
        lobbyLoop();
      }
    }, 300);
  });

  // Control Selector Toggle
  const ctrlBtn = document.getElementById('ctrlSelectBtn');
  ctrlBtn.addEventListener('click', () => {
    Sound.playClick();
    if (STATE.controls === 'MOUSE') {
      STATE.controls = 'KEYBOARD';
      ctrlBtn.innerText = 'Ctrl: Keyboard';
      document.getElementById('controlHint').innerText = 'WASD/ARROWS to steer. Hold SPACE to boost.';
    } else {
      STATE.controls = 'MOUSE';
      ctrlBtn.innerText = 'Ctrl: Mouse';
      document.getElementById('controlHint').innerText = 'Move mouse to steer. Hold Click to boost.';
    }
  });

  // Mode Selector Toggle
  const modeBtn = document.getElementById('modeSelectBtn');
  modeBtn.addEventListener('click', () => {
    Sound.playClick();
    if (STATE.mode === 'BATTLE_ROYALE') {
      STATE.mode = 'CLASSIC';
      modeBtn.innerText = 'Mode: Classic';
      modeBtn.classList.remove('mode-br');
      document.getElementById('brStatusPanel').style.display = 'none';
    } else {
      STATE.mode = 'BATTLE_ROYALE';
      modeBtn.innerText = 'Mode: Battle Royale';
      modeBtn.classList.add('mode-br');
    }
  });

  // Skins Carousels
  document.getElementById('prevSkinBtn').addEventListener('click', () => {
    Sound.playClick();
    STATE.playerSkin = (STATE.playerSkin - 1 + SKINS.length) % SKINS.length;
    updateSkinDisplay();
  });

  document.getElementById('nextSkinBtn').addEventListener('click', () => {
    Sound.playClick();
    STATE.playerSkin = (STATE.playerSkin + 1) % SKINS.length;
    updateSkinDisplay();
  });

  // Multiplayer Actions Setup
  const hostBtn = document.getElementById('hostRoomBtn');
  const joinBtn = document.getElementById('joinModeBtn');
  const connectBtn = document.getElementById('roomConnectBtn');
  const joinInputRow = document.getElementById('joinInputRow');

  hostBtn.addEventListener('click', () => {
    Sound.playClick();
    if (STATE.onlineMode === 'HOST') {
      // Disconnect
      destroyOnlineConnection();
    } else {
      initHostMode();
    }
  });

  joinBtn.addEventListener('click', () => {
    Sound.playClick();
    if (STATE.onlineMode === 'GUEST') {
      destroyOnlineConnection();
    } else {
      joinInputRow.style.display = joinInputRow.style.display === 'none' ? 'flex' : 'none';
    }
  });

  connectBtn.addEventListener('click', () => {
    Sound.playClick();
    const code = document.getElementById('roomCodeInput').value.trim();
    if (code) {
      initGuestMode(code);
    } else {
      updateStatus('Please enter a room code.', 'error');
    }
  });

  // Mouse Input
  window.addEventListener('mousemove', (e) => {
    input.mouseX = e.clientX;
    input.mouseY = e.clientY;
  });
  window.addEventListener('mousedown', (e) => {
    if (STATE.gameState === 'PLAYING') input.mouseButtons[e.button] = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (STATE.gameState === 'PLAYING') input.mouseButtons[e.button] = false;
  });

  // Keyboard Input
  window.addEventListener('keydown', (e) => {
    input.keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    input.keys[e.code] = false;
  });

  // Mobile Touch Support
  document.body.addEventListener('touchstart', (e) => {
    if (STATE.gameState !== 'PLAYING') return;
    input.touchActive = true;
    const t = e.touches[0];
    input.touchStartX = t.clientX;
    input.touchStartY = t.clientY;
    if (e.touches.length > 1) input.keys['Space'] = true;
  });

  document.body.addEventListener('touchmove', (e) => {
    if (STATE.gameState !== 'PLAYING') return;
    const t = e.touches[0];
    const dx = t.clientX - input.touchStartX;
    const dy = t.clientY - input.touchStartY;
    if (Math.hypot(dx, dy) > 10) {
      input.joystickAngle = Math.atan2(dy, dx);
    }
  });

  document.body.addEventListener('touchend', (e) => {
    if (STATE.gameState !== 'PLAYING') return;
    if (e.touches.length === 0) {
      input.touchActive = false;
      input.joystickAngle = null;
      input.keys['Space'] = false;
    }
  });

  // Share & Invite triggers
  document.getElementById('shareBtn').addEventListener('click', () => {
    Sound.playClick();
    const url = getInviteUrl();
    if (navigator.share) {
      navigator.share({
        title: 'Spike Snake',
        text: 'Join me in Spike Snake WebRTC arena!',
        url: url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Invite link copied to clipboard: " + url);
    }
  });

  document.getElementById('inviteBtn').addEventListener('click', () => {
    Sound.playClick();
    const url = getInviteUrl();
    navigator.clipboard.writeText(url);
    alert("Invite code link copied! Send it to a friend.");
  });
}

function updateSkinDisplay() {
  const skin = SKINS[STATE.playerSkin];
  document.getElementById('skinNameDisplay').innerText = skin.name;
}

function getInviteUrl() {
  if (STATE.onlineMode === 'HOST' && STATE.peerId) {
    return `${window.location.origin}${window.location.pathname}?room=${STATE.peerId}`;
  }
  return window.location.href;
}

function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const room = urlParams.get('room');
  if (room) {
    document.getElementById('joinInputRow').style.display = 'flex';
    document.getElementById('roomCodeInput').value = room;
    updateStatus('Auto-connecting from invite link...', 'connecting');
    setTimeout(() => {
      initGuestMode(room);
    }, 800);
  }
}

// 8. Skin Preview Loop (figure-8 slither animation)
let previewSegments = [];
let previewAngle = 0;
const numPreviewSegments = 16;

function startSkinPreviewLoop() {
  skinPreviewCanvas.width = skinPreviewCanvas.parentElement.clientWidth;
  skinPreviewCanvas.height = 80;
  
  previewSegments = [];
  const cx = skinPreviewCanvas.width / 2;
  const cy = skinPreviewCanvas.height / 2;
  
  for(let i=0; i<numPreviewSegments; i++) {
    previewSegments.push({ x: cx - i*8, y: cy });
  }
  if (previewFrameId) cancelAnimationFrame(previewFrameId);
  skinPreviewLoop();
}

function skinPreviewLoop() {
  previewCtx.fillStyle = '#060709';
  previewCtx.fillRect(0, 0, skinPreviewCanvas.width, skinPreviewCanvas.height);
  drawGridPattern(previewCtx, 0, 0, skinPreviewCanvas.width, skinPreviewCanvas.height, 0.03);

  const skin = SKINS[STATE.playerSkin];
  const cx = skinPreviewCanvas.width / 2;
  const cy = skinPreviewCanvas.height / 2;
  
  const headX = cx + Math.sin(Date.now() * 0.002) * 45;
  const headY = cy + Math.cos(Date.now() * 0.004) * 15;
  
  previewSegments[0] = { x: headX, y: headY };
  for(let i=1; i<previewSegments.length; i++) {
    const prev = previewSegments[i-1];
    const curr = previewSegments[i];
    const dx = prev.x - curr.x;
    const dy = prev.y - curr.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      curr.x = prev.x - (dx/dist)*8;
      curr.y = prev.y - (dy/dist)*8;
    }
  }

  drawSnakeBody(previewCtx, previewSegments, skin, 9, true, 0, 0);
  previewFrameId = requestAnimationFrame(skinPreviewLoop);
}

// 9. Drawing helper: Spikes and Body segments rendering
function drawSpike(cCtx, cx, cy, radius, angle, color) {
  const spikeLen = radius * 0.65;
  
  // Vector tips
  const tipX = cx + Math.cos(angle) * (radius + spikeLen);
  const tipY = cy + Math.sin(angle) * (radius + spikeLen);
  
  // Base corners resting on circle perimeter
  const leftX = cx + Math.cos(angle - 0.45) * radius;
  const leftY = cy + Math.sin(angle - 0.45) * radius;
  
  const rightX = cx + Math.cos(angle + 0.45) * radius;
  const rightY = cy + Math.sin(angle + 0.45) * radius;
  
  cCtx.fillStyle = color;
  cCtx.beginPath();
  cCtx.moveTo(leftX, leftY);
  cCtx.lineTo(tipX, tipY);
  cCtx.lineTo(rightX, rightY);
  cCtx.closePath();
  cCtx.fill();
}

function drawSnakeBody(cCtx, segments, skin, baseWidth, isPreview = false, camX = 0, camY = 0) {
  if (segments.length === 0) return;

  const len = segments.length;
  
  // Draw glow
  cCtx.shadowBlur = isPreview ? 8 : 12;
  cCtx.shadowColor = skin.glow;
  
  // Draw spikes first (so they render behind/under the main body circles)
  if (skin.style === 'spikey') {
    for (let i = 1; i < len - 1; i++) {
      // Draw spikes on every 2nd segment for aesthetic spacing
      if (i % 2 === 0) {
        const seg = segments[i];
        const prev = segments[i - 1];
        const next = segments[i + 1];
        
        const x = seg.x - camX;
        const y = seg.y - camY;
        
        // Calculate tangent direction along snake curve
        const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
        
        // Scale spikes with segment size
        const factor = Math.max(0.4, 1 - (i / len) * 0.5);
        const radius = baseWidth * factor;
        
        // Draw spikes perpendicular to segment direction (left and right)
        drawSpike(cCtx, x, y, radius, angle + Math.PI/2, skin.secondary);
        drawSpike(cCtx, x, y, radius, angle - Math.PI/2, skin.secondary);
      }
    }
  }

  // Draw main body circles
  for (let i = len - 1; i >= 0; i--) {
    const seg = segments[i];
    const x = seg.x - camX;
    const y = seg.y - camY;
    
    const factor = Math.max(0.4, 1 - (i / len) * 0.5);
    const radius = baseWidth * factor;
    
    let color = skin.primary;
    if (skin.style === 'striped') {
      color = (i % 4 < 2) ? skin.primary : skin.secondary;
    } else if (skin.style === 'border') {
      color = (i % 6 < 3) ? skin.primary : '#121620';
    } else if (skin.style === 'rainbow') {
      color = getRainbowColor(i, isPreview ? 0.04 : 0.02);
    } else if (skin.style === 'spikey') {
      color = skin.primary;
    }
    
    cCtx.fillStyle = color;
    cCtx.beginPath();
    cCtx.arc(x, y, radius, 0, Math.PI * 2);
    cCtx.fill();
    
    if (skin.style === 'border') {
      cCtx.fillStyle = '#ffffff';
      cCtx.beginPath();
      cCtx.arc(x, y, radius * 0.35, 0, Math.PI * 2);
      cCtx.fill();
    }
  }
  
  cCtx.shadowBlur = 0; // reset

  // Eyes details
  const head = segments[0];
  const headX = head.x - camX;
  const headY = head.y - camY;
  
  let angle = 0;
  if (segments.length > 1) {
    angle = Math.atan2(head.y - segments[1].y, head.x - segments[1].x);
  }
  
  const eyeOffsetAngle = 0.5;
  const eyeDist = baseWidth * 0.65;
  const eyeRadius = baseWidth * 0.3;
  const pupilRadius = eyeRadius * 0.55;
  
  const drawEye = (side) => {
    const eyeAngle = angle + side * eyeOffsetAngle;
    const ex = headX + Math.cos(eyeAngle) * eyeDist;
    const ey = headY + Math.sin(eyeAngle) * eyeDist;
    
    cCtx.fillStyle = '#ffffff';
    cCtx.beginPath();
    cCtx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
    cCtx.fill();
    
    cCtx.fillStyle = '#000000';
    cCtx.beginPath();
    const px = ex + Math.cos(angle) * (eyeRadius * 0.35);
    const py = ey + Math.sin(angle) * (eyeRadius * 0.35);
    cCtx.arc(px, py, pupilRadius, 0, Math.PI * 2);
    cCtx.fill();
  };
  
  drawEye(1);
  drawEye(-1);
}

function drawGridPattern(ctxObj, camX, camY, width, height, opacity = 0.1) {
  ctxObj.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
  ctxObj.lineWidth = 1;
  const gridSize = 100;
  const startX = Math.floor(camX / gridSize) * gridSize;
  const startY = Math.floor(camY / gridSize) * gridSize;
  
  ctxObj.beginPath();
  for (let x = startX; x < camX + width + gridSize; x += gridSize) {
    ctxObj.moveTo(x - camX, 0);
    ctxObj.lineTo(x - camX, height);
  }
  for (let y = startY; y < camY + height + gridSize; y += gridSize) {
    ctxObj.moveTo(0, y - camY);
    ctxObj.lineTo(width, y - camY);
  }
  ctxObj.stroke();
  
  ctxObj.fillStyle = `rgba(57, 255, 20, ${opacity * 1.5})`;
  for (let x = startX; x < camX + width + gridSize; x += gridSize) {
    for (let y = startY; y < camY + height + gridSize; y += gridSize) {
      ctxObj.beginPath();
      ctxObj.arc(x - camX, y - camY, 2, 0, Math.PI * 2);
      ctxObj.fill();
    }
  }
}

// 10. Entity Classes: Snake, Particle, FloatyText

class Snake {
  constructor(x, y, nickname, skin, isBot = true, networkId = null) {
    this.id = networkId || Math.random().toString(36).substr(2, 9);
    this.name = nickname;
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.speed = CONFIG.baseSpeed;
    this.width = 13 + Math.random() * 2;
    this.skin = skin;
    this.isBot = isBot;
    this.isDead = false;
    this.score = 10;
    this.kills = 0;
    this.boostEnergy = CONFIG.boostEnergyMax;
    this.boostActive = false;
    
    this.segments = [];
    const len = CONFIG.playerStartLength;
    for (let i = 0; i < len; i++) {
      this.segments.push({
        x: x - Math.cos(this.angle) * i * CONFIG.segmentSpacing,
        y: y - Math.sin(this.angle) * i * CONFIG.segmentSpacing
      });
    }
    
    this.botDecisionCooldown = 0;
  }

  update() {
    if (this.isDead) return;

    // Handle boost depletion
    if (this.boostActive && this.segments.length > 5) {
      this.speed = CONFIG.boostSpeed;
      if (!this.isBot && STATE.onlineMode !== 'GUEST') {
        this.boostEnergy = Math.max(0, this.boostEnergy - CONFIG.boostEnergyCost);
        if (this.boostEnergy <= 0) this.boostActive = false;
      }
      
      // Shed mass trail
      if (Math.random() < 0.18 && STATE.onlineMode !== 'GUEST') {
        this.shrink(1);
        const tail = this.segments[this.segments.length - 1];
        spawnFoodOrb(
          tail.x + (Math.random() * 20 - 10),
          tail.y + (Math.random() * 20 - 10),
          Math.floor(Math.random() * 3) + 2,
          this.skin.glow
        );
      }
    } else {
      this.speed = CONFIG.baseSpeed;
      this.boostActive = false;
      if (!this.isBot && STATE.onlineMode !== 'GUEST') {
        this.boostEnergy = Math.min(CONFIG.boostEnergyMax, this.boostEnergy + CONFIG.boostEnergyRecover);
      }
    }

    // Steering direction update (only processed locally for bots or singleplayer, or by Host)
    if (STATE.onlineMode !== 'GUEST') {
      if (this.isBot) {
        this.updateBotAI();
      } else if (this.id === 'LOCAL_PLAYER') {
        this.updatePlayerDirection();
      }
      // Guest snakes on Host updates are steered via network packets updating their targetAngle.
      
      let angleDiff = this.targetAngle - this.angle;
      angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
      this.angle += angleDiff * 0.12;

      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      this.checkWallCollision();

      this.segments[0] = { x: this.x, y: this.y };
      const spacing = this.boostActive ? CONFIG.minSegmentSpacing : CONFIG.segmentSpacing;
      for (let i = 1; i < this.segments.length; i++) {
        const prev = this.segments[i - 1];
        const curr = this.segments[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > spacing) {
          curr.x = prev.x - (dx / dist) * spacing;
          curr.y = prev.y - (dy / dist) * spacing;
        }
      }
      this.width = Math.min(26, 12 + this.segments.length * 0.05);
      this.score = this.segments.length * 10;
    }
  }

  updatePlayerDirection() {
    if (STATE.controls === 'MOUSE') {
      if (input.touchActive && input.joystickAngle !== null) {
        this.targetAngle = input.joystickAngle;
      } else {
        const mouseWorldX = input.mouseX + STATE.camera.x - canvas.width / 2;
        const mouseWorldY = input.mouseY + STATE.camera.y - canvas.height / 2;
        this.targetAngle = Math.atan2(mouseWorldY - this.y, mouseWorldX - this.x);
      }
      const clickBoost = input.mouseButtons[0] || input.keys['Space'];
      if (clickBoost && this.boostEnergy > 5 && this.segments.length > 5) {
        if (!this.boostActive) Sound.startBoost();
        this.boostActive = true;
      } else {
        if (this.boostActive) Sound.stopBoost();
        this.boostActive = false;
      }
    } else {
      let turnDir = 0;
      if (input.keys['ArrowLeft'] || input.keys['KeyA']) turnDir = -1;
      if (input.keys['ArrowRight'] || input.keys['KeyD']) turnDir = 1;
      
      this.targetAngle += turnDir * 0.06;
      if (input.keys['Space'] && this.boostEnergy > 5 && this.segments.length > 5) {
        if (!this.boostActive) Sound.startBoost();
        this.boostActive = true;
      } else {
        if (this.boostActive) Sound.stopBoost();
        this.boostActive = false;
      }
    }
  }

  updateBotAI() {
    this.botDecisionCooldown--;
    let dangerFound = false;
    let avoidanceAngle = 0;
    
    for (let other of STATE.activeSnakes) {
      if (other.id === this.id) continue;
      const lookAheadDist = this.speed * 25;
      
      const sampleGap = Math.max(1, Math.floor(other.segments.length / 8));
      for (let j = 0; j < other.segments.length; j += sampleGap) {
        const seg = other.segments[j];
        const dist = Math.hypot(this.x - seg.x, this.y - seg.y);
        
        if (dist < 100) {
          dangerFound = true;
          avoidanceAngle += Math.atan2(this.y - seg.y, this.x - seg.x);
        }
      }
      
      const headDist = Math.hypot(this.x - other.x, this.y - other.y);
      if (headDist < 120 && other.score > this.score) {
        dangerFound = true;
        avoidanceAngle += Math.atan2(this.y - other.y, this.x - other.x);
      }
    }

    if (dangerFound) {
      this.targetAngle = avoidanceAngle;
      this.botDecisionCooldown = 15;
      this.boostActive = Math.random() < 0.15 && this.segments.length > 8;
      return;
    }

    const centerDist = Math.hypot(this.x - CONFIG.arenaSize / 2, this.y - CONFIG.arenaSize / 2);
    const borderThreshold = (STATE.mode === 'BATTLE_ROYALE') ? STATE.safeZone.radius - 120 : (CONFIG.arenaSize / 2) - 150;
    if (centerDist > borderThreshold) {
      this.targetAngle = Math.atan2((CONFIG.arenaSize / 2) - this.y, (CONFIG.arenaSize / 2) - this.x);
      this.botDecisionCooldown = 10;
      return;
    }

    if (this.botDecisionCooldown <= 0) {
      this.botDecisionCooldown = 35 + Math.random() * 40;
      let closestFood = null;
      let minDist = 250;
      
      for (let f of STATE.food) {
        const d = Math.hypot(this.x - f.x, this.y - f.y);
        if (d < minDist) {
          minDist = d;
          closestFood = f;
        }
      }
      if (closestFood) {
        this.targetAngle = Math.atan2(closestFood.y - this.y, closestFood.x - this.x);
        this.boostActive = closestFood.radius > 5 && Math.random() < 0.2 && this.segments.length > 8;
      } else {
        this.targetAngle += (Math.random() * 2 - 1) * 0.6;
        this.boostActive = false;
      }
    }
  }

  checkWallCollision() {
    const center = CONFIG.arenaSize / 2;
    const dx = this.x - center;
    const dy = this.y - center;
    const dist = Math.hypot(dx, dy);
    
    if (STATE.mode === 'BATTLE_ROYALE') {
      if (dist > STATE.safeZone.radius) {
        if (Math.random() < 0.1) {
          this.shrink(1);
          spawnParticle(this.x, this.y, '#ff003c', 3);
          if (this.segments.length <= 3) {
            this.kill('safezone');
          }
        }
      }
    } else {
      if (dist > center - 10) {
        this.kill('wall');
      }
    }
  }

  grow(amount) {
    for (let i = 0; i < amount; i++) {
      const tail = this.segments[this.segments.length - 1] || { x: this.x, y: this.y };
      this.segments.push({ x: tail.x, y: tail.y });
    }
  }

  shrink(amount) {
    for (let i = 0; i < amount; i++) {
      if (this.segments.length > 3) this.segments.pop();
    }
  }

  kill(reason) {
    if (this.isDead) return;
    this.isDead = true;
    
    // Play crash sound locally
    const player = STATE.activeSnakes.find(s => s.id === 'LOCAL_PLAYER');
    if (player) {
      const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
      if (this.id === 'LOCAL_PLAYER') {
        Sound.stopBoost();
        Sound.playCrash();
      } else if (distToPlayer < 750) {
        Sound.playCrash(Math.max(0.01, 0.25 * (1 - distToPlayer / 750)));
      }
    }
    
    // Disintegrate body to foods (only Host calculates this)
    if (STATE.onlineMode !== 'GUEST') {
      this.segments.forEach((seg, idx) => {
        if (idx % 2 === 0) {
          const radius = Math.min(8, 3.5 + (this.width * 0.15));
          spawnFoodOrb(
            seg.x + (Math.random() * 12 - 6),
            seg.y + (Math.random() * 12 - 6),
            radius,
            this.skin.primary
          );
        }
        if (idx === 0) {
          for (let p = 0; p < 18; p++) {
            spawnParticle(seg.x, seg.y, this.skin.primary, 4 + Math.random() * 4);
          }
        }
      });
    }

    if (this.id === 'LOCAL_PLAYER') {
      endGame();
    }
  }

  draw(camX, camY) {
    drawSnakeBody(ctx, this.segments, this.skin, this.width, false, camX, camY);
    
    ctx.fillStyle = this.isBot ? 'rgba(255, 255, 255, 0.65)' : '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    
    const isKing = (STATE.activeSnakes[0] && STATE.activeSnakes[0].id === this.id);
    let displayName = this.name.replace(' [Bot]', '');
    if (isKing) {
      displayName = '👑 ' + displayName;
      ctx.fillStyle = '#ffea00';
    }
    ctx.fillText(displayName, this.x - camX, this.y - camY - this.width - 8);
  }
}

// Particle class
class Particle {
  constructor(x, y, color, size, driftToCenter = false) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.decay = 0.025 + Math.random() * 0.02;
    this.driftToCenter = driftToCenter;
    
    if (driftToCenter) {
      // Battle Royale storm particle drifting inwards
      const center = CONFIG.arenaSize / 2;
      const angle = Math.atan2(center - y, center - x) + (Math.random() * 0.4 - 0.2);
      const speed = 1.5 + Math.random() * 2.5;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    } else {
      this.vx = (Math.random() * 2 - 1) * 3;
      this.vy = (Math.random() * 2 - 1) * 3;
    }
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (!this.driftToCenter) {
      this.vx *= 0.95;
      this.vy *= 0.95;
    }
    this.alpha -= this.decay;
  }

  draw(camX, camY) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.x - camX, this.y - camY, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// FloatyText popup class (+100 etc)
class FloatyText {
  constructor(x, y, text, color) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.vy = -1.2;
    this.alpha = 1.0;
  }
  update() {
    this.y += this.vy;
    this.alpha -= 0.02;
  }
  draw(camX, camY) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = 'bold 13px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 6;
    ctx.shadowColor = this.color;
    ctx.fillText(this.text, this.x - camX, this.y - camY);
    ctx.restore();
  }
}

// 11. Helper Spawns

function spawnFoodOrb(x, y, radius, color) {
  STATE.food.push({
    x,
    y,
    radius,
    color,
    pulseOffset: Math.random() * Math.PI
  });
}

function spawnParticle(x, y, color, size, driftToCenter = false) {
  STATE.particles.push(new Particle(x, y, color, size, driftToCenter));
}

function populateAmbientFood() {
  const center = CONFIG.arenaSize / 2;
  while (STATE.food.length < CONFIG.foodCount) {
    const radius = Math.random() * center;
    const angle = Math.random() * Math.PI * 2;
    const fx = center + Math.cos(angle) * radius;
    const fy = center + Math.sin(angle) * radius;
    
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 100%, 65%)`;
    
    const rand = Math.random();
    let size = 2;
    if (rand > 0.95) size = 6.5;
    else if (rand > 0.8) size = 4.5;
    
    spawnFoodOrb(fx, fy, size, color);
  }
}

function maintainBotCount() {
  if (STATE.mode === 'BATTLE_ROYALE' || STATE.onlineMode === 'GUEST') return;

  const targetCount = CONFIG.initialBots;
  const currentBots = STATE.activeSnakes.filter(s => s.isBot && !s.isDead);
  
  if (currentBots.length < targetCount) {
    const center = CONFIG.arenaSize / 2;
    const r = Math.random() * center * 0.9;
    const angle = Math.random() * Math.PI * 2;
    const bx = center + Math.cos(angle) * r;
    const by = center + Math.sin(angle) * r;
    
    const botNames = [
      'NeonPhantom', 'SlitherGlow', 'AlphaWorm', 'Cypher', 'HyperNova', 
      'Hexagon', 'PlasmaCrawl', 'Quantum', 'Glitch', 'ByteMe',
      'Vector', 'Matrix', 'LumiBug', 'SpeedyGlow', 'TurboShed'
    ];
    const name = botNames[Math.floor(Math.random() * botNames.length)] + ` [Bot]`;
    const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
    
    STATE.activeSnakes.push(new Snake(bx, by, name, skin, true));
  }
}

// 12. PeerJS WebRTC P2P Multiplayer Engine

function updateStatus(msg, className = '') {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.innerText = msg;
  statusEl.className = 'status-message ' + className;
}

function destroyOnlineConnection() {
  if (STATE.peer) {
    STATE.peer.destroy();
    STATE.peer = null;
  }
  STATE.onlineMode = 'OFFLINE';
  STATE.peerId = '';
  STATE.connToHost = null;
  STATE.connsToGuests = [];
  updateStatus('Offline (Local Play)');
  
  document.getElementById('hostRoomBtn').innerText = 'Host Room';
  document.getElementById('hostRoomBtn').className = 'online-btn';
  document.getElementById('joinModeBtn').innerText = 'Join Room';
  document.getElementById('joinModeBtn').className = 'online-btn';
  document.getElementById('joinInputRow').style.display = 'none';
  
  // Reset url query room
  window.history.pushState({}, document.title, window.location.pathname);
}

// Host Setup
function initHostMode() {
  destroyOnlineConnection();
  updateStatus('Generating Room Code...', 'connecting');
  
  // Use public PeerJS signaling cloud
  STATE.peer = new Peer();
  
  STATE.peer.on('open', (id) => {
    STATE.onlineMode = 'HOST';
    STATE.peerId = id;
    updateStatus(`Hosting! Code: ${id} (Click Link to Share)`, 'success');
    
    document.getElementById('hostRoomBtn').innerText = 'Stop Host';
    document.getElementById('hostRoomBtn').className = 'online-btn active-host';
    
    // Set URL parameter for share link
    window.history.pushState({}, document.title, `?room=${id}`);
  });

  STATE.peer.on('connection', (conn) => {
    // Add client connection
    STATE.connsToGuests.push(conn);
    
    conn.on('open', () => {
      updateStatus(`Client connected: ${conn.peer.substr(0,5)}`, 'success');
    });

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      if (data.type === 'JOIN') {
        // Spawn guest snake on Host game
        const center = CONFIG.arenaSize / 2;
        const startR = 300 + Math.random() * 500;
        const angle = Math.random() * Math.PI * 2;
        const gx = center + Math.cos(angle) * startR;
        const gy = center + Math.sin(angle) * startR;
        
        // Remove existing guest with same id
        STATE.activeSnakes = STATE.activeSnakes.filter(s => s.id !== conn.peer);
        
        const guestSkin = SKINS[data.skinId] || SKINS[0];
        const guestSnake = new Snake(gx, gy, data.nickname, guestSkin, false, conn.peer);
        STATE.activeSnakes.push(guestSnake);
        
        // Welcome payload with initial map
        conn.send({
          type: 'WELCOME',
          mode: STATE.mode,
          arenaSize: CONFIG.arenaSize,
          safeZone: STATE.safeZone
        });
      }
      
      if (data.type === 'INPUT') {
        // Client streams steer inputs to host
        const guestSnake = STATE.activeSnakes.find(s => s.id === conn.peer);
        if (guestSnake) {
          guestSnake.targetAngle = data.angle;
          guestSnake.boostActive = data.boost;
        }
      }

      if (data.type === 'SPAWN') {
        // Respawn guest snake if dead
        const guestSnake = STATE.activeSnakes.find(s => s.id === conn.peer);
        if (!guestSnake) {
          const center = CONFIG.arenaSize / 2;
          const startR = 200 + Math.random() * 400;
          const angle = Math.random() * Math.PI * 2;
          const gx = center + Math.cos(angle) * startR;
          const gy = center + Math.sin(angle) * startR;
          
          const guestSkin = SKINS[data.skinId] || SKINS[0];
          const newGuest = new Snake(gx, gy, data.nickname || 'Guest', guestSkin, false, conn.peer);
          STATE.activeSnakes.push(newGuest);
        }
      }
    });

    const removeClient = () => {
      STATE.connsToGuests = STATE.connsToGuests.filter(c => c.peer !== conn.peer);
      // Remove snake
      STATE.activeSnakes = STATE.activeSnakes.filter(s => s.id !== conn.peer);
      updateStatus(`Player disconnected.`, 'connecting');
    };
    
    conn.on('close', removeClient);
    conn.on('error', removeClient);
  });

  STATE.peer.on('error', (err) => {
    updateStatus(`Hosting error: ${err.type}`, 'error');
    destroyOnlineConnection();
  });
}

// Client Setup
function initGuestMode(hostRoomId) {
  destroyOnlineConnection();
  updateStatus('Connecting to Room...', 'connecting');
  
  STATE.peer = new Peer();
  
  STATE.peer.on('open', () => {
    const conn = STATE.peer.connect(hostRoomId);
    STATE.connToHost = conn;
    
    conn.on('open', () => {
      STATE.onlineMode = 'GUEST';
      updateStatus('Connected to Host! Enter name & Click PLAY NOW', 'success');
      
      document.getElementById('joinModeBtn').innerText = 'Leave Room';
      document.getElementById('joinModeBtn').className = 'online-btn active-join';
      document.getElementById('joinInputRow').style.display = 'none';

      // Send join configuration packet
      conn.send({
        type: 'JOIN',
        nickname: STATE.playerNickname,
        skinId: STATE.playerSkin
      });
    });

    conn.on('data', (data) => {
      if (!data || !data.type) return;

      if (data.type === 'WELCOME') {
        STATE.mode = data.mode;
        // Start client loop immediately, bypassing lobby UI
        document.getElementById('lobbyScreen').style.opacity = '0';
        setTimeout(() => {
          document.getElementById('lobbyScreen').style.display = 'none';
          document.getElementById('hudOverlay').style.display = 'block';
        }, 400);
        
        STATE.gameState = 'PLAYING';
        
        if (STATE.mode === 'BATTLE_ROYALE') {
          document.getElementById('brStatusPanel').style.display = 'flex';
        } else {
          document.getElementById('brStatusPanel').style.display = 'none';
        }
        
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (previewFrameId) cancelAnimationFrame(previewFrameId);
        
        Sound.init();
        gameLoop();
      }

      if (data.type === 'STATE_UPDATE') {
        // Sync full visual scene from host authority
        STATE.food = data.food;
        STATE.safeZone = data.safeZone;
        
        // Re-construct state snakes locally for rendering
        STATE.activeSnakes = data.snakes.map(s => {
          const snakeObj = new Snake(s.x, s.y, s.name, s.skin, s.isBot, s.id);
          snakeObj.segments = s.segments;
          snakeObj.width = s.width;
          snakeObj.score = s.score;
          snakeObj.isDead = s.isDead;
          return snakeObj;
        });

        // Track player score HUD from synced host data
        const localSnake = STATE.activeSnakes.find(s => s.id === STATE.peer.id);
        if (localSnake) {
          STATE.currentScore = localSnake.score;
          document.getElementById('currentScore').innerText = localSnake.score;
          document.getElementById('boostMeterFill').style.width = '100%'; // Host handles boost limits
        }

        // Leaderboard Sync
        STATE.rank = data.rank;
        if (STATE.mode === 'BATTLE_ROYALE') {
          document.getElementById('brAliveCount').innerText = STATE.activeSnakes.length;
        }
        
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        const list = data.leaderboard || [];
        list.forEach((item, idx) => {
          const li = document.createElement('li');
          const isMe = item.id === STATE.peer.id;
          // Guests list highlights peers
          li.className = 'leaderboard-item' + (isMe ? ' player' : (item.isBot ? '' : ' guest-peer'));
          
          li.innerHTML = `
            <span>
              <span class="leaderboard-rank">${idx + 1}</span>
              <span class="leaderboard-name">${item.name.replace(' [Bot]', '')}</span>
            </span>
            <span class="leaderboard-score">${item.score}</span>
          `;
          leaderboardList.appendChild(li);
        });

        // Sync Floaty texts
        if (data.newFloaties) {
          data.newFloaties.forEach(fl => {
            STATE.floatyTexts.push(new FloatyText(fl.x, fl.y, fl.text, fl.color));
          });
        }
      }

      if (data.type === 'GAMEOVER') {
        // Trigger game over overlay locally on guest
        STATE.gameState = 'GAMEOVER';
        Sound.stopBoost();
        Sound.playGameOver();
        
        document.getElementById('goScore').innerText = data.score;
        document.getElementById('goKills').innerText = data.kills;
        document.getElementById('goRank').innerText = `#${data.rank}`;
        
        document.getElementById('hudOverlay').style.display = 'none';
        
        const goScreen = document.getElementById('gameOverScreen');
        goScreen.style.display = 'flex';
        setTimeout(() => {
          goScreen.style.opacity = '1';
        }, 100);
      }
    });

    conn.on('close', () => {
      updateStatus('Disconnected from Host.', 'error');
      destroyOnlineConnection();
      if (STATE.gameState === 'PLAYING') endGame();
    });
  });

  STATE.peer.on('error', (err) => {
    updateStatus(`Connection failed. Check Code.`, 'error');
    destroyOnlineConnection();
  });
}

// 13. Game Startup & Loops

function startGame() {
  document.getElementById('lobbyScreen').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('hudOverlay').style.display = 'block';
  }, 400);
  
  STATE.gameState = 'PLAYING';
  STATE.currentScore = 100;
  STATE.snakesKilled = 0;
  STATE.activeSnakes = [];
  STATE.food = [];
  STATE.particles = [];
  STATE.floatyTexts = [];
  
  // Set up BR limits
  STATE.safeZone.radius = CONFIG.arenaSize / 2;
  STATE.safeZone.targetRadius = CONFIG.arenaSize / 2;
  STATE.safeZone.x = CONFIG.arenaSize / 2;
  STATE.safeZone.y = CONFIG.arenaSize / 2;
  STATE.safeZone.shrinkStartTime = Date.now() + CONFIG.brShrinkDelay;
  
  // Spawn player
  const center = CONFIG.arenaSize / 2;
  const player = new Snake(center, center, STATE.playerNickname, SKINS[STATE.playerSkin], false, 'LOCAL_PLAYER');
  STATE.activeSnakes.push(player);
  
  // Spawn bots
  const startingBotCount = STATE.mode === 'BATTLE_ROYALE' ? 49 : CONFIG.initialBots;
  for (let i = 0; i < startingBotCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 300 + Math.random() * (center * 0.7);
    const bx = center + Math.cos(angle) * dist;
    const by = center + Math.sin(angle) * dist;
    
    const botNames = [
      'NeonPhantom', 'SlitherGlow', 'AlphaWorm', 'Cypher', 'HyperNova', 
      'Hexagon', 'PlasmaCrawl', 'Quantum', 'Glitch', 'ByteMe',
      'GridRider', 'Vector', 'Matrix', 'LumiBug', 'WaveGlow', 'PixelViper'
    ];
    const name = botNames[i % botNames.length] + ` [Bot]`;
    const skin = SKINS[Math.floor(Math.random() * SKINS.length)];
    STATE.activeSnakes.push(new Snake(bx, by, name, skin, true));
  }
  
  populateAmbientFood();

  if (STATE.mode === 'BATTLE_ROYALE') {
    document.getElementById('brStatusPanel').style.display = 'flex';
  } else {
    document.getElementById('brStatusPanel').style.display = 'none';
  }

  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (previewFrameId) cancelAnimationFrame(previewFrameId);
  
  Sound.init();
  gameLoop();
}

function endGame() {
  STATE.gameState = 'GAMEOVER';
  Sound.stopBoost();
  Sound.playGameOver();
  
  const score = STATE.currentScore;
  saveScore(score);
  
  document.getElementById('goScore').innerText = score;
  document.getElementById('goKills').innerText = STATE.snakesKilled;
  document.getElementById('goRank').innerText = `#${STATE.rank}`;
  
  document.getElementById('hudOverlay').style.display = 'none';
  const goScreen = document.getElementById('gameOverScreen');
  goScreen.style.display = 'flex';
  setTimeout(() => {
    goScreen.style.opacity = '1';
  }, 100);
}

function gameLoop() {
  if (STATE.gameState !== 'PLAYING') return;
  
  updateGamePhysics();
  renderGameWorld();
  
  animationFrameId = requestAnimationFrame(gameLoop);
}

function updateGamePhysics() {
  if (STATE.onlineMode === 'GUEST') {
    // Guest clients stream inputs to the host, they don't simulate physics
    if (STATE.connToHost && STATE.connToHost.open) {
      // Calculate angle locally
      let targetAngle = 0;
      if (STATE.controls === 'MOUSE') {
        if (input.touchActive && input.joystickAngle !== null) {
          targetAngle = input.joystickAngle;
        } else {
          // relative to screen center
          targetAngle = Math.atan2(input.mouseY - canvas.height/2, input.mouseX - canvas.width/2);
        }
      } else {
        // Keyboard inputs
        const currentSnake = STATE.activeSnakes.find(s => s.id === STATE.peer.id);
        if (currentSnake) {
          let turn = 0;
          if (input.keys['ArrowLeft'] || input.keys['KeyA']) turn = -1;
          if (input.keys['ArrowRight'] || input.keys['KeyD']) turn = 1;
          targetAngle = currentSnake.angle + turn * 0.06;
        }
      }
      
      const isBoosting = input.mouseButtons[0] || input.keys['Space'];
      STATE.networkUpdateTimer++;
      
      // Send inputs to host
      if (STATE.networkUpdateTimer % 2 === 0) {
        STATE.connToHost.send({
          type: 'INPUT',
          angle: targetAngle,
          boost: isBoosting
        });
      }
    }
    
    // Update local decorative particles & floaty texts
    STATE.particles.forEach(p => p.update());
    STATE.particles = STATE.particles.filter(p => p.alpha > 0);
    STATE.floatyTexts.forEach(t => t.update());
    STATE.floatyTexts = STATE.floatyTexts.filter(t => t.alpha > 0);
    
    // Camera centers on client's synced snake
    const mySnake = STATE.activeSnakes.find(s => s.id === STATE.peer.id);
    if (mySnake) {
      STATE.camera.x += (mySnake.x - STATE.camera.x) * 0.1;
      STATE.camera.y += (mySnake.y - STATE.camera.y) * 0.1;
    }
    return;
  }

  // --- HOST / OFFLINE PHYSICS UPDATE ---
  const player = STATE.activeSnakes.find(s => s.id === 'LOCAL_PLAYER' || s.id === STATE.peerId);
  if (player && !player.isDead) {
    STATE.camera.x += (player.x - STATE.camera.x) * 0.1;
    STATE.camera.y += (player.y - STATE.camera.y) * 0.1;
  }

  // Safe zone ring shrink
  if (STATE.mode === 'BATTLE_ROYALE') {
    const elapsed = Date.now() - STATE.safeZone.shrinkStartTime;
    if (elapsed > 0) {
      const pct = Math.min(1, elapsed / CONFIG.brShrinkDuration);
      STATE.safeZone.radius = (CONFIG.arenaSize / 2) - ((CONFIG.arenaSize / 2 - CONFIG.brMinRadius) * pct);
      
      const remainingTime = Math.max(0, Math.floor((CONFIG.brShrinkDuration - elapsed) / 1000));
      const mins = Math.floor(remainingTime / 60);
      const secs = remainingTime % 60;
      document.getElementById('brTimer').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      if (pct >= 1) document.getElementById('brTimer').innerText = 'FINAL ZONE';
    } else {
      const startIn = Math.ceil(-elapsed / 1000);
      document.getElementById('brTimer').innerText = `SHRINK IN ${startIn}s`;
    }
    
    // ADVANCED storm particle generation outside safezone
    if (STATE.safeZone.radius < CONFIG.arenaSize / 2) {
      for(let i=0; i<3; i++) {
        const theta = Math.random() * Math.PI * 2;
        const dist = STATE.safeZone.radius + Math.random() * 120;
        const px = STATE.safeZone.x + Math.cos(theta) * dist;
        const py = STATE.safeZone.y + Math.sin(theta) * dist;
        spawnParticle(px, py, 'rgba(255, 0, 60, 0.7)', 3 + Math.random()*2, true);
      }
    }
  }

  // Update all snakes
  STATE.activeSnakes.forEach(s => s.update());

  // Track new floaties to broadcast to clients
  const frameFloaties = [];

  // Food collisions
  STATE.activeSnakes.forEach(s => {
    if (s.isDead) return;
    const headRadius = s.width * 0.7;
    
    for (let i = STATE.food.length - 1; i >= 0; i--) {
      const f = STATE.food[i];
      const dist = Math.hypot(s.x - f.x, s.y - f.y);
      
      if (dist < headRadius + f.radius) {
        const massValue = Math.max(1, Math.floor(f.radius / 2.2));
        s.grow(massValue);
        
        // Spawn local floaty score text for large food
        if (f.radius > 4.5) {
          const scoreAdded = massValue * 10;
          const floaty = new FloatyText(f.x, f.y, `+${scoreAdded}`, f.color);
          STATE.floatyTexts.push(floaty);
          
          if (STATE.onlineMode === 'HOST') {
            frameFloaties.push({ x: f.x, y: f.y, text: `+${scoreAdded}`, color: f.color });
          }
        }

        if (s.id === 'LOCAL_PLAYER') {
          Sound.playEat();
        } else if (STATE.onlineMode === 'HOST') {
          // Play sound on host if close
          const hostPlayer = STATE.activeSnakes.find(sp => sp.id === 'LOCAL_PLAYER');
          if (hostPlayer && Math.hypot(s.x - hostPlayer.x, s.y - hostPlayer.y) < 600) {
            // Guest eats sound
            const conn = STATE.connsToGuests.find(c => c.peer === s.id);
            if (conn) conn.send({ type: 'PLAY_SOUND', sound: 'EAT' });
          }
        }
        
        for(let p=0; p<3; p++) {
          spawnParticle(f.x, f.y, f.color, 2);
        }
        STATE.food.splice(i, 1);
      }
    }
  });

  populateAmbientFood();

  // Snake collisions
  for (let s1 of STATE.activeSnakes) {
    if (s1.isDead) continue;
    const headRadius = s1.width * 0.65;
    
    for (let s2 of STATE.activeSnakes) {
      if (s2.isDead || s1.id === s2.id) continue;
      
      for (let j = 0; j < s2.segments.length; j++) {
        if (j < 2) continue;
        const seg = s2.segments[j];
        const segRadius = s2.width * Math.max(0.4, 1 - (j / s2.segments.length) * 0.5) * 0.75;
        const dist = Math.hypot(s1.x - seg.x, s1.y - seg.y);
        
        if (dist < headRadius + segRadius) {
          s1.kill('collision');
          
          // Increment killer score
          if (s1.isDead) {
            s2.kills++;
            if (s2.id === 'LOCAL_PLAYER') {
              STATE.snakesKilled = s2.kills;
            }
          }
          break;
        }
      }
      if (s1.isDead) break;
    }
  }

  // Remove dead snakes
  const deadGuests = STATE.activeSnakes.filter(s => s.isDead && !s.isBot && s.id !== 'LOCAL_PLAYER');
  STATE.activeSnakes = STATE.activeSnakes.filter(s => !s.isDead);
  maintainBotCount();

  // Handle dead guest gameover trigger notification
  if (STATE.onlineMode === 'HOST' && deadGuests.length > 0) {
    deadGuests.forEach(deadGuest => {
      const conn = STATE.connsToGuests.find(c => c.peer === deadGuest.id);
      if (conn) {
        conn.send({
          type: 'GAMEOVER',
          score: deadGuest.score,
          kills: deadGuest.kills,
          rank: STATE.rank
        });
      }
    });
  }

  // Update lists
  STATE.particles.forEach(p => p.update());
  STATE.particles = STATE.particles.filter(p => p.alpha > 0);
  STATE.floatyTexts.forEach(t => t.update());
  STATE.floatyTexts = STATE.floatyTexts.filter(t => t.alpha > 0);

  // Sync HUD Score
  const hostPlayer = STATE.activeSnakes.find(s => s.id === 'LOCAL_PLAYER');
  if (hostPlayer) {
    STATE.currentScore = hostPlayer.score;
    document.getElementById('currentScore').innerText = hostPlayer.score;
    document.getElementById('boostMeterFill').style.width = `${hostPlayer.boostEnergy}%`;
    if (hostPlayer.boostEnergy <= 10) {
      document.getElementById('boostMeterFill').classList.add('empty');
    } else {
      document.getElementById('boostMeterFill').classList.remove('empty');
    }
  }

  // Sort Leaderboard
  const sortedSnakes = [...STATE.activeSnakes].sort((a, b) => b.score - a.score);
  
  if (hostPlayer) {
    const rankIndex = sortedSnakes.findIndex(s => s.id === hostPlayer.id);
    STATE.rank = rankIndex !== -1 ? rankIndex + 1 : STATE.rank;
  }
  
  if (STATE.mode === 'BATTLE_ROYALE') {
    document.getElementById('brAliveCount').innerText = STATE.activeSnakes.length;
  }

  const leaderboardList = document.getElementById('leaderboardList');
  leaderboardList.innerHTML = '';
  
  const displayCount = Math.min(10, sortedSnakes.length);
  for (let i = 0; i < displayCount; i++) {
    const s = sortedSnakes[i];
    const li = document.createElement('li');
    const isMe = hostPlayer && s.id === hostPlayer.id;
    
    // Host leaderboard highlights local player and guest peers
    li.className = 'leaderboard-item' + (isMe ? ' player' : (s.isBot ? '' : ' guest-peer'));
    li.innerHTML = `
      <span>
        <span class="leaderboard-rank">${i + 1}</span>
        <span class="leaderboard-name">${s.name.replace(' [Bot]', '')}</span>
      </span>
      <span class="leaderboard-score">${s.score}</span>
    `;
    leaderboardList.appendChild(li);
  }

  // Broadcast state update packets to guests
  if (STATE.onlineMode === 'HOST' && STATE.connsToGuests.length > 0) {
    STATE.networkUpdateTimer++;
    if (STATE.networkUpdateTimer % 2 === 0) {
      // Map thin serialized snakes list for guest drawing
      const serializedSnakes = STATE.activeSnakes.map(s => ({
        id: s.id,
        name: s.name,
        x: s.x,
        y: s.y,
        width: s.width,
        score: s.score,
        skin: s.skin,
        isBot: s.isBot,
        isDead: s.isDead,
        segments: s.segments
      }));
      
      const payload = {
        type: 'STATE_UPDATE',
        snakes: serializedSnakes,
        food: STATE.food,
        safeZone: STATE.safeZone,
        rank: STATE.rank,
        leaderboard: sortedSnakes.slice(0, 10).map(s => ({ id: s.id, name: s.name, score: s.score, isBot: s.isBot })),
        newFloaties: frameFloaties
      };
      
      STATE.connsToGuests.forEach(conn => {
        if (conn.open) conn.send(payload);
      });
    }
  }
}

// 14. World & Visual Effects Render loop

function renderGameWorld() {
  const localId = (STATE.onlineMode === 'GUEST' && STATE.peer) ? STATE.peer.id : 'LOCAL_PLAYER';
  const player = STATE.activeSnakes.find(s => s.id === localId);
  if (!player) return;

  const camX = STATE.camera.x - canvas.width / 2;
  const camY = STATE.camera.y - canvas.height / 2;

  ctx.fillStyle = '#08090c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 1. Grid
  drawGridPattern(ctx, camX, camY, canvas.width, canvas.height, 0.08);

  // 2. Arena boundaries
  const center = CONFIG.arenaSize / 2;
  ctx.strokeStyle = '#ff003c';
  ctx.lineWidth = 6;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#ff003c';
  ctx.beginPath();
  ctx.arc(center - camX, center - camY, center, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // 3. Battle Royale Safe Zone wall
  if (STATE.mode === 'BATTLE_ROYALE') {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 12]);
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    ctx.arc(STATE.safeZone.x - camX, STATE.safeZone.y - camY, STATE.safeZone.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }

  // 4. Draw food
  STATE.food.forEach(f => {
    if (
      f.x > camX - 30 && f.x < camX + canvas.width + 30 &&
      f.y > camY - 30 && f.y < camY + canvas.height + 30
    ) {
      const pulse = 1 + Math.sin(Date.now() * 0.007 + f.pulseOffset) * 0.22;
      ctx.shadowBlur = 6;
      ctx.shadowColor = f.color;
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x - camX, f.y - camY, f.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.shadowBlur = 0;

  // 5. Draw snakes (draw client/local player last)
  const renderSnakes = [...STATE.activeSnakes].reverse();
  
  // Sort player/local guest to the end of the rendering pile
  renderSnakes.sort((a, b) => {
    if (a.id === localId) return 1;
    if (b.id === localId) return -1;
    return 0;
  });

  renderSnakes.forEach(s => {
    if (s.segments.length > 0) {
      const maxSegmentX = Math.max(...s.segments.map(seg => seg.x));
      const minSegmentX = Math.min(...s.segments.map(seg => seg.x));
      const maxSegmentY = Math.max(...s.segments.map(seg => seg.y));
      const minSegmentY = Math.min(...s.segments.map(seg => seg.y));
      
      if (
        maxSegmentX > camX - 50 && minSegmentX < camX + canvas.width + 50 &&
        maxSegmentY > camY - 50 && minSegmentY < camY + canvas.height + 50
      ) {
        s.draw(camX, camY);
      }
    }
  });

  // 6. Draw particles
  STATE.particles.forEach(p => p.draw(camX, camY));

  // 7. Draw floaty text popups
  STATE.floatyTexts.forEach(t => t.draw(camX, camY));

  // 8. ADVANCED Speed lines warp overlay when boosting
  const localPlayer = STATE.activeSnakes.find(s => s.id === localId);
  if (localPlayer && localPlayer.boostActive && localPlayer.segments.length > 5) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.beginPath();
    
    // Draw radiant speed rays outwards
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const count = 16;
    for(let i=0; i<count; i++) {
      // angle with jitter
      const angle = (i / count) * Math.PI * 2 + (Math.sin(Date.now() * 0.05 + i) * 0.08);
      const r1 = Math.min(canvas.width, canvas.height) * 0.42;
      const r2 = r1 + 80 + Math.random() * 120;
      
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // 9. Draw Minimap
  renderMinimap(player);
}

// 15. Minimap Renderer
function renderMinimap(player) {
  minimapCtx.fillStyle = 'rgba(8, 9, 12, 0.85)';
  minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
  
  const mapCenter = minimapCanvas.width / 2;
  const mapRadius = mapCenter - 4;
  
  minimapCtx.strokeStyle = 'rgba(255, 0, 60, 0.4)';
  minimapCtx.lineWidth = 1.5;
  minimapCtx.beginPath();
  minimapCtx.arc(mapCenter, mapCenter, mapRadius, 0, Math.PI * 2);
  minimapCtx.stroke();

  const scale = mapRadius / (CONFIG.arenaSize / 2);

  if (STATE.mode === 'BATTLE_ROYALE') {
    minimapCtx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    minimapCtx.lineWidth = 1;
    minimapCtx.beginPath();
    minimapCtx.arc(mapCenter, mapCenter, STATE.safeZone.radius * scale, 0, Math.PI * 2);
    minimapCtx.stroke();
  }

  // Draw other snakes (bots/peers)
  minimapCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  STATE.activeSnakes.forEach(s => {
    if (s.id !== player.id) {
      const mx = mapCenter + (s.x - CONFIG.arenaSize / 2) * scale;
      const my = mapCenter + (s.y - CONFIG.arenaSize / 2) * scale;
      minimapCtx.beginPath();
      // Highlight other humans in purple, bots in grey
      minimapCtx.fillStyle = s.isBot ? 'rgba(255, 255, 255, 0.25)' : 'rgba(204, 0, 255, 0.7)';
      minimapCtx.arc(mx, my, s.isBot ? 1.2 : 2, 0, Math.PI * 2);
      minimapCtx.fill();
    }
  });

  // Draw player dot
  const px = mapCenter + (player.x - CONFIG.arenaSize / 2) * scale;
  const py = mapCenter + (player.y - CONFIG.arenaSize / 2) * scale;
  const flash = 1.2 + Math.sin(Date.now() * 0.01) * 0.45;
  
  minimapCtx.fillStyle = '#00f0ff';
  minimapCtx.shadowBlur = 8;
  minimapCtx.shadowColor = '#00f0ff';
  minimapCtx.beginPath();
  minimapCtx.arc(px, py, 2.5 * flash, 0, Math.PI * 2);
  minimapCtx.fill();
  minimapCtx.shadowBlur = 0;
}
