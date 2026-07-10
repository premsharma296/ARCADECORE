# arcadecore.in Integration Manual: NEON ARCHITECT

To integrate **NEON ARCHITECT** into your gaming portal (arcadecore.in) under the "Trending Games" section, use the following metadata, frontend HTML/CSS cards, and iframe wrapper templates.

---

## 1. Game Metadata Schema (JSON)
Add this configuration to your database or game registry index on `arcadecore.in`:

```json
{
  "id": "neon-architect",
  "title": "NEON ARCHITECT",
  "slug": "neon-architect",
  "category": "Multiplayer Strategy / MMO",
  "tags": ["Cyberpunk", "Strategy", "3D", "ThreeJS", "Real-Time", "PVP"],
  "description": "Establish your cyberpunk city grid by drawing glowing energy walls. Evolve resources, deploy AI turrets, hack rival cores, and dominate the persistent sector grid.",
  "status": "trending",
  "playUrl": "http://localhost:3000",
  "embeddable": true,
  "controls": "Mouse click & drag to draw vector grids on 3D coordinates. Orbit camera via Right-Click drag.",
  "audio": "Procedural synthwave soundscape (Web Audio API)",
  "resolution": "Responsive (Supports 16:9, 16:10, and Mobile aspect ratios)"
}
```

---

## 2. Trending Game Card (HTML/CSS Snippet)
Insert this component into the trending games section on the `arcadecore.in` homepage. It features a cyberpunk glow layout matching the game's visuals:

### HTML Snippet:
```html
<div class="trending-game-card neon-game-card">
  <div class="card-glow-outline"></div>
  <div class="card-badge">TRENDING #1</div>
  <div class="card-thumbnail-wrapper">
    <div class="cyber-grid-bg"></div>
    <div class="holo-core-display"></div>
  </div>
  <div class="card-content">
    <h3>NEON ARCHITECT</h3>
    <p>Draw glowing energy walls that AI constructor engines convert into real-time cities.</p>
    <div class="card-meta">
      <span class="players-online"><span class="pulse-dot"></span> LIVE MMO</span>
      <a href="http://localhost:3000" target="_blank" class="play-btn">LAUNCH GAME</a>
    </div>
  </div>
</div>
```

### CSS Stylesheet:
```css
/* Card Container */
.neon-game-card {
  position: relative;
  background: rgba(13, 13, 28, 0.8);
  border: 1px solid rgba(0, 255, 204, 0.3);
  border-radius: 12px;
  overflow: hidden;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}

.neon-game-card:hover {
  transform: translateY(-5px);
  border-color: #00ffcc;
  box-shadow: 0 0 15px rgba(0, 255, 204, 0.4), 0 8px 30px rgba(0, 0, 0, 0.6);
}

/* Trending Badge */
.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ff0055;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 1px;
  box-shadow: 0 0 8px rgba(255, 0, 85, 0.6);
  z-index: 10;
}

/* Thumbnail Hologram visualizer mockup */
.card-thumbnail-wrapper {
  height: 160px;
  border-radius: 8px;
  background: #020208;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.cyber-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(rgba(0, 255, 204, 0.07) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0, 255, 204, 0.07) 1px, transparent 1px);
  background-size: 15px 15px;
}

.holo-core-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px dashed #ff0055;
  box-shadow: 0 0 12px rgba(255, 0, 85, 0.5);
  animation: spin-holo 6s infinite linear;
}

@keyframes spin-holo {
  0% { transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  50% { transform: translate(-50%, -50%) rotate(180deg) scale(1.1); }
  100% { transform: translate(-50%, -50%) rotate(360deg) scale(1); }
}

/* Typo and play buttons */
.neon-game-card h3 {
  font-family: 'Orbitron', sans-serif;
  color: #fff;
  font-size: 1.15rem;
  letter-spacing: 1.5px;
  margin: 12px 0 8px 0;
}

.neon-game-card p {
  font-size: 0.8rem;
  color: #8b92b6;
  line-height: 1.4;
  margin-bottom: 15px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.players-online {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  color: #00ffcc;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background-color: #00ffcc;
  border-radius: 50%;
  box-shadow: 0 0 8px #00ffcc;
  animation: pulse-active 1.5s infinite;
}

@keyframes pulse-active {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.play-btn {
  background: #00ffcc;
  color: #000;
  border: none;
  border-radius: 4px;
  font-family: 'Orbitron', sans-serif;
  font-weight: 700;
  font-size: 0.75rem;
  padding: 8px 14px;
  text-decoration: none;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(0, 255, 204, 0.4);
  transition: all 0.2s;
}

.play-btn:hover {
  background: #fff;
  box-shadow: 0 0 15px #fff;
}
```

---

## 3. Fullpage Iframe Integration
To embed the game inside a wrapper page on `arcadecore.in` (e.g. `arcadecore.in/play/neon-architect`) so players can play directly inside your portal viewport:

```html
<div class="game-viewport-container">
  <div class="viewport-header">
    <a href="https://arcadecore.in" class="back-link">← Return to ArcadeCore</a>
    <h2>NEON ARCHITECT</h2>
  </div>
  <!-- Embedded game canvas container -->
  <iframe 
    src="http://localhost:3000" 
    class="embedded-game-frame"
    allow="autoplay; sine-wave-synth; clipboard-write"
    scrolling="no">
  </iframe>
</div>

<style>
.game-viewport-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #03030c;
}
.viewport-header {
  height: 50px;
  background: #0c0c16;
  border-bottom: 1px solid rgba(0, 255, 204, 0.2);
  display: flex;
  align-items: center;
  padding: 0 20px;
  justify-content: space-between;
}
.viewport-header h2 {
  font-family: 'Orbitron', sans-serif;
  color: #fff;
  font-size: 1rem;
  letter-spacing: 2px;
}
.back-link {
  color: #00ffcc;
  font-family: 'Share Tech Mono', monospace;
  text-decoration: none;
  font-size: 0.85rem;
}
.back-link:hover {
  text-shadow: 0 0 8px #00ffcc;
}
.embedded-game-frame {
  flex-grow: 1;
  border: none;
  width: 100%;
  height: calc(100vh - 50px);
  background-color: #020208;
}
</style>
```
