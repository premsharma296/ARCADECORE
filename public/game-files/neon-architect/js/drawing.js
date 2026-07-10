// ==========================================
// NEON ARCHITECT - 3D NEON DRAWING SYSTEM
// ==========================================

import * as THREE from 'three';
import { clientState, sendPayload } from './ui.js';
import { playSound } from './audio.js';

let isDrawing = false;
let drawPoints = [];
let tempLineMesh = null;
let cursorRingMesh = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const gridPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Flat y=0 plane

// Init drawing visual helpers
export function initDrawingHelpers(scene) {
  // Cursor Snapping Ring
  const ringGeo = new THREE.RingGeometry(0.3, 0.45, 16);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  cursorRingMesh = new THREE.Mesh(ringGeo, ringMat);
  cursorRingMesh.position.set(0, 0.05, 0);
  scene.add(cursorRingMesh);

  // Temporary Draw Line
  const maxPoints = 500;
  const lineGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(maxPoints * 3);
  lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x00ffcc,
    linewidth: 3,
    transparent: true,
    opacity: 0.9
  });
  
  tempLineMesh = new THREE.Line(lineGeo, lineMat);
  tempLineMesh.visible = false;
  scene.add(tempLineMesh);
}

// Raycast against the ground plane to get snapped grid coordinates
function getGridIntersection(e, camera, renderer) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersectionPoint = new THREE.Vector3();
  
  if (raycaster.ray.intersectPlane(gridPlane, intersectionPoint)) {
    // Snap to grid integers
    return {
      x: Math.round(intersectionPoint.x),
      z: Math.round(intersectionPoint.z),
      raw: intersectionPoint
    };
  }
  return null;
}

// Bind mouse drawing inputs to Three.js canvas
export function setupDrawingInputs(camera, scene, renderer, controls) {
  const canvas = renderer.domElement;

  canvas.addEventListener('mousedown', (e) => {
    // Only draw on primary mouse button click, if logged in and not clicking UI overlays
    if (e.button !== 0 || !clientState.playerId) return;

    const snap = getGridIntersection(e, camera, renderer);
    if (!snap) return;

    // Turn off orbit controls during active drawing
    controls.enabled = false;
    isDrawing = true;
    drawPoints = [{ x: snap.x, y: snap.z }];
    
    updateTempLine();
    tempLineMesh.visible = true;

    // Apply color update to helper meshes
    const col = new THREE.Color(clientState.playerColor);
    cursorRingMesh.material.color.set(col);
    tempLineMesh.material.color.set(col);

    playSound('select');
  });

  canvas.addEventListener('mousemove', (e) => {
    const snap = getGridIntersection(e, camera, renderer);
    if (!snap) return;

    // Move grid helper ring
    cursorRingMesh.position.set(snap.x, 0.05, snap.z);

    if (!isDrawing) return;

    const lastPt = drawPoints[drawPoints.length - 1];
    
    // Add point if we moved to a new cell
    if (lastPt.x !== snap.x || lastPt.y !== snap.z) {
      // Limit line segments length to prevent lag
      if (drawPoints.length < 100) {
        drawPoints.push({ x: snap.x, y: snap.z });
        updateTempLine();
        playSound('select');
      }
    }
  });

  const finishDrawing = () => {
    if (!isDrawing) return;
    isDrawing = false;
    controls.enabled = true;
    tempLineMesh.visible = false;

    if (drawPoints.length >= 2) {
      playSound('build');
      // Send drawing points to simulation server
      sendPayload({
        type: 'draw',
        points: drawPoints,
        mode: clientState.activeMode
      });
    }
    drawPoints = [];
  };

  canvas.addEventListener('mouseup', finishDrawing);
  canvas.addEventListener('mouseleave', finishDrawing);
}

// Update the buffer geometry of the temporary line mesh
function updateTempLine() {
  if (!tempLineMesh || drawPoints.length === 0) return;

  const positions = tempLineMesh.geometry.attributes.position.array;
  
  for (let i = 0; i < drawPoints.length; i++) {
    positions[i * 3] = drawPoints[i].x;
    positions[i * 3 + 1] = 0.08; // slightly offset vertically to avoid grid Z-fighting
    positions[i * 3 + 2] = drawPoints[i].y;
  }
  
  tempLineMesh.geometry.setDrawRange(0, drawPoints.length);
  tempLineMesh.geometry.attributes.position.needsUpdate = true;
}
