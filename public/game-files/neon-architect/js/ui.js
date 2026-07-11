// ==========================================
// NEON ARCHITECT - UI & PROTOCOL BINDER
// ==========================================

import { playSound, initAudio } from './audio.js';

export const clientState = {
  socket: null,
  playerId: null,
  playerName: '',
  playerColor: '#00ffcc',
  credits: 0,
  crystals: 0,
  tech: 1.0,
  level: 1,
  activeMode: 'logistics', // logistics, utility, production, combat
  selectedStructureId: null,
  unlockedTech: new Set(),
  players: [],
  structures: {},
  drones: [],
  weather: 'clear',
  globalEvent: null,
  tick: 0,
  friends: new Set(JSON.parse(localStorage.getItem('network-friends') || '[]')),
  myAlliance: null
};

// Callback listeners for game.js to update the Three.js viewport
const syncListeners = [];
export function onSyncUpdate(callback) {
  syncListeners.push(callback);
}

const structureSpawnListeners = [];
export function onStructureSpawn(callback) {
  structureSpawnListeners.push(callback);
}

// // ---- LOCAL SIMULATION (runs when WebSocket unavailable) ----
let localSimInterval = null;
let localTick = 0;
const localStructures = {};
const localDrones = [];
const localPlayers = [];
const WEATHERS = ['clear','clear','clear','rain','solar_storm','emp_storm','meteor_shower','blackout'];
let localWeather = 'clear';
let localWeatherCountdown = 60;

function startLocalSim() {
  // Seed a few simulated online players for atmosphere
  localPlayers.push(
    { id: 'bot1', name: 'NOVA_PRIME', color: '#ff0055', region: 'NA', credits: 3400, crystals: 220, tech: 3.5, level: 5 },
    { id: 'bot2', name: 'SYNTH_7',   color: '#0088ff', region: 'EU', credits: 2100, crystals: 180, tech: 2.0, level: 3 },
    { id: 'bot3', name: 'VOID_EX',   color: '#ffcc00', region: 'AS', credits: 1500, crystals:  90, tech: 1.5, level: 2 }
  );

  // Post welcome chat messages
  setTimeout(() => {
    appendChatMessage({ sender: 'SYSTEM',   text: 'Sector node connected. Operating in local grid mode.', color: '#00ffcc', time: now() });
    appendChatMessage({ sender: 'NOVA_PRIME', text: 'Welcome, new architect!',       color: '#ff0055', time: now() });
    appendChatMessage({ sender: 'SYNTH_7',    text: 'Grid is yours. Build wisely.', color: '#0088ff', time: now() });
  }, 800);

  localSimInterval = setInterval(() => {
    localTick++;

    // Resource income every tick
    clientState.credits  += 12 + clientState.level * 3;
    clientState.crystals += 2  + clientState.level;
    clientState.tech     += 0.05;

    // Level-up every 100 ticks
    if (localTick % 100 === 0) {
      clientState.level = Math.min(clientState.level + 1, 50);
      appendChatMessage({ sender: 'SYSTEM', text: `ARCHITECT LEVEL UP! You are now Level ${clientState.level}.`, color: '#00ffcc', time: now() });
    }

    // Random weather changes
    localWeatherCountdown--;
    if (localWeatherCountdown <= 0) {
      localWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      localWeatherCountdown = 45 + Math.floor(Math.random() * 60);
      clientState.weather = localWeather;
    }

    clientState.tick = localTick;
    clientState.players = [
      { id: clientState.playerId, name: clientState.playerName, color: clientState.playerColor, region: 'Local', credits: clientState.credits, crystals: clientState.crystals, tech: clientState.tech, level: clientState.level },
      ...localPlayers
    ];
    clientState.structures = localStructures;
    clientState.drones = localDrones;
    clientState.weather = localWeather;

    updateHUD();

    // Notify game.js render sync
    const fakeSyncData = {
      tick: localTick,
      weather: { current: localWeather },
      globalEvent: null,
      structures: localStructures,
      drones: localDrones,
      players: clientState.players
    };
    syncListeners.forEach(fn => fn(fakeSyncData));
  }, 1000);
}

function now() { return new Date().toLocaleTimeString(); }

// Local draw handler — simulates building creation without server
export function localHandleDraw(points, mode) {
  if (points.length < 2) return;

  const id = 'local-' + Date.now();
  const centroid = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  centroid.x = Math.round(centroid.x / points.length);
  centroid.y = Math.round(centroid.y / points.length);

  // Detect closed loop vs open line
  const first = points[0], last = points[points.length - 1];
  const isLoop = Math.abs(first.x - last.x) <= 2 && Math.abs(first.y - last.y) <= 2;

  let structType = 'road';
  if (mode === 'logistics') structType = isLoop ? 'shield_dome'    : 'road';
  if (mode === 'utility')   structType = isLoop ? 'generator'      : 'power_line';
  if (mode === 'production') structType = isLoop ? 'factory'       : 'road';
  if (mode === 'combat')    structType = isLoop ? 'shield_dome'    : 'laser_wall';

  // Cost
  const costs = { road: 50, power_line: 80, generator: 200, factory: 300, shield_dome: 250, laser_wall: 120 };
  const cost = (costs[structType] || 80) * Math.max(1, points.length * 0.5);
  if (clientState.credits < cost) {
    triggerSystemNotice('INSUFFICIENT CREDITS!', 'error');
    return;
  }
  clientState.credits -= cost;

  const struct = {
    id,
    type: structType,
    points,
    centroid: { x: centroid.x, y: centroid.y },
    ownerId: clientState.playerId,
    ownerName: clientState.playerName,
    ownerColor: clientState.playerColor,
    level: 1,
    hp: 100,
    maxHp: 100,
    energyStored: 0
  };
  localStructures[id] = struct;
  clientState.structures = localStructures;
  structureSpawnListeners.forEach(fn => fn(struct));
  appendChatMessage({ sender: 'SYSTEM', text: `${structType.replace('_',' ').toUpperCase()} constructed!`, color: '#00ffcc', time: now() });
  updateHUD();
}

// Connect to backend WebSocket, fall back to local simulation on failure
export function connectToServer(username, color, region) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const urlParams = new URLSearchParams(window.location.search);
  const customWs = urlParams.get('ws');
  const socketUrl = customWs || `${protocol}//${window.location.host}`;

  clientState.playerName = username;
  clientState.playerColor = color;
  clientState.playerId = 'player-' + username.toLowerCase().replace(/\s+/g, '-');

  // Initialize audio immediately on user interaction
  initAudio();

  // Reveal HUD immediately — we'll sync resources once connected (or use local sim)
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  clientState.credits = 1000;
  clientState.crystals = 100;
  clientState.tech = 1.0;
  clientState.level = 1;
  updateHUD();
  playSound('select');

  // Attempt WebSocket connection with 4s timeout
  let wsConnected = false;
  let ws = null;

  try {
    ws = new WebSocket(socketUrl);
    clientState.socket = ws;

    const timeout = setTimeout(() => {
      if (!wsConnected) {
        console.warn('WebSocket timeout — starting local simulation mode.');
        ws.close();
        startLocalSim();
        appendChatMessage({ sender: 'SYSTEM', text: 'Server offline. Running in solo simulation mode.', color: '#ffcc00', time: now() });
      }
    }, 4000);

    ws.onopen = () => {
      wsConnected = true;
      clearTimeout(timeout);
      console.log('Connected to Neon Architect server');
      playSound('confirm');
      sendPayload({ type: 'auth', username, color, region });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = () => {
      if (!wsConnected) {
        clearTimeout(timeout);
        console.warn('WebSocket error — starting local simulation mode.');
        startLocalSim();
        appendChatMessage({ sender: 'SYSTEM', text: 'Server unreachable. Running in solo simulation mode.', color: '#ffcc00', time: now() });
      }
    };

    ws.onclose = () => {
      if (wsConnected) {
        console.log('Server disconnected. Switching to local simulation.');
        appendChatMessage({ sender: 'SYSTEM', text: 'Connection lost. Continuing in solo simulation mode.', color: '#ff0055', time: now() });
        if (!localSimInterval) startLocalSim();
      }
    };
  } catch(e) {
    console.warn('WebSocket not available — starting local simulation mode.');
    startLocalSim();
  }
}

// Send standard payload to server (no-op in local sim mode)
export function sendPayload(payload) {
  if (clientState.socket && clientState.socket.readyState === WebSocket.OPEN) {
    clientState.socket.send(JSON.stringify(payload));
  } else if (localSimInterval) {
    // Handle actions locally
    if (payload.type === 'draw') {
      localHandleDraw(payload.points, payload.mode);
    } else if (payload.type === 'chat') {
      appendChatMessage({ sender: clientState.playerName, text: payload.text, color: clientState.playerColor, time: now() });
    } else if (payload.type === 'upgrade') {
      const s = localStructures[payload.structureId];
      if (s) {
        const cost = s.level * 150;
        if (clientState.credits >= cost) {
          clientState.credits -= cost;
          s.level++;
          s.maxHp += 50;
          s.hp = s.maxHp;
          updateHUD();
          triggerSystemNotice('STRUCTURE UPGRADED!', 'success');
        } else {
          triggerSystemNotice('INSUFFICIENT CREDITS!', 'error');
        }
      }
    } else if (payload.type === 'recycle') {
      const s = localStructures[payload.structureId];
      if (s) {
        clientState.credits += 80;
        delete localStructures[payload.structureId];
        updateHUD();
        triggerSystemNotice('STRUCTURE RECYCLED', 'success');
      }
    } else if (payload.type === 'hack') {
      triggerSystemNotice('CANNOT HACK IN SOLO MODE', 'error');
    } else if (payload.type === 'tech_unlock') {
      const costs = { grid: 2.0, laser: 3.5, shields: 5.0, reactors: 8.0, quantum: 15.0 };
      const req = costs[payload.node] || 2.0;
      if (clientState.tech >= req) {
        clientState.tech -= req;
        clientState.unlockedTech.add(payload.node);
        const nodeEl = document.getElementById(`node-${payload.node}`);
        if (nodeEl) {
          nodeEl.classList.remove('locked');
          nodeEl.classList.add('unlocked');
          const btn = nodeEl.querySelector('.unlock-tech-btn');
          if (btn) btn.innerText = 'Unlocked';
        }
        updateHUD();
        triggerSystemNotice('BLUEPRINT UNLOCKED!', 'success');
        playSound('confirm');
      } else {
        triggerSystemNotice(`NEED ${req} TECH POINTS`, 'error');
      }
    }
  }
}

// Route message handlers
function handleServerMessage(data) {
  switch (data.type) {
    case 'auth_success': {
      clientState.playerId = data.player.id;
      clientState.credits = data.player.credits;
      clientState.crystals = data.player.crystals;
      clientState.tech = data.player.tech;
      clientState.level = data.player.level;

      // Reveal HUD
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('hud').classList.remove('hidden');
      updateHUD();
      playSound('confirm');
      break;
    }

    case 'alliance_reply': {
      clientState.credits = data.credits;
      clientState.myAlliance = data.alliance;
      const self = clientState.players.find(p => p.id === clientState.playerId);
      if (self) self.guild = data.alliance.name;
      updateHUD();
      updateAllianceUI();
      playSound('confirm');
      break;
    }

    case 'sync': {
      clientState.tick = data.tick;
      clientState.weather = data.weather.current;
      clientState.globalEvent = data.globalEvent;
      clientState.structures = data.structures;
      clientState.drones = data.drones;
      clientState.players = data.players;

      // Sync player credentials
      const self = data.players.find(p => p.id === clientState.playerId);
      if (self) {
        clientState.credits = self.credits;
        clientState.crystals = self.crystals;
        clientState.tech = self.tech;
        clientState.level = self.level;
      }

      updateHUD();
      
      // Update custom structure inspector if active
      if (clientState.selectedStructureId) {
        const selected = clientState.structures[clientState.selectedStructureId];
        if (selected) {
          updateInspector(selected);
        } else {
          closeInspector();
        }
      }

      // Notify game.js
      syncListeners.forEach(listener => listener(data));
      break;
    }

    case 'structure_spawn': {
      playSound('build');
      structureSpawnListeners.forEach(listener => listener(data.structure));
      break;
    }

    case 'chat': {
      appendChatMessage(data.chat);
      break;
    }

    case 'draw_success': {
      clientState.credits = data.credits;
      clientState.crystals = data.crystals;
      updateHUD();
      break;
    }

    case 'hack_reply': {
      clientState.credits = data.credits;
      updateHUD();
      break;
    }

    case 'hack_alert': {
      playSound('hack');
      // Show warning banner
      appendChatMessage({
        sender: 'SECURITY',
        text: data.msg,
        color: '#ff0055',
        time: new Date().toLocaleTimeString()
      });
      break;
    }

    case 'upgrade_reply': {
      clientState.credits = data.credits;
      updateHUD();
      playSound('confirm');
      break;
    }

    case 'tech_reply': {
      clientState.tech = data.tech;
      clientState.level = data.level;
      clientState.unlockedTech.add(data.unlocked);
      
      // Update specific tech node appearance
      const nodeEl = document.getElementById(`node-${data.unlocked}`);
      if (nodeEl) {
        nodeEl.classList.remove('locked');
        nodeEl.classList.add('unlocked');
        const btn = nodeEl.querySelector('.unlock-tech-btn');
        if (btn) btn.innerText = 'Unlocked';
      }

      updateHUD();
      playSound('confirm');
      break;
    }

    case 'alert': {
      // Create visual neon notification overlay
      triggerSystemNotice(data.message, data.alertType);
      if (data.alertType === 'error') playSound('error');
      break;
    }

    case 'reset_world': {
      window.location.reload();
      break;
    }
  }
}

// Draw/HUD Update Loops
function updateHUD() {
  document.getElementById('hud-username').innerText = clientState.playerName;
  document.getElementById('hud-level').innerText = clientState.level;
  document.getElementById('avatar-color-dot').style.backgroundColor = clientState.playerColor;
  document.getElementById('avatar-color-dot').style.boxShadow = `0 0 10px ${clientState.playerColor}`;

  document.getElementById('res-credits').innerText = Math.floor(clientState.credits);
  document.getElementById('res-crystals').innerText = Math.floor(clientState.crystals);
  document.getElementById('res-tech').innerText = clientState.tech.toFixed(1);

  document.getElementById('tick-val').innerText = clientState.tick;

  // Weather rendering
  const weatherVal = document.getElementById('weather-val');
  const weatherAlert = document.getElementById('weather-alert');
  
  weatherAlert.className = `weather-pill ${clientState.weather}-weather`;
  
  let wName = 'CLEAR SKY';
  let wIcon = 'sun';
  if (clientState.weather === 'rain') { wName = 'ACID RAIN'; wIcon = 'cloud-rain'; }
  if (clientState.weather === 'solar_storm') { wName = 'SOLAR FLARE'; wIcon = 'zap'; }
  if (clientState.weather === 'blackout') { wName = 'GRID BLACKOUT'; wIcon = 'power-off'; }
  if (clientState.weather === 'meteor_shower') { wName = 'METEOR DRIFT'; wIcon = 'sparkles'; }
  if (clientState.weather === 'emp_storm') { wName = 'EMP RADIATION'; wIcon = 'activity'; }

  weatherVal.innerText = wName;
  const wPillIcon = weatherAlert.querySelector('i');
  if (wPillIcon) wPillIcon.setAttribute('data-lucide', wIcon);

  // Global Event rendering
  const eventVal = document.getElementById('event-val');
  const eventAlert = document.getElementById('event-alert');

  if (clientState.globalEvent) {
    eventAlert.classList.remove('hidden');
    eventVal.innerText = clientState.globalEvent.replace('_', ' ').toUpperCase();
  } else {
    eventAlert.classList.add('hidden');
  }

  // Active Players Leaderboard
  const listEl = document.getElementById('active-players-list');
  listEl.innerHTML = '';
  // Sort players by level then crystals
  const sorted = [...clientState.players].sort((a,b) => (b.level * 1000 + b.crystals) - (a.level * 1000 + a.crystals));
  sorted.forEach(p => {
    const item = document.createElement('div');
    item.className = 'player-list-item';
    item.innerHTML = `
      <span style="color: ${p.color}; font-weight: bold;">${p.name} (Lvl ${p.level})</span>
      <span>${Math.floor(p.credits)} Cr</span>
    `;
    listEl.appendChild(item);
  });

  updateNetworkUI();

  // Reinitialize Lucide Icons
  lucide.createIcons();
}

function updateNetworkUI() {
  // 1. Update Sector Players list in Friends Hub
  const sectorList = document.getElementById('net-sector-players');
  if (sectorList) {
    sectorList.innerHTML = '';
    clientState.players.forEach(p => {
      if (p.id === clientState.playerId) return; // Skip self

      const isFriend = clientState.friends.has(p.id);
      const item = document.createElement('div');
      item.className = 'player-list-item';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.marginBottom = '6px';
      
      item.innerHTML = `
        <span style="color: ${p.color}; font-weight: bold;">${p.name} (Lvl ${p.level})</span>
        <button class="neon-btn btn-sm ${isFriend ? 'red-glow' : 'cyan-glow'}" data-fid="${p.id}" style="width: auto; padding: 4px 8px;">
          ${isFriend ? 'Remove' : 'Add Friend'}
        </button>
      `;

      // Bind add/remove friend click
      const btn = item.querySelector('button');
      btn.addEventListener('click', () => {
        if (isFriend) {
          clientState.friends.delete(p.id);
        } else {
          clientState.friends.add(p.id);
        }
        localStorage.setItem('network-friends', JSON.stringify(Array.from(clientState.friends)));
        updateHUD();
        playSound('select');
      });

      sectorList.appendChild(item);
    });

    if (sectorList.children.length === 0) {
      sectorList.innerHTML = '<div class="player-list-item empty-list">No other architects detected in this sector.</div>';
    }
  }

  // 2. Update secure friends list
  const friendsList = document.getElementById('net-friends-list');
  if (friendsList) {
    friendsList.innerHTML = '';
    clientState.friends.forEach(fid => {
      // Find player profile online
      const p = clientState.players.find(x => x.id === fid);
      const item = document.createElement('div');
      item.className = 'player-list-item';
      
      if (p) {
        item.innerHTML = `
          <span style="color: ${p.color}; font-weight: bold;">${p.name} (Lvl ${p.level})</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">ONLINE - Sector: ${p.region}</span>
        `;
      } else {
        item.innerHTML = `
          <span style="color: var(--text-muted); font-weight: bold;">Architect Offline</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">SECURE TUNNEL OFFLINE</span>
        `;
      }
      friendsList.appendChild(item);
    });

    if (clientState.friends.size === 0) {
      friendsList.innerHTML = '<div class="player-list-item empty-list">No contacts established. Add friends from the sector list!</div>';
    }
  }

  // 3. Update Trade Contacts dropdown
  const tradeSelect = document.getElementById('trade-recipient-select');
  if (tradeSelect) {
    // Save current selection
    const currentVal = tradeSelect.value;
    tradeSelect.innerHTML = '<option value="">SELECT FRIEND OR ALLY...</option>';
    
    clientState.friends.forEach(fid => {
      const p = clientState.players.find(x => x.id === fid);
      if (p) {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.innerText = `${p.name} (Lvl ${p.level}) - ${p.region}`;
        tradeSelect.appendChild(opt);
      }
    });
    
    // Restore selection if recipient is still online
    tradeSelect.value = currentVal;
  }
}

function updateAllianceUI() {
  const panel = document.getElementById('net-alliance-panel');
  if (panel) {
    if (clientState.myAlliance) {
      panel.innerHTML = `
        <h4 class="cyan-text" style="font-family: var(--font-title); font-size: 0.95rem;">${clientState.myAlliance.name.toUpperCase()}</h4>
        <div class="stat-line">Founder: <span class="cyan-text">You</span></div>
        <div class="stat-line">Secure Alliance Network: <span style="color: #00ff55;">ACTIVE</span></div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px;">Your alliance channel is now open in your bottom left chat module.</p>
      `;
    } else {
      panel.innerHTML = `<p class="empty-inspector">You are not currently affiliated with any alliance.</p>`;
    }
  }
}

export function inspectBuilding(structure) {
  clientState.selectedStructureId = structure.id;
  
  const content = document.getElementById('inspector-content');
  const empty = document.querySelector('.empty-inspector');
  
  content.classList.remove('hidden');
  empty.classList.add('hidden');

  updateInspector(structure);
}

function updateInspector(struct) {
  document.getElementById('inspect-title').innerText = struct.type.replace('_', ' ').toUpperCase();
  document.getElementById('inspect-owner').innerText = struct.ownerName;
  document.getElementById('inspect-owner').style.color = struct.ownerColor;
  document.getElementById('inspect-level').innerText = struct.level;
  document.getElementById('inspect-hp').innerText = `${struct.hp}/${struct.maxHp}`;
  document.getElementById('inspect-energy').innerText = Math.floor(struct.energyStored);

  const upgradeBtn = document.getElementById('inspect-upgrade-btn');
  const hackBtn = document.getElementById('inspect-hack-btn');
  const recycleBtn = document.getElementById('inspect-recycle-btn');

  // Upgrade costs scale
  const upCost = struct.level * 150;
  upgradeBtn.innerText = `Upgrade (${upCost} Cr)`;

  if (struct.ownerId === clientState.playerId) {
    upgradeBtn.classList.remove('hidden');
    recycleBtn.classList.remove('hidden');
    hackBtn.classList.add('hidden');
  } else {
    upgradeBtn.classList.add('hidden');
    recycleBtn.classList.add('hidden');
    hackBtn.classList.remove('hidden');
  }
}

export function closeInspector() {
  clientState.selectedStructureId = null;
  document.getElementById('inspector-content').classList.add('hidden');
  document.querySelector('.empty-inspector').classList.remove('hidden');
}

function appendChatMessage(chat) {
  const container = document.getElementById('chat-messages');
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-msg';
  msgEl.innerHTML = `
    <span style="color: ${chat.color};" class="chat-sender">[${chat.sender}]:</span>
    <span>${chat.text}</span>
  `;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
}

function triggerSystemNotice(message, type) {
  const notice = document.createElement('div');
  notice.style.position = 'absolute';
  notice.style.bottom = '200px';
  notice.style.left = '50%';
  notice.style.transform = 'translateX(-50%)';
  notice.style.padding = '12px 24px';
  notice.style.borderRadius = '4px';
  notice.style.fontFamily = 'var(--font-title)';
  notice.style.fontSize = '0.85rem';
  notice.style.fontWeight = 'bold';
  notice.style.border = '2px solid';
  notice.style.zIndex = '200';
  notice.style.transition = 'all 0.4s';
  notice.style.pointerEvents = 'none';

  if (type === 'error') {
    notice.style.backgroundColor = 'rgba(255,0,85,0.9)';
    notice.style.borderColor = varColor('--rose');
    notice.style.boxShadow = '0 0 15px rgba(255,0,85,0.5)';
  } else {
    notice.style.backgroundColor = 'rgba(0,255,204,0.9)';
    notice.style.borderColor = varColor('--cyan');
    notice.style.boxShadow = '0 0 15px rgba(0,255,204,0.5)';
    notice.style.color = '#000';
  }

  notice.innerText = message.toUpperCase();
  document.body.appendChild(notice);

  setTimeout(() => {
    notice.style.opacity = '0';
    setTimeout(() => notice.remove(), 400);
  }, 2200);
}

function varColor(variable) {
  return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
}

// BIND DOM EVENT LISTENERS
function bindUI() {
  // Color Picker Pick
  const colorBtns = document.querySelectorAll('.color-btn');
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      clientState.playerColor = btn.getAttribute('data-color');
      playSound('select');
    });
  });

  // Join Game
  document.getElementById('join-btn').addEventListener('click', () => {
    const input = document.getElementById('username-input');
    const username = input.value.trim().toUpperCase();
    const region = document.getElementById('region-select').value;
    
    if (username.length < 3) {
      alert('CODENAME MUST BE AT LEAST 3 CHARACTERS!');
      return;
    }

    // Set admin view availability if player is ADMIN
    if (username === 'ROOT' || username === 'ADMIN') {
      document.getElementById('admin-toggle-btn').classList.remove('hidden');
    }

    connectToServer(username, clientState.playerColor, region);
  });

  // Tool Selection
  const toolBtns = document.querySelectorAll('.tool-btn');
  const hintText = document.getElementById('drawing-hint-text');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      clientState.activeMode = btn.getAttribute('data-mode');
      playSound('select');

      let desc = '';
      if (clientState.activeMode === 'logistics') desc = 'Mode: Logistics. Drag cursor to draw roads connecting coordinates.';
      if (clientState.activeMode === 'utility') desc = 'Mode: Utility. Drag to build power lines. Loops create Energy Generators.';
      if (clientState.activeMode === 'production') desc = 'Mode: Industry. Loops create Factories, Markets, or Research Labs.';
      if (clientState.activeMode === 'combat') desc = 'Mode: Combat. Lines create Laser Walls. Loops build Shield Domes.';
      
      hintText.innerText = desc;
    });
  });

  // Send Chat
  const chatInput = document.getElementById('chat-input');
  const sendChat = () => {
    const text = chatInput.value.trim();
    if (text.length > 0) {
      const activeTab = document.querySelector('.chat-tab.active');
      const channel = activeTab ? activeTab.getAttribute('data-channel') : 'global';
      sendPayload({
        type: 'chat',
        text,
        channel
      });
      chatInput.value = '';
    }
  };

  document.getElementById('chat-send-btn').addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChat();
  });

  // Chat channels switching
  const tabs = document.querySelectorAll('.chat-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      playSound('select');
    });
  });

  // Inspector Actions
  document.getElementById('inspect-upgrade-btn').addEventListener('click', () => {
    if (clientState.selectedStructureId) {
      sendPayload({
        type: 'upgrade',
        structureId: clientState.selectedStructureId
      });
    }
  });

  document.getElementById('inspect-hack-btn').addEventListener('click', () => {
    if (clientState.selectedStructureId) {
      sendPayload({
        type: 'hack',
        targetId: clientState.selectedStructureId
      });
    }
  });

  document.getElementById('inspect-recycle-btn').addEventListener('click', () => {
    if (clientState.selectedStructureId) {
      sendPayload({
        type: 'recycle',
        structureId: clientState.selectedStructureId
      });
      closeInspector();
    }
  });

  // Modal Dialogs
  const techModal = document.getElementById('tech-modal');
  document.getElementById('tech-tree-btn').addEventListener('click', () => {
    techModal.classList.remove('hidden');
    playSound('select');
  });
  document.getElementById('close-tech-btn').addEventListener('click', () => {
    techModal.classList.add('hidden');
    playSound('select');
  });

  // Global Network Modal Dialogs
  const networkModal = document.getElementById('network-modal');
  document.getElementById('network-hub-btn').addEventListener('click', () => {
    networkModal.classList.remove('hidden');
    updateHUD();
    playSound('select');
  });
  document.getElementById('close-network-btn').addEventListener('click', () => {
    networkModal.classList.add('hidden');
    playSound('select');
  });

  // Toggle Network Modal Sub-Tabs
  const netTabBtns = document.querySelectorAll('.network-tab-btn');
  netTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      netTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      playSound('select');
      
      const targetTab = btn.getAttribute('data-nettab');
      document.querySelectorAll('.net-tab-content').forEach(el => el.classList.add('hidden'));
      document.getElementById(`nettab-${targetTab}`).classList.remove('hidden');
    });
  });

  // Alliance Founding Click
  document.getElementById('net-create-alliance-btn').addEventListener('click', () => {
    const input = document.getElementById('alliance-name-input');
    const name = input.value.trim();
    if (name.length >= 3) {
      sendPayload({
        type: 'alliance_found',
        allianceName: name
      });
      input.value = '';
    } else {
      alert('Alliance name must be at least 3 characters!');
    }
  });

  // Diplomacy Trade Click
  document.getElementById('net-send-trade-btn').addEventListener('click', () => {
    const select = document.getElementById('trade-recipient-select');
    const targetId = select.value;
    const creds = parseInt(document.getElementById('trade-credits-input').value) || 0;
    const crysts = parseInt(document.getElementById('trade-crystals-input').value) || 0;
    
    if (!targetId) {
      alert('Please select a recipient contact!');
      return;
    }
    if (creds <= 0 && crysts <= 0) {
      alert('Please specify credits or crystals to send!');
      return;
    }

    sendPayload({
      type: 'send_resources',
      targetPlayerId: targetId,
      credits: creds,
      crystals: crysts
    });
    playSound('confirm');
    document.getElementById('trade-credits-input').value = 0;
    document.getElementById('trade-crystals-input').value = 0;
  });

  const adminModal = document.getElementById('admin-modal');
  document.getElementById('admin-toggle-btn').addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    playSound('select');
  });
  document.getElementById('close-admin-btn').addEventListener('click', () => {
    adminModal.classList.add('hidden');
    playSound('select');
  });

  // Technology Unlocking
  const unlockBtns = document.querySelectorAll('.unlock-tech-btn');
  unlockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const node = btn.getAttribute('data-node');
      sendPayload({
        type: 'tech_unlock',
        node
      });
    });
  });

  // Admin triggers
  const weatherTriggers = document.querySelectorAll('.weather-trigger');
  weatherTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      sendPayload({
        type: 'admin_event',
        eventType: btn.getAttribute('data-weather')
      });
      playSound('confirm');
    });
  });

  const eventTriggers = document.querySelectorAll('.event-trigger');
  eventTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      sendPayload({
        type: 'admin_event',
        eventType: btn.getAttribute('data-event')
      });
      playSound('confirm');
    });
  });

  document.getElementById('admin-reset-btn').addEventListener('click', () => {
    if (confirm('REALLY WIPE COMPLETE SERVER WORLD HISTORY?')) {
      sendPayload({
        type: 'admin_event',
        eventType: 'reset'
      });
    }
  });

  // Audio system controls hooks
  document.getElementById('mute-btn').addEventListener('click', () => {
    const icon = document.getElementById('mute-icon');
    const isMuted = icon.getAttribute('data-lucide') === 'volume-x';
    
    if (isMuted) {
      icon.setAttribute('data-lucide', 'volume-2');
      window.audioCtx && window.audioCtx.resume();
      window.isAudioMuted = false;
    } else {
      icon.setAttribute('data-lucide', 'volume-x');
      window.audioCtx && window.audioCtx.suspend();
      window.isAudioMuted = true;
    }
    lucide.createIcons();
  });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  bindUI();
} else {
  document.addEventListener('DOMContentLoaded', bindUI);
}
