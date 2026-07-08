// Neon Race 3D Game Engine (Built on Three.js)

// --- Game State & Configuration ---
const CONFIG = {
  roadWidth: 40,
  roadLength: 1000,
  lanes: [-12, 0, 12], // X coordinates of lanes
  energyDrainRate: 0.15,
  boostEnergyDrainRate: 0.45,
  obstacleSpeedBase: 2.2,
  playerSteerSpeed: 0.8,
  batteryValue: 25,
  maxObstacles: 5,
  maxBatteries: 2,
};

const STATE = {
  isPlaying: false,
  isMuted: false,
  score: 0,
  highScore: 0,
  energy: 100,
  speed: 1.0,
  targetX: 0, // Target player lane X position
  playerX: 0, // Current player X position
  playerZ: 10,
  obstacles: [],
  batteries: [],
  particles: [],
  terrainProps: [],
  boostActive: false,
  lastTime: 0,
};

// --- Web Audio Synthesizer Node ---
const Sound = {
  ctx: null,
  engineOsc: null,
  engineGain: null,
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.setupEngineSound();
    } catch (e) {
      console.warn('AudioContext not supported');
    }
  },

  setupEngineSound() {
    if (!this.ctx || STATE.isMuted) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime); // Engine rumble
      this.engineGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    } catch (e) {}
  },

  updateEnginePitch(speedRatio) {
    if (!this.ctx || STATE.isMuted || !this.engineOsc) return;
    const baseFreq = 50 + speedRatio * 80;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
  },

  playCollect() {
    if (!this.ctx || STATE.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.24); // C6

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  },

  playCrash() {
    if (!this.ctx || STATE.isMuted) return;
    try {
      // Noise buffer for explosion rumble
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noiseNode.start();
    } catch (e) {}
  },

  playClick() {
    if (!this.ctx || STATE.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  },

  toggleMute() {
    STATE.isMuted = !STATE.isMuted;
    if (STATE.isMuted) {
      if (this.engineOsc) {
        try { this.engineOsc.stop(); } catch (e) {}
        this.engineOsc = null;
      }
    } else {
      this.setupEngineSound();
    }
  }
};

// --- Three.js Setup Elements ---
let scene, camera, renderer;
let playerCar;
let roadGrid1, roadGrid2;
let roadLines = [];
let ambientLight, dirLight;
let mountains = [];

function init3D() {
  const container = document.getElementById('canvas-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05050e);
  // Add thick retro fog
  scene.fog = new THREE.FogExp2(0x05050e, 0.0035);

  // Camera
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(0, 8, 25);
  camera.lookAt(new THREE.Vector3(0, 2, -40));

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Lighting
  ambientLight = new THREE.AmbientLight(0xff00d4, 0.35); // Pink glow ambient
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0x00ff87, 0.85); // Teal main light
  dirLight.position.set(10, 20, 15);
  scene.add(dirLight);

  // Generate Highway & Background elements
  createHighway();
  createBackgroundHills();
  createPlayerCar();
}

// --- Dynamic Mesh Generators ---
function createHighway() {
  // Road surface (Dark metal runway)
  const roadGeo = new THREE.PlaneGeometry(CONFIG.roadWidth * 2, CONFIG.roadLength);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x070712,
    roughness: 0.8,
    metalness: 0.9,
  });
  
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.1, -CONFIG.roadLength / 2 + 50);
  scene.add(road);

  // Synthwave Grid overlay lines
  const gridHelper1 = new THREE.GridHelper(160, 40, 0x00ff87, 0x142055);
  gridHelper1.position.set(0, 0, -80);
  scene.add(gridHelper1);
  roadGrid1 = gridHelper1;

  const gridHelper2 = new THREE.GridHelper(160, 40, 0x00ff87, 0x142055);
  gridHelper2.position.set(0, 0, -240);
  scene.add(gridHelper2);
  roadGrid2 = gridHelper2;

  // Yellow neon dashed divider lines
  const lineGeo = new THREE.BoxGeometry(0.8, 0.05, 8);
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
  
  // Left and Right lane dividers
  for (let z = 0; z > -500; z -= 32) {
    const divider1 = new THREE.Mesh(lineGeo, lineMat);
    divider1.position.set(-6, 0.05, z);
    scene.add(divider1);
    
    const divider2 = new THREE.Mesh(lineGeo, lineMat);
    divider2.position.set(6, 0.05, z);
    scene.add(divider2);
    
    roadLines.push(divider1, divider2);
  }
}

function createPlayerCar() {
  // Low-poly Cyber Car Group
  playerCar = new THREE.Group();

  // Chassis base (neon cyan)
  const baseGeo = new THREE.BoxGeometry(4.5, 0.75, 8.5);
  const baseMat = new THREE.MeshStandardMaterial({ 
    color: 0x002244,
    emissive: 0x0088ff,
    roughness: 0.1, 
    metalness: 0.8 
  });
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.position.y = 0.5;
  playerCar.add(baseMesh);

  // Cabin cockpit (slanted black gloss glass)
  const cabinGeo = new THREE.BoxGeometry(3.5, 0.85, 4.0);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.0, metalness: 1.0 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.25, -0.5);
  playerCar.add(cabin);

  // Glowing neon stripes (Tail light/headlight strips)
  const lightGeo = new THREE.BoxGeometry(4.2, 0.15, 0.25);
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0x00ff87 });

  const tailLight = new THREE.Mesh(lightGeo, tailLightMat);
  tailLight.position.set(0, 0.5, 4.25);
  playerCar.add(tailLight);

  const headLight = new THREE.Mesh(lightGeo, headLightMat);
  headLight.position.set(0, 0.4, -4.25);
  playerCar.add(headLight);

  // Wheels (Low-poly cylinders)
  const wheelGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.8, 8);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [-2.2, 0.45, -2.5], // Front Left
    [2.2, 0.45, -2.5],  // Front Right
    [-2.2, 0.45, 2.5],  // Rear Left
    [2.2, 0.45, 2.5]    // Rear Right
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    playerCar.add(wheel);
  });

  playerCar.position.set(0, 0.1, STATE.playerZ);
  scene.add(playerCar);
}

function createBackgroundHills() {
  // Glowing grid mountains flanking the highway
  const hillGeo = new THREE.ConeGeometry(30, 60, 4);
  const hillMat = new THREE.MeshBasicMaterial({
    color: 0x00ff87,
    wireframe: true
  });

  for (let z = 0; z > -600; z -= 80) {
    // Left hills
    const leftHill = new THREE.Mesh(hillGeo, hillMat);
    leftHill.position.set(-65 - Math.random() * 20, 20, z);
    leftHill.rotation.y = Math.random() * Math.PI;
    scene.add(leftHill);

    // Right hills
    const rightHill = new THREE.Mesh(hillGeo, hillMat);
    rightHill.position.set(65 + Math.random() * 20, 20, z);
    rightHill.rotation.y = Math.random() * Math.PI;
    scene.add(rightHill);

    mountains.push(leftHill, rightHill);
  }
}

// --- Obstacles & Batteries Factories ---
function spawnObstacle() {
  if (STATE.obstacles.length >= CONFIG.maxObstacles) return;

  const lane = CONFIG.lanes[Math.floor(Math.random() * CONFIG.lanes.length)];
  const zPos = -300 - Math.random() * 150;

  // Check overlap with existing obstacles in the same lane
  const overlap = STATE.obstacles.some(o => o.position.x === lane && Math.abs(o.position.z - zPos) < 50);
  if (overlap) return;

  // Obstacle mesh (Futuristic wireframe glowing truck/cube)
  const geom = new THREE.BoxGeometry(5.0, 3.5, 7.5);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1a0033,
    emissive: 0xff00d4,
    roughness: 0.2,
    metalness: 0.8
  });
  
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(lane, 1.75, zPos);
  scene.add(mesh);
  STATE.obstacles.push(mesh);
}

function spawnBattery() {
  if (STATE.batteries.length >= CONFIG.maxBatteries) return;

  const lane = CONFIG.lanes[Math.floor(Math.random() * CONFIG.lanes.length)];
  const zPos = -250 - Math.random() * 100;

  // Make sure it doesn't overlap obstacles
  const overlapObstacle = STATE.obstacles.some(o => o.position.x === lane && Math.abs(o.position.z - zPos) < 25);
  const overlapBattery = STATE.batteries.some(b => b.position.x === lane && Math.abs(b.position.z - zPos) < 25);
  if (overlapObstacle || overlapBattery) return;

  // Golden octahedron battery pickup
  const geom = new THREE.OctahedronGeometry(1.6);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    wireframe: false
  });
  
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(lane, 1.8, zPos);
  scene.add(mesh);
  STATE.batteries.push(mesh);
}

function spawnExplosion(x, y, z, colorCode = 0xff00d4) {
  // Sparks explosion particles
  const particleCount = 20;
  const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
  const mat = new THREE.MeshBasicMaterial({ color: colorCode });

  for (let i = 0; i < particleCount; i++) {
    const p = new THREE.Mesh(geom, mat);
    p.position.set(x, y, z);
    
    // Random velocity vector
    p.userData = {
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.2 + 0.5,
      vz: (Math.random() - 0.5) * 1.5,
      life: 1.0,
      decay: 0.04 + Math.random() * 0.05
    };
    
    scene.add(p);
    STATE.particles.push(p);
  }
}

// --- Collision Engine ---
function checkCollisions() {
  const pBox = new THREE.Box3().setFromObject(playerCar);

  // 1. Obstacle Hits
  for (let i = STATE.obstacles.length - 1; i >= 0; i--) {
    const obs = STATE.obstacles[i];
    const oBox = new THREE.Box3().setFromObject(obs);

    if (pBox.intersectsBox(oBox)) {
      // Impact!
      Sound.playCrash();
      spawnExplosion(obs.position.x, 1.5, obs.position.z);
      
      // Deduct energy & trigger visual shake
      STATE.energy = Math.max(0, STATE.energy - 35);
      document.getElementById('energyPercent').innerText = `${Math.floor(STATE.energy)}%`;
      document.getElementById('energyBar').style.width = `${STATE.energy}%`;

      // Remove obstacle from screen
      scene.remove(obs);
      STATE.obstacles.splice(i, 1);

      // Flash red overlay briefly
      const container = document.getElementById('canvas-container');
      container.style.filter = 'hue-rotate(90deg) brightness(1.8)';
      setTimeout(() => {
        container.style.filter = 'none';
      }, 150);
    }
  }

  // 2. Battery Pickups
  for (let i = STATE.batteries.length - 1; i >= 0; i--) {
    const bat = STATE.batteries[i];
    const bBox = new THREE.Box3().setFromObject(bat);

    if (pBox.intersectsBox(bBox)) {
      Sound.playCollect();
      spawnExplosion(bat.position.x, 1.5, bat.position.z, 0xffd700);

      // Re-energize
      STATE.energy = Math.min(100, STATE.energy + CONFIG.batteryValue);
      document.getElementById('energyPercent').innerText = `${Math.floor(STATE.energy)}%`;
      document.getElementById('energyBar').style.width = `${STATE.energy}%`;

      // Remove battery
      scene.remove(bat);
      STATE.batteries.splice(i, 1);
    }
  }
}

// --- Main Dynamic Render Loops ---
function gameLoop(time) {
  if (!STATE.isPlaying) return;
  requestAnimationFrame(gameLoop);

  // Time delta
  const delta = Math.min((time - STATE.lastTime) / 16.66, 3.0); // Caps slow frames
  STATE.lastTime = time;

  // Handle player lane steering interpolation
  STATE.playerX += (STATE.targetX - STATE.playerX) * CONFIG.playerSteerSpeed * delta;
  playerCar.position.x = STATE.playerX;
  playerCar.rotation.z = (STATE.playerX - STATE.targetX) * 0.05; // Slanted lean on turn
  playerCar.rotation.y = (STATE.playerX - STATE.targetX) * 0.04;

  // Speed adjustments
  const targetSpeed = STATE.boostActive ? 2.5 : 1.2;
  STATE.speed += (targetSpeed - STATE.speed) * 0.1 * delta;

  // Energy depletion
  const drain = (STATE.boostActive ? CONFIG.boostEnergyDrainRate : CONFIG.energyDrainRate) * delta;
  STATE.energy = Math.max(0, STATE.energy - drain);
  document.getElementById('energyPercent').innerText = `${Math.floor(STATE.energy)}%`;
  document.getElementById('energyBar').style.width = `${STATE.energy}%`;

  if (STATE.energy <= 0) {
    endGame();
    return;
  }

  // Update sound synth hum pitch
  Sound.updateEnginePitch(STATE.speed);

  // Score Accumulation
  STATE.score += Math.round((STATE.boostActive ? 30 : 10) * delta);
  document.getElementById('scoreVal').innerText = STATE.score.toString().padStart(6, '0');

  // Spawn Obstacles & Items
  if (Math.random() < 0.02 * delta) spawnObstacle();
  if (Math.random() < 0.01 * delta) spawnBattery();

  // Scroll Grid Road and line markers (creates speed illusion)
  const zMove = STATE.speed * 8 * delta;
  
  roadGrid1.position.z += zMove;
  if (roadGrid1.position.z > 80) roadGrid1.position.z = -80;
  
  roadGrid2.position.z += zMove;
  if (roadGrid2.position.z > 80) roadGrid2.position.z = -80;

  roadLines.forEach((line) => {
    line.position.z += zMove;
    if (line.position.z > 40) {
      line.position.z -= 480; // Wrap around to the back
    }
  });

  mountains.forEach((hill) => {
    hill.position.z += zMove;
    if (hill.position.z > 80) {
      hill.position.z -= 520;
    }
  });

  // Move Obstacles towards player
  for (let i = STATE.obstacles.length - 1; i >= 0; i--) {
    const obs = STATE.obstacles[i];
    obs.position.z += (CONFIG.obstacleSpeedBase + STATE.speed) * 2.5 * delta;

    if (obs.position.z > 35) {
      scene.remove(obs);
      STATE.obstacles.splice(i, 1);
    }
  }

  // Move Batteries
  for (let i = STATE.batteries.length - 1; i >= 0; i--) {
    const bat = STATE.batteries[i];
    bat.position.z += STATE.speed * 4 * delta;
    bat.rotation.y += 0.05 * delta; // Rotate spin

    if (bat.position.z > 35) {
      scene.remove(bat);
      STATE.batteries.splice(i, 1);
    }
  }

  // Update explosion particles
  for (let i = STATE.particles.length - 1; i >= 0; i--) {
    const p = STATE.particles[i];
    p.position.x += p.userData.vx * delta;
    p.position.y += p.userData.vy * delta;
    p.position.z += p.userData.vz * delta;

    // Apply gravity
    p.userData.vy -= 0.05 * delta;

    p.userData.life -= p.userData.decay * delta;
    p.scale.setScalar(p.userData.life);

    if (p.userData.life <= 0) {
      scene.remove(p);
      STATE.particles.splice(i, 1);
    }
  }

  // Perform bounding check
  checkCollisions();

  // Render Scene
  renderer.render(scene, camera);
}

// --- Menu Controls & Actions ---
function startGameSession() {
  Sound.init();
  Sound.playClick();
  
  // Save start time
  STATE.lastTime = performance.now();

  // Reset metrics
  STATE.isPlaying = true;
  STATE.score = 0;
  STATE.energy = 100;
  STATE.speed = 1.0;
  STATE.targetX = 0;
  STATE.playerX = 0;
  STATE.boostActive = false;

  // Clear existing items
  STATE.obstacles.forEach(o => scene.remove(o));
  STATE.batteries.forEach(b => scene.remove(b));
  STATE.particles.forEach(p => scene.remove(p));
  STATE.obstacles = [];
  STATE.batteries = [];
  STATE.particles = [];

  document.getElementById('energyPercent').innerText = '100%';
  document.getElementById('energyBar').style.width = '100%';

  document.getElementById('lobbyScreen').style.opacity = '0';
  document.getElementById('gameOverScreen').style.opacity = '0';
  
  setTimeout(() => {
    document.getElementById('lobbyScreen').style.display = 'none';
    document.getElementById('gameOverScreen').style.display = 'none';
  }, 400);

  // Reset engine hum sound
  Sound.setupEngineSound();

  requestAnimationFrame(gameLoop);
}

function endGame() {
  STATE.isPlaying = false;
  Sound.playCrash();

  // Stop sound osc
  if (Sound.engineOsc) {
    try { Sound.engineOsc.stop(); } catch (e) {}
    Sound.engineOsc = null;
  }

  // Check and save High Score
  if (STATE.score > STATE.highScore) {
    STATE.highScore = STATE.score;
    localStorage.setItem('neon_race_3d_best', STATE.highScore.toString());
  }

  document.getElementById('goScore').innerText = STATE.score.toLocaleString();
  document.getElementById('goBest').innerText = STATE.highScore.toLocaleString();

  const goScreen = document.getElementById('gameOverScreen');
  goScreen.style.display = 'flex';
  setTimeout(() => {
    goScreen.style.opacity = '1';
  }, 100);
}

// --- Event Registrations ---
function setupControls() {
  // Start / Restart button triggers
  document.getElementById('startBtn').addEventListener('click', startGameSession);
  document.getElementById('restartBtn').addEventListener('click', startGameSession);

  // Mute volume control
  document.getElementById('muteBtn').addEventListener('click', () => {
    Sound.toggleMute();
    const icon = document.getElementById('volumeIcon');
    if (STATE.isMuted) {
      icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>`;
    } else {
      icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>`;
    }
  });

  // Lane Keyboard steering controls
  window.addEventListener('keydown', (e) => {
    if (!STATE.isPlaying) return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // Steer Left
      const currentIdx = CONFIG.lanes.indexOf(STATE.targetX);
      if (currentIdx > 0) {
        STATE.targetX = CONFIG.lanes[currentIdx - 1];
      }
    }
    
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      // Steer Right
      const currentIdx = CONFIG.lanes.indexOf(STATE.targetX);
      if (currentIdx < CONFIG.lanes.length - 1) {
        STATE.targetX = CONFIG.lanes[currentIdx + 1];
      }
    }

    if (e.key === ' ' || e.key === 'Spacebar') {
      STATE.boostActive = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      STATE.boostActive = false;
    }
  });

  // Mobile Buttons
  document.getElementById('leftBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    const currentIdx = CONFIG.lanes.indexOf(STATE.targetX);
    if (currentIdx > 0) STATE.targetX = CONFIG.lanes[currentIdx - 1];
  });

  document.getElementById('rightBtn').addEventListener('touchstart', (e) => {
    e.preventDefault();
    const currentIdx = CONFIG.lanes.indexOf(STATE.targetX);
    if (currentIdx < CONFIG.lanes.length - 1) STATE.targetX = CONFIG.lanes[currentIdx + 1];
  });

  const boostBtn = document.getElementById('boostBtn');
  boostBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    STATE.boostActive = true;
  });
  boostBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    STATE.boostActive = false;
  });

  // Handle window resizing scale dynamically
  window.addEventListener('resize', () => {
    if (!renderer) return;
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

// Initialize on Load
window.addEventListener('load', () => {
  // Load local best highscore
  const savedBest = localStorage.getItem('neon_race_3d_best');
  if (savedBest) {
    STATE.highScore = parseInt(savedBest, 10);
  }

  init3D();
  setupControls();
  
  // Render single initial frame
  renderer.render(scene, camera);
});
