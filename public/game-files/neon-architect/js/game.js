// ==========================================
// NEON ARCHITECT - THREE.JS RENDER PIPELINE
// ==========================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { clientState, onSyncUpdate, onStructureSpawn, inspectBuilding, closeInspector } from './ui.js';
import { initDrawingHelpers, setupDrawingInputs } from './drawing.js';

let scene, camera, renderer, controls;
const structureMeshes = new Map(); // id -> THREE.Group
const droneMeshes = new Map(); // id -> THREE.Mesh or THREE.Group
let rainParticles;
let rainGeometry;
let lightningLight;
let ambientLight, dirLight;
let proceduralSky;

// Custom shaders or materials
const materials = {
  grid: new THREE.LineBasicMaterial({ color: 0x051a3a, transparent: true, opacity: 0.8 }),
  shield: new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.15,
    wireframe: true,
    side: THREE.DoubleSide
  }),
  laserWall: new THREE.MeshBasicMaterial({
    color: 0xff0055,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  }),
  road: new THREE.MeshBasicMaterial({ color: 0x0d0d16, side: THREE.DoubleSide }),
  roadBorder: new THREE.LineBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 }),
  powerLine: new THREE.LineBasicMaterial({ color: 0xffcc00 }),
  generator: new THREE.MeshStandardMaterial({ color: 0x222533, roughness: 0.4, metalness: 0.8 }),
  generatorCore: new THREE.MeshBasicMaterial({ color: 0x00ffcc }),
  factory: new THREE.MeshStandardMaterial({ color: 0x1d1e26, roughness: 0.5, metalness: 0.7 }),
  factoryWindow: new THREE.MeshBasicMaterial({ color: 0xff00ff }),
  market: new THREE.MeshStandardMaterial({ color: 0x252836, roughness: 0.6 }),
  marketHolo: new THREE.MeshBasicMaterial({ color: 0x0088ff, transparent: true, opacity: 0.5, wireframe: true }),
  lab: new THREE.MeshStandardMaterial({ color: 0x2d3247, roughness: 0.3, metalness: 0.9 }),
  labBeam: new THREE.MeshBasicMaterial({ color: 0x9900ff, transparent: true, opacity: 0.7 }),
  tower: new THREE.MeshStandardMaterial({ color: 0x151722, roughness: 0.3, metalness: 0.9 }),
  towerLaser: new THREE.MeshBasicMaterial({ color: 0xff0055 })
};

// Initialize scene
function init3D() {
  const container = document.getElementById('game-canvas');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020208);
  scene.fog = new THREE.FogExp2(0x020208, 0.015);

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 45, 60);

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
  controls.minDistance = 10;
  controls.maxDistance = 250;

  // Lights
  ambientLight = new THREE.AmbientLight(0x22243d, 1.8);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0x00ffcc, 1.5);
  dirLight.position.set(50, 80, 50);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 250;
  const d = 100;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Lightning element
  lightningLight = new THREE.PointLight(0xffffff, 0, 300);
  lightningLight.position.set(0, 100, 0);
  scene.add(lightningLight);

  // Grid
  buildNeonGrid();

  // Procedural Sky / Sun
  buildProceduralSky();

  // Weather Rain setup
  buildRainSystem();

  // Initialize helpers
  initDrawingHelpers(scene);
  setupDrawingInputs(camera, scene, renderer, controls);

  // Setup raycasting for building clicks
  setupInspectorRaycast();

  // Bind WebSocket listeners
  onSyncUpdate((data) => syncWorldState(data));

  // Handle Resize
  window.addEventListener('resize', onWindowResize);

  // Run Render Loop
  animate();
}

function buildNeonGrid() {
  const size = 300;
  const divisions = 300;
  
  // Custom double lines grid for cyberpunk grid spacing
  const gridHelper = new THREE.GridHelper(size, divisions, 0x00ffcc, 0x0c254e);
  gridHelper.position.y = 0.01;
  // Apply opacity to grid materials
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.75;
  scene.add(gridHelper);
}

function buildProceduralSky() {
  // A glowing neon core mesh far away representing a mega tokamak energy core sun
  const sunGeo = new THREE.SphereGeometry(15, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc });
  proceduralSky = new THREE.Mesh(sunGeo, sunMat);
  proceduralSky.position.set(0, -10, -180);
  scene.add(proceduralSky);
  
  // Emissive circular ring around sun
  const ringGeo = new THREE.RingGeometry(20, 24, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
  const sunRing = new THREE.Mesh(ringGeo, ringMat);
  sunRing.rotation.y = 0.1;
  proceduralSky.add(sunRing);
}

function buildRainSystem() {
  const count = 1200;
  rainGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = Math.random() * 80;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    velocities.push(-0.5 - Math.random() * 0.5); // Fall speed
  }

  rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const rainMat = new THREE.PointsMaterial({
    color: 0x0088ff,
    size: 0.18,
    transparent: true,
    opacity: 0.6
  });

  rainParticles = new THREE.Points(rainGeometry, rainMat);
  rainParticles.visible = false;
  scene.add(rainParticles);

  // Store velocities
  rainParticles.userData = { velocities };
}

// Inspect structure raycaster
function setupInspectorRaycast() {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  renderer.domElement.addEventListener('click', (e) => {
    // Prevent raycasting when dragging or drawing
    if (controls.state !== -1 || !clientState.playerId) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Collect all building mesh groups
    const targets = [];
    structureMeshes.forEach((meshGroup, id) => {
      // Raycast children
      meshGroup.traverse(child => {
        if (child.isMesh) {
          child.userData = { parentId: id }; // link to building ID
          targets.push(child);
        }
      });
    });

    const intersects = raycaster.intersectObjects(targets);
    if (intersects.length > 0) {
      const structId = intersects[0].object.userData.parentId;
      const struct = clientState.structures[structId];
      if (struct) {
        inspectBuilding(struct);
        // Highlight mesh
        highlightMesh(structId);
        return;
      }
    }

    closeInspector();
    removeHighlights();
  });
}

function highlightMesh(structId) {
  removeHighlights();
  const group = structureMeshes.get(structId);
  if (group) {
    // Add a glowing ring helper or scale it slightly
    const bbox = new THREE.BoxHelper(group, 0x00ffcc);
    bbox.name = 'highlight-box';
    scene.add(bbox);
  }
}

function removeHighlights() {
  const existing = scene.getObjectByName('highlight-box');
  if (existing) scene.remove(existing);
}

// Sync entities from backend snapshot
function syncWorldState(data) {
  const currentStructIds = new Set();
  const currentDroneIds = new Set();

  // 1. Sync Structures
  Object.keys(data.structures).forEach(id => {
    currentStructIds.add(id);
    const struct = data.structures[id];
    
    if (!structureMeshes.has(id)) {
      // Create new structure mesh group
      const group = buildStructureMesh(struct);
      scene.add(group);
      structureMeshes.set(id, group);
    } else {
      // Update existing structure (scale, height, color transitions, level upgrades)
      updateStructureMesh(id, struct);
    }
  });

  // Remove deleted structures
  structureMeshes.forEach((mesh, id) => {
    if (!currentStructIds.has(id)) {
      scene.remove(mesh);
      // Spawn explosion particle cluster
      spawnExplosion(mesh.position);
      structureMeshes.delete(id);
    }
  });

  // 2. Sync Drones
  data.drones.forEach(drone => {
    currentDroneIds.add(drone.id);

    if (!droneMeshes.has(drone.id)) {
      const mesh = buildDroneMesh(drone);
      scene.add(mesh);
      droneMeshes.set(drone.id, mesh);
    } else {
      const mesh = droneMeshes.get(drone.id);
      mesh.position.set(drone.x, drone.type === 'logistics' ? 1.5 : 4.0, drone.y);
    }
  });

  // Remove deleted drones
  droneMeshes.forEach((mesh, id) => {
    if (!currentDroneIds.has(id)) {
      scene.remove(mesh);
      droneMeshes.delete(id);
    }
  });

  // 3. Sync Weather atmospheric settings
  updateAtmosphericLighting(data.weather.current, data.weather.intensity);
}

// Helper for adding emissive neon wireframes to dark structural blocks
function addGlowingEdges(mesh, geometry, color) {
  const edges = new THREE.EdgesGeometry(geometry);
  const lineMat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.85
  });
  const line = new THREE.LineSegments(edges, lineMat);
  mesh.add(line);
}

// Construct procedural building models
function buildStructureMesh(struct) {
  const group = new THREE.Group();
  group.position.set(struct.x, 0, struct.y);

  const themeColor = new THREE.Color(struct.ownerColor);

  switch (struct.type) {
    case 'road': {
      // Create a linear path along the drawing points
      const roadGroup = new THREE.Group();
      const pathPoints = struct.points.map(p => new THREE.Vector3(p.x - struct.x, 0.02, p.y - struct.y));
      
      for (let i = 1; i < pathPoints.length; i++) {
        const p1 = pathPoints[i-1];
        const p2 = pathPoints[i];
        const distance = p1.distanceTo(p2);
        
        // Road segment flat rectangle plane
        const roadGeo = new THREE.PlaneGeometry(0.8, distance);
        roadGeo.rotateX(-Math.PI / 2);
        
        const segment = new THREE.Mesh(roadGeo, materials.road);
        segment.position.copy(p1).add(p2).multiplyScalar(0.5);
        segment.lookAt(p2);
        segment.rotateY(Math.PI / 2);
        
        // Dual edge glowing guides offset to left and right
        const dir = p2.clone().sub(p1).normalize();
        const normal = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(0.4); // 0.4 units offset
        
        const leftP1 = p1.clone().add(normal);
        const leftP2 = p2.clone().add(normal);
        const rightP1 = p1.clone().sub(normal);
        const rightP2 = p2.clone().sub(normal);

        const leftGeo = new THREE.BufferGeometry().setFromPoints([leftP1, leftP2]);
        const rightGeo = new THREE.BufferGeometry().setFromPoints([rightP1, rightP2]);
        
        const edgeMat = new THREE.LineBasicMaterial({ color: themeColor, transparent: true, opacity: 0.85 });
        const leftLine = new THREE.Line(leftGeo, edgeMat);
        const rightLine = new THREE.Line(rightGeo, edgeMat);
        leftLine.position.y = 0.03;
        rightLine.position.y = 0.03;
        
        roadGroup.add(segment);
        roadGroup.add(leftLine);
        roadGroup.add(rightLine);
      }
      group.add(roadGroup);
      break;
    }

    case 'power_line': {
      const roadGroup = new THREE.Group();
      const pathPoints = struct.points.map(p => new THREE.Vector3(p.x - struct.x, 0.05, p.y - struct.y));
      
      // Wire line connecting all points
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffcc00 });
      const wire = new THREE.Line(lineGeo, lineMat);
      roadGroup.add(wire);

      // Small transmission poles at each point
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.8, 6);
      pathPoints.forEach(pt => {
        const pole = new THREE.Mesh(poleGeo, materials.generator);
        pole.position.copy(pt).setY(0.9);
        addGlowingEdges(pole, poleGeo, 0xffcc00);
        
        // Small yellow beacon
        const beaconGeo = new THREE.SphereGeometry(0.12, 6, 6);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.y = 1.0;
        pole.add(beacon);

        roadGroup.add(pole);
      });
      group.add(roadGroup);
      break;
    }

    case 'energy_generator': {
      // Cylinder with spinning components
      const cylinderGeo = new THREE.CylinderGeometry(1.5, 1.8, 3.5, 16);
      const mainBody = new THREE.Mesh(cylinderGeo, materials.generator);
      mainBody.position.y = 1.75;
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      addGlowingEdges(mainBody, cylinderGeo, themeColor);
      group.add(mainBody);

      // Glowing core
      const coreGeo = new THREE.CylinderGeometry(0.8, 0.8, 3.7, 8);
      const coreMat = new THREE.MeshBasicMaterial({ color: themeColor });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.name = 'spinning-ring';
      core.position.y = 1.75;
      group.add(core);

      // Ground energy ripple disc
      const diskGeo = new THREE.RingGeometry(0.1, 2.5, 32);
      diskGeo.rotateX(-Math.PI / 2);
      const diskMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const ripple = new THREE.Mesh(diskGeo, diskMat);
      ripple.position.y = 0.05;
      ripple.name = 'pulsating-disk';
      group.add(ripple);
      break;
    }

    case 'factory': {
      // Main block building
      const boxGeo = new THREE.BoxGeometry(3.5, 4.0, 3.5);
      const body = new THREE.Mesh(boxGeo, materials.factory);
      body.position.y = 2.0;
      body.castShadow = true;
      body.receiveShadow = true;
      addGlowingEdges(body, boxGeo, themeColor);
      group.add(body);

      // Windows
      const winGeo = new THREE.BoxGeometry(3.6, 0.4, 2.5);
      const winMat = new THREE.MeshBasicMaterial({ color: themeColor });
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0, 2.5, 0);
      group.add(win);

      // Smoke stacks
      const stackGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.0, 8);
      const stack = new THREE.Mesh(stackGeo, materials.factory);
      stack.position.set(1.0, 4.5, 1.0);
      addGlowingEdges(stack, stackGeo, themeColor);
      group.add(stack);
      break;
    }

    case 'market': {
      // A hollow structure with floating neon billboard hologram
      const standGeo = new THREE.BoxGeometry(0.4, 4.0, 0.4);
      
      // 4 Corner Pillars
      for (let x = -2; x <= 2; x += 4) {
        for (let z = -2; z <= 2; z += 4) {
          const pillar = new THREE.Mesh(standGeo, materials.market);
          pillar.position.set(x, 2.0, z);
          pillar.castShadow = true;
          addGlowingEdges(pillar, standGeo, themeColor);
          group.add(pillar);
        }
      }

      // Ceiling plate
      const ceilGeo = new THREE.BoxGeometry(4.6, 0.4, 4.6);
      const ceil = new THREE.Mesh(ceilGeo, materials.market);
      ceil.position.y = 4.0;
      addGlowingEdges(ceil, ceilGeo, themeColor);
      group.add(ceil);

      // Holographic Billboard rotating inside
      const holoGeo = new THREE.SphereGeometry(1.5, 8, 8);
      const holoMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.4, wireframe: true });
      const hologram = new THREE.Mesh(holoGeo, holoMat);
      hologram.position.y = 2.0;
      hologram.name = 'rotating-holo';
      group.add(hologram);
      break;
    }

    case 'research_lab': {
      // Futuristic dome
      const domeGeo = new THREE.SphereGeometry(2.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, materials.lab);
      dome.position.y = 0;
      dome.castShadow = true;
      addGlowingEdges(dome, domeGeo, themeColor);
      group.add(dome);

      // Vertical energy lab beam ascending to sky
      const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.6 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 12.5;
      group.add(beam);
      break;
    }

    case 'defense_tower': {
      // Tall spindle
      const baseGeo = new THREE.CylinderGeometry(0.8, 1.4, 5.0, 10);
      const base = new THREE.Mesh(baseGeo, materials.tower);
      base.position.y = 2.5;
      base.castShadow = true;
      addGlowingEdges(base, baseGeo, themeColor);
      group.add(base);

      // Laser lens eye
      const eyeGeo = new THREE.SphereGeometry(0.8, 12, 12);
      const eye = new THREE.Mesh(eyeGeo, materials.generator);
      eye.position.y = 5.3;
      eye.name = 'tower-eye';
      group.add(eye);
      break;
    }

    case 'laser_wall': {
      // Two posts at ends and translucent wall plane in middle
      const pathPoints = struct.points.map(p => new THREE.Vector3(p.x - struct.x, 0, p.y - struct.y));
      const p1 = pathPoints[0];
      const p2 = pathPoints[pathPoints.length - 1];
      const distance = p1.distanceTo(p2);

      const postGeo = new THREE.CylinderGeometry(0.2, 0.3, 4.0, 8);
      const post1 = new THREE.Mesh(postGeo, materials.tower);
      post1.position.copy(p1).setY(2.0);
      const post2 = new THREE.Mesh(postGeo, materials.tower);
      post2.position.copy(p2).setY(2.0);
      group.add(post1);
      group.add(post2);

      // Laser wall plane mesh
      const wallGeo = new THREE.PlaneGeometry(distance, 3.8);
      const wallMat = new THREE.MeshBasicMaterial({ color: themeColor, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.copy(p1).add(p2).multiplyScalar(0.5).setY(2.0);
      wall.lookAt(p2);
      wall.rotateY(Math.PI / 2);
      group.add(wall);
      break;
    }

    case 'shield_dome': {
      // Large spherical wire shield dome centered
      const rad = Math.max(5.0, Math.sqrt(struct.width * struct.width + struct.height * struct.height) * 1.4);
      const domeGeo = new THREE.SphereGeometry(rad, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshBasicMaterial({
        color: themeColor,
        transparent: true,
        opacity: 0.15,
        wireframe: true,
        side: THREE.DoubleSide
      });
      const dome = new THREE.Mesh(domeGeo, domeMat);
      dome.position.y = 0.05;
      dome.name = 'shield-mesh';
      group.add(dome);

      // Generator post inside
      const coreGeo = new THREE.CylinderGeometry(0.5, 0.8, 3.0, 8);
      const core = new THREE.Mesh(coreGeo, materials.generator);
      core.position.y = 1.5;
      group.add(core);
      break;
    }
  }

  return group;
}

// Modify existing meshes on tick updates
function updateStructureMesh(id, struct) {
  const meshGroup = structureMeshes.get(id);
  if (!meshGroup) return;

  // Sync position (if moves, though static mostly)
  meshGroup.position.set(struct.x, 0, struct.y);

  // If level up, scale height slightly
  const targetScale = 1.0 + (struct.level - 1) * 0.15;
  meshGroup.scale.set(targetScale, targetScale, targetScale);

  // Hacked visual deactivation (dim materials or blink)
  meshGroup.traverse(child => {
    if (child.isMesh && child.name === 'shield-mesh') {
      child.visible = struct.shieldActive && struct.hackedTime <= 0;
    }
    // Blink core in red if hacked
    if (child.isMesh && (child.name === 'spinning-ring' || child.name === 'rotating-holo')) {
      if (struct.hackedTime > 0) {
        child.material.color.setHex(0xff0055);
      } else {
        child.material.color.set(new THREE.Color(struct.ownerColor));
      }
    }
  });
}

// Drone mesh generation
function buildDroneMesh(drone) {
  const size = drone.type === 'rogue' ? 0.8 : 0.45;
  const col = drone.type === 'rogue' ? 0xff0055 : (drone.type === 'debris' ? 0xffcc00 : 0x00ffcc);
  
  const geo = new THREE.BoxGeometry(size, size * 0.6, size * 1.4);
  const mat = new THREE.MeshBasicMaterial({ color: col });
  
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(drone.x, drone.type === 'logistics' ? 1.5 : 4.0, drone.y);
  return mesh;
}

// Visual explosion particle emitter helper
function spawnExplosion(pos) {
  const count = 15;
  const geom = new THREE.BufferGeometry();
  const posArr = new Float32Array(count * 3);
  const vels = [];

  for (let i = 0; i < count; i++) {
    posArr[i * 3] = pos.x;
    posArr[i * 3 + 1] = pos.y + 1.0;
    posArr[i * 3 + 2] = pos.z;
    vels.push({
      x: (Math.random() - 0.5) * 0.5,
      y: Math.random() * 0.5,
      z: (Math.random() - 0.5) * 0.5
    });
  }

  geom.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xff0055,
    size: 0.6,
    transparent: true,
    opacity: 0.9
  });

  const cluster = new THREE.Points(geom, mat);
  scene.add(cluster);

  let ticks = 0;
  const anim = () => {
    ticks++;
    const positions = cluster.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      positions[i * 3] += vels[i].x;
      positions[i * 3 + 1] += vels[i].y;
      positions[i * 3 + 2] += vels[i].z;
      vels[i].y -= 0.02; // gravity decay
    }
    cluster.geometry.attributes.position.needsUpdate = true;

    if (ticks < 30) {
      requestAnimationFrame(anim);
    } else {
      scene.remove(cluster);
    }
  };
  anim();
}

// Weather visual adjustments
function updateAtmosphericLighting(weatherType, intensity) {
  if (!scene) return;

  const now = Date.now() * 0.001;

  if (weatherType === 'rain') {
    rainParticles.visible = true;
    scene.background.setHex(0x010204);
    scene.fog.color.setHex(0x010204);
    dirLight.color.setHex(0x0088ff);
    dirLight.intensity = 0.5;

    // Trigger random lightning flash
    if (Math.random() < 0.015) {
      lightningLight.intensity = 6.0;
      setTimeout(() => { lightningLight.intensity = 0; }, 80 + Math.random() * 100);
    }
  } else if (weatherType === 'solar_storm') {
    rainParticles.visible = false;
    scene.background.setHex(0x0c0402);
    scene.fog.color.setHex(0x0c0402);
    dirLight.color.setHex(0xffaa00);
    dirLight.intensity = 2.5;
  } else if (weatherType === 'blackout') {
    rainParticles.visible = false;
    scene.background.setHex(0x010102);
    scene.fog.color.setHex(0x010102);
    dirLight.intensity = 0.08;
    ambientLight.color.setHex(0x020204);
  } else {
    // Clear Skies default
    rainParticles.visible = false;
    scene.background.setHex(0x020208);
    scene.fog.color.setHex(0x020208);
    dirLight.color.setHex(0x00ffcc);
    dirLight.intensity = 1.5;
    ambientLight.color.setHex(0x0a0f24);
  }
}

// Window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render Loops
function animate() {
  requestAnimationFrame(animate);

  if (controls) controls.update();

  // 1. Rotate sun hologram slowly
  if (proceduralSky) {
    proceduralSky.rotation.y += 0.0015;
    proceduralSky.rotation.z += 0.0005;
  }

  // 2. Animate building structural features (spinning cores, pulsating rings)
  structureMeshes.forEach((meshGroup, id) => {
    meshGroup.traverse(child => {
      if (child.name === 'spinning-ring') {
        child.rotation.y += 0.025;
      }
      if (child.name === 'rotating-holo') {
        child.rotation.y -= 0.015;
        child.rotation.x += 0.008;
      }
      if (child.name === 'pulsating-disk') {
        const scale = 1.0 + Math.sin(Date.now() * 0.003) * 0.15;
        child.scale.set(scale, scale, 1);
      }
    });
  });

  // 3. Update weather rain particle movements
  if (rainParticles && rainParticles.visible) {
    const positions = rainGeometry.attributes.position.array;
    const vels = rainParticles.userData.velocities;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += vels[i];
      // Reset particle if hit grid plane
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 60 + Math.random() * 20;
      }
    }
    rainGeometry.attributes.position.needsUpdate = true;
  }

  if (renderer) renderer.render(scene, camera);
}

// Initialize on DOM ready or immediate if already complete
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  init3D();
} else {
  window.addEventListener('DOMContentLoaded', init3D);
}
export { scene, camera, renderer };
