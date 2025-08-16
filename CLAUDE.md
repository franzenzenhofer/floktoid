# CLAUDE.md - NEON FLOCK Game Project

This file provides guidance to Claude Code (claude.ai/code) when working with the NEON FLOCK game codebase.

## 🔑 CRITICAL CREDENTIALS & ACCESS
**Cloudflare Deployment:**
- API Token: $CLOUDFLARE_API_TOKEN
- Account ID: ecf21e85812dfa5b2a35245257fc71f5
- Zone ID: 11bfe82c00e8c9e116e1e542b140f172

**GitHub Repository:**
- Repo: https://github.com/franzenzenhofer/floktoid (private)
- SSH Key: Use default system SSH key

**System Access (if needed):**
- Sudo password: changeme

## 🎮 Project Overview

**NEON FLOCK** is a high-performance arcade defense game built with TypeScript, React, and Pixi.js. Players defend energy cores from an AI-powered flock using asteroid projectiles in a stunning neon cyberpunk aesthetic.

**Live URL:** https://floktoid.franzai.com  
**Repository:** https://github.com/franzenzenhofer/floktoid (private)

## 📁 Project Structure

```
floktoid/
├── src/
│   ├── engine/           # Pixi.js game engine
│   │   ├── NeonFlockEngine.ts
│   │   ├── GameConfig.ts
│   │   ├── entities/    # Game objects (Boid, EnergyDot, Asteroid)
│   │   └── systems/     # Game systems (Flocking, Particles, etc.)
│   ├── components/       # React UI components
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── tests/               # Test suites
└── GAME_DESIGN_DOCUMENT.md
```

## 🚀 Commands

### Development
```bash
npm run dev              # Start dev server (Vite on :3000, Wrangler on :8787)
npm run build           # Build production bundle
npm run deploy          # ALWAYS USE THIS - Full automated deployment with tests
```

### ⚠️ DEPLOYMENT RULE
**ALWAYS use `npm run deploy` for ALL deployments - NEVER use `wrangler deploy` directly!**
This ensures all tests pass before deployment. This is MANDATORY unless explicitly told otherwise.

### Code Quality
```bash
npm run lint            # ESLint with zero warnings policy
npm run lint:fix        # Auto-fix linting issues
npm run typecheck       # TypeScript strict mode checking
npm run format          # Prettier formatting
```

### Testing
```bash
npm test                # Run Vitest unit tests
npm run test:coverage   # Generate coverage report (target: 80%)
npm run test:e2e       # Run Playwright E2E tests
npm run test:all       # Run all test suites
```

## 🎯 Core Systems

### 1. Flocking Algorithm
- Based on Craig Reynolds' Boids simulation
- Three rules: Separation, Alignment, Cohesion
- Additional behaviors: Target Seeking, Obstacle Avoidance
- Weights tuned for aggressive but realistic behavior

### 2. Game Loop Architecture
- **Pixi.js Ticker:** 60 FPS target with delta time
- **Entity-Component Pattern:** Modular game objects
- **System-based Updates:** Separated concerns (physics, rendering, input)

### 3. Performance Optimizations
- Object pooling for particles
- Efficient spatial queries for flocking
- WebGL rendering via Pixi.js
- Minimal React re-renders (game state isolated)

## 🎨 Visual Design

### Neon Aesthetic
- **Colors:** Cyan (#00FFFF), Magenta (#FF00FF), Yellow (#FFFF00)
- **Effects:** Glowing trails, particle explosions, pulsing energy
- **Style:** Cyberpunk/Synthwave inspired

### Rendering Pipeline
1. Background grid and stars
2. Energy dots with glow effects
3. Boids with trails
4. Asteroids with rotation
5. Particle effects layer
6. UI overlay (React components)

## 🔧 Configuration

### Game Balance (GameConfig.ts)
```typescript
// Flocking parameters
VIEW_RADIUS: 100        // Detection range
SEPARATION_RADIUS: 35   // Personal space
BASE_SPEED: 40         // Movement speed
BASE_FORCE: 80         // Acceleration

// Progression
BIRDS_WAVE_1: 2        // Starting birds
WAVE_GROWTH: 1.15      // Exponential growth
SPEED_GROWTH: 1.03     // Gradual speedup
SPAWN_BURST: 10        // Risk/reward mechanic
```

## 📊 Performance Requirements

- **FPS:** 60 on modern mobile devices
- **Load Time:** <3 seconds initial load
- **Input Latency:** <100ms response
- **Entity Count:** Support 100+ simultaneous objects
- **Memory:** <100MB heap usage

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Game logic functions
- Flocking calculations
- Collision detection
- Score/wave progression

### E2E Tests (Playwright)
- Game start/restart flow
- Input responsiveness
- Wave progression
- Mobile touch controls

### Performance Tests
- Frame rate monitoring
- Memory leak detection
- Load time benchmarks

## 🚢 Deployment

### Cloudflare Workers Setup
```toml
# wrangler.toml
name = "floktoid"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[assets]
directory = "./dist"

[[routes]]
pattern = "floktoid.franzai.com/*"
zone_name = "franzai.com"
```

### Automated Deployment Process
```bash
# One-command deployment (ALWAYS USE THIS)
npm run deploy          # Runs full test suite + build + deploy

# Version-specific deployments
npm run deploy:major    # Major version bump (breaking changes)
npm run deploy:minor    # Minor version bump (new features)
npm run deploy:patch    # Patch version bump (bug fixes)
```

### Manual Deployment Steps (if needed)
1. Run tests: `npm test && npm run test:e2e`
2. Lint & typecheck: `npm run lint && npm run typecheck`
3. Build: `npm run build`
4. Deploy: `npm run deploy`
5. Verify: https://floktoid.franzai.com
6. Monitor for 5 minutes

## 📤 Git Workflow & Version Control

### Committing Changes
```bash
# Check status and diff
git status
git diff

# Stage and commit
git add -A
git commit -m "feat: Description of feature"

# Push to GitHub
git push origin master
```

### Commit Message Convention
- `feat:` New features
- `fix:` Bug fixes
- `perf:` Performance improvements
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `docs:` Documentation updates
- `chore:` Maintenance tasks

### Creating Pull Requests
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add -A
git commit -m "feat: Add new feature"

# Push and create PR
git push -u origin feature/feature-name
gh pr create --title "feat: Feature description" --body "Details..."
```

## 🐛 Common Issues & Solutions

### Performance Drops
- Check particle count (MAX_PARTICLES limit)
- Verify object pooling is working
- Profile with Chrome DevTools

### Flocking Behavior
- Tune weights in GameConfig
- Check force normalization
- Verify delta time calculations

### Mobile Responsiveness
- Test touch events on actual devices
- Check viewport scaling
- Verify pointer event handling

### Deployment Issues
- **522 Error:** Check wrangler.toml routes pattern
- **SSL Error 526:** Set Cloudflare SSL to "Flexible" not "Full"
- **Build Fails:** Ensure all dependencies in package.json
- **Deploy Fails:** Check Cloudflare API token is set
- **Version Mismatch:** Always bump version before deploy

## 📊 Monitoring & Maintenance

### Health Checks
```bash
# Check deployment status
curl -I https://floktoid.franzai.com

# View current version
curl https://floktoid.franzai.com/version

# Check Cloudflare logs
wrangler tail floktoid
```

### Performance Monitoring
- Use Chrome DevTools Performance tab
- Monitor FPS with Stats.js
- Check memory usage in Task Manager
- Profile with Lighthouse for mobile

### Rollback Procedure
```bash
# If deployment fails
git log --oneline -5          # Find last good commit
git checkout <commit-hash>     # Checkout stable version
npm run deploy                 # Redeploy stable version
```

## 💡 Development Guidelines

1. **Type Safety:** No `any` types, strict mode always
2. **Performance First:** Profile before optimizing
3. **Mobile Primary:** Test on phones first
4. **Zero Warnings:** ESLint must pass with 0 warnings
5. **Test Coverage:** Maintain >80% coverage

## 🎮 Game Mechanics Reference

### Controls
- **Click & Hold:** Charge asteroid
- **Drag:** Aim trajectory  
- **Release:** Launch projectile

### Scoring
- 5 points per bird eliminated
- 10 points when bird reaches top (before burst)
- Multipliers for chains

### Wave Progression
- Exponential bird count increase
- Gradual speed increase
- Energy dots reset when all stolen

## 📈 Future Enhancements

- [ ] Sound effects and music
- [ ] Power-up system
- [ ] Global leaderboards
- [ ] Achievement system
- [ ] Boss birds
- [ ] Multiplayer mode

## 🔗 Resources

- [Pixi.js Documentation](https://pixijs.com)
- [Boids Algorithm](https://cs.stanford.edu/people/eroberts/courses/soco/projects/2008-09/modeling-natural-systems/boids.html)
- [Game Design Document](./GAME_DESIGN_DOCUMENT.md)

---

**Remember:** This is a performance-critical real-time game. Always profile changes, maintain 60 FPS, and test on actual mobile devices!