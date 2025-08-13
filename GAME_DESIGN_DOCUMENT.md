# NEON FLOCK - Game Design Document

## 🎮 Game Overview

**Title:** NEON FLOCK  
**Genre:** Arcade Defense / Flocking Simulation  
**Platform:** Web (Mobile-first responsive)  
**Target Audience:** Casual and hardcore arcade game enthusiasts  
**Engine:** TypeScript + Pixi.js + Vite  

## 🎯 Core Concept

NEON FLOCK is a high-octane defense game where players must protect their energy cores from an intelligent, flocking swarm of neon birds. Using click-and-drag mechanics to launch asteroids, players must strategically disrupt the flock's coordinated attacks while managing increasingly intense waves.

## 🕹️ Gameplay Mechanics

### Primary Mechanics

1. **Asteroid Launching**
   - Click and hold to charge an asteroid
   - Drag to aim trajectory
   - Release to launch
   - Asteroid size grows with charge time (15-60 units)
   - Asteroids shrink when hitting birds, disappear when too small

2. **Flocking AI Behavior**
   - **Separation:** Birds avoid crowding each other
   - **Alignment:** Birds align their velocity with neighbors
   - **Cohesion:** Birds steer toward average position of neighbors
   - **Target Seeking:** Birds pursue energy dots
   - **Asteroid Avoidance:** Emergency evasion from projectiles

3. **Energy System**
   - 12 energy dots positioned at bottom of screen
   - Birds steal dots and carry them to top
   - Reaching top spawns 10 new birds (exponential threat)
   - All dots respawn when completely depleted

### Progression System

- **Wave Structure:**
  - Wave 1: 2 birds
  - Each wave: 15% more birds
  - Speed increases 3% per wave
  
- **Scoring:**
  - 5 points per bird eliminated
  - 10 points per bird that reaches top (risk/reward)
  - Multipliers for consecutive hits

## 🎨 Visual Design

### Aesthetic
- **Cyberpunk Neon:** Glowing edges, particle trails, dark backgrounds
- **Color Palette:**
  - Primary: Cyan (#00FFFF), Magenta (#FF00FF), Yellow (#FFFF00)
  - Accents: Pink, Green, Orange, Blue variations
  - Background: Pure black with subtle grid overlay

### Visual Elements
1. **Birds:** Triangular shapes with glowing trails
2. **Energy Dots:** Pulsing orbs with halos
3. **Asteroids:** Irregular polygons with rotation
4. **Particles:** Explosions, pickups, death effects
5. **Grid:** Subtle cyan lines for depth perception

### Visual Effects
- Particle explosions on impacts
- Trail effects following birds
- Pulsing glow on energy dots
- Screen shake on major events
- Chromatic aberration on high intensity

## 🔊 Audio Design (Future)

### Sound Effects
- Asteroid launch (charging/release)
- Bird elimination (electronic chirp)
- Energy pickup/steal
- Wave completion fanfare
- Game over glitch sound

### Music
- Synthwave/Retrowave soundtrack
- Dynamic intensity based on wave/threat level
- Builds tension as more birds appear

## 🏗️ Technical Architecture

### Technology Stack
- **Framework:** React 18 + TypeScript
- **Graphics Engine:** Pixi.js v8
- **Physics:** Custom flocking algorithm
- **Build Tool:** Vite
- **Deployment:** Cloudflare Workers
- **Testing:** Vitest + Playwright

### Performance Targets
- 60 FPS on modern mobile devices
- <3s initial load time
- <100ms input latency
- Support for 100+ simultaneous entities

### Code Structure
```
src/
├── engine/
│   ├── NeonFlockEngine.ts    # Main game loop
│   ├── GameConfig.ts          # Tunable parameters
│   ├── entities/              # Game objects
│   │   ├── Boid.ts
│   │   ├── EnergyDot.ts
│   │   └── Asteroid.ts
│   └── systems/               # Game systems
│       ├── FlockingSystem.ts
│       ├── ParticleSystem.ts
│       ├── CollisionSystem.ts
│       └── InputManager.ts
├── components/                # React UI
│   ├── Game.tsx
│   ├── HUD.tsx
│   ├── StartScreen.tsx
│   └── GameOverScreen.tsx
└── main.tsx                   # Entry point
```

## 🎯 Design Goals

1. **Immediate Engagement:** Game should be understood within 5 seconds
2. **Depth Through Simplicity:** Simple controls, complex emergent gameplay
3. **Visual Spectacle:** Every action should feel impactful and beautiful
4. **Progressive Challenge:** Natural difficulty curve through wave system
5. **Mobile-First:** Optimized for touch controls and small screens

## 📊 Balancing Parameters

### Flocking Weights
- Separation: 2.0 (strongest - prevents clustering)
- Alignment: 1.0 (moderate - coordinated movement)
- Cohesion: 0.8 (weak - loose flocks)
- Target Seeking: 1.5 (strong - aggressive pursuit)
- Asteroid Avoidance: 3.0 (critical - survival instinct)

### Difficulty Scaling
- Birds per wave: BASE * 1.15^(wave-1)
- Speed multiplier: 1.03^(wave-1)
- Spawn burst on success: 10 birds (high risk/reward)

## 🚀 Future Features

### Version 1.1
- Power-ups (slow motion, multi-shot, shield)
- Leaderboards (global high scores)
- Achievement system
- Sound effects and music

### Version 2.0
- Boss birds with unique behaviors
- Environmental hazards
- Multiplayer co-op mode
- Level editor and sharing

## 📈 Success Metrics

- **Engagement:** Average session >5 minutes
- **Retention:** 30% day-1 retention
- **Progression:** 50% of players reach wave 10
- **Performance:** Consistent 60 FPS on target devices

## 🎮 Controls

### Desktop
- **Mouse:** Click and drag to launch asteroids
- **ESC:** Pause game

### Mobile
- **Touch:** Press and drag to launch asteroids
- **Two-finger tap:** Pause game

## 💡 Unique Selling Points

1. **Flocking AI:** Realistic bird behavior creates unpredictable challenges
2. **Neon Aesthetic:** Visually stunning cyberpunk style
3. **Risk/Reward:** Letting birds succeed spawns more (strategic depth)
4. **One-Touch Control:** Accessible yet deep gameplay
5. **Infinite Progression:** No level cap, pure skill ceiling

## 📝 Development Notes

- Flocking algorithm based on Craig Reynolds' Boids
- Pixi.js chosen for WebGL performance on mobile
- TypeScript for maintainability and type safety
- Vite for fast development iteration
- Component-based architecture for modularity

---

*NEON FLOCK combines the mesmerizing beauty of flocking simulations with intense arcade action, creating a unique defense game that's both visually spectacular and mechanically engaging.*