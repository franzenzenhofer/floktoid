# FLOKTOID - Reverse Asteroids Defense Game

![Version](https://img.shields.io/badge/version-2.55.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Pixi.js](https://img.shields.io/badge/Pixi.js-8.12-ff69b4)
![React](https://img.shields.io/badge/React-18.3-61dafb)

**Play Now:** [floktoid.franzai.com](https://floktoid.franzai.com)

## What if the Asteroids were the good guys?

FLOKTOID flips the classic Asteroids game on its head. You defend energy dots from an evil flock of spaceships using asteroids as your weapons. Built with TypeScript, React, and Pixi.js for blazing-fast performance on any device.

## Features

- **Reversed Gameplay**: Launch asteroids to destroy evil spaceships
- **Smart AI Flocking**: Birds use Craig Reynolds' boids algorithm with advanced behaviors
- **Special Enemy Types**: 
  - Regular birds that steal energy
  - Shooters that fire lasers at your asteroids
  - Super navigators with enhanced pathfinding
  - Boss birds with extreme health
- **Scoring System**:
  - 40 points for regular birds
  - 80 points for shooters (2x)
  - 80 points for super navigators (2x)
  - 120 points for birds carrying energy dots (3x)
  - Combo multipliers up to 3x
- **Global Leaderboard**: Compete with players worldwide (24h and all-time)
- **Authentic Asteroids Physics**: Realistic splitting mechanics from the 1979 original
- **Stunning Visuals**: Neon cyberpunk aesthetic with particle effects
- **Mobile Optimized**: Touch controls and 60 FPS performance

## Quick Start

### Play Online
Visit [floktoid.franzai.com](https://floktoid.franzai.com)

### Local Development

```bash
# Clone the repository
git clone https://github.com/franzenzenhofer/floktoid.git
cd floktoid

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Game Controls

- **Click & Hold**: Charge an asteroid (size increases with hold time)
- **Drag**: Aim the trajectory
- **Release**: Launch the asteroid
- **Dev Mode**: Press 'D' to toggle (skip waves, spawn boss)

## Technology Stack

- **Game Engine**: Pixi.js 8.12 (WebGL rendering)
- **UI Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.0
- **Deployment**: Cloudflare Workers + KV Storage
- **Testing**: Vitest + Playwright
- **Styling**: Tailwind CSS

## Architecture

```
src/
├── engine/                 # Pixi.js game engine
│   ├── NeonFlockEngine.ts # Core game loop
│   ├── entities/          # Game objects
│   │   ├── Boid.ts       # Flocking spaceship AI
│   │   ├── Asteroid.ts   # Player projectiles
│   │   └── EnergyDot.ts  # Collectible targets
│   ├── systems/          # Game systems
│   │   ├── FlockingSystem.ts
│   │   ├── CollisionSystem.ts
│   │   ├── ParticleSystem.ts
│   │   └── ScoringSystem.ts
│   └── CentralConfig.ts  # Game configuration
├── components/           # React UI components
│   ├── GameUI.tsx       # HUD overlay
│   ├── StartScreen.tsx  # Main menu
│   └── Leaderboard.tsx  # Score display
└── worker.js            # Cloudflare Worker API

```

## Development

### Commands

```bash
npm run dev              # Start dev server
npm run build           # Build production bundle
npm run test            # Run unit tests
npm run test:e2e        # Run Playwright E2E tests
npm run lint            # ESLint (zero warnings policy)
npm run typecheck       # TypeScript strict checking
npm run deploy          # Deploy to Cloudflare (auto version bump)
```

### Testing

The project maintains high testing standards:
- Unit tests with Vitest (80%+ coverage target)
- E2E tests with Playwright
- AI-powered visual testing
- Post-deployment verification

### Code Quality

- TypeScript strict mode
- ESLint with zero warnings policy
- Prettier formatting
- Atomic git commits
- Comprehensive test coverage

## Game Design

### Flocking Algorithm

The evil spaceships use an advanced implementation of Craig Reynolds' boids algorithm:

1. **Separation**: Avoid crowding neighbors
2. **Alignment**: Steer towards average heading
3. **Cohesion**: Steer towards average position
4. **Target Seeking**: Navigate to energy dots
5. **Obstacle Avoidance**: Dodge asteroids
6. **Energy Theft**: Steal and carry dots

### Difficulty Progression

- Exponential bird count increase (1.15x per wave)
- Gradual speed increase (1.03x per wave)
- Special enemy introduction at higher waves
- Boss battles every 10 waves

### Performance Optimizations

- Object pooling for particles
- Efficient spatial queries for collision detection
- WebGL batch rendering via Pixi.js
- Minimal React re-renders
- 60 FPS target on mobile devices

## Deployment

The game is deployed on Cloudflare Workers for global edge performance:

```toml
# wrangler.toml
name = "floktoid"
main = "src/worker.js"
compatibility_date = "2024-01-01"

[assets]
directory = "./dist"

[[kv_namespaces]]
binding = "LEADERBOARD"
id = "YOUR_KV_NAMESPACE_ID_HERE"

[[routes]]
pattern = "your-domain.com/*"
zone_name = "your-domain.com"
```

### Deploy Process

```bash
# Automatic deployment with tests and version bump
npm run deploy

# Manual deployment
npm run build
wrangler deploy
```

## Documentation

- [Boss Mechanics](documentation/BOSS_MECHANICS.md) - Detailed boss bird system (currently inactive)
- [Game Design Document](documentation/GAME_DESIGN_DOCUMENT.md) - Complete game design specifications
- [Root Cause Analysis](documentation/ROOT_CAUSE_ANALYSIS_BIRD_SPAWN_FREEZE.md) - Technical debugging documentation

## API Endpoints

The Cloudflare Worker provides:

- `POST /api/leaderboard/submit` - Submit score
- `GET /api/leaderboard/top` - Get top scores (24h and all-time)

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure zero ESLint warnings
5. Submit a pull request

### Development Guidelines

- Write TypeScript with no `any` types
- Add tests for new features
- Follow existing code patterns
- Test on mobile devices
- Keep performance in mind

## Environment Variables

For local development, create a `.env` file:

```env
# Optional: Add your own API keys
GEMINI_API_KEY=your-key-here  # For AI testing (optional)
```

## Performance Metrics

- Load time: <3 seconds
- Time to Interactive: <2 seconds
- 60 FPS on modern mobile devices
- <100MB memory usage
- Support for 100+ simultaneous entities

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Chrome/Safari

## Known Issues

- Audio not yet implemented
- Multiplayer mode planned but not available
- Leaderboard requires JavaScript enabled

## Future Roadmap

- [ ] Sound effects and music
- [ ] Power-up system
- [ ] Achievements system
- [ ] More enemy types
- [ ] Multiplayer mode
- [ ] Mobile app versions

## Credits

Created by Franz Enzenhofer

100% developed via Claude Code - Code directed by Franz Enzenhofer

Built with:
- [Pixi.js](https://pixijs.com) - 2D WebGL renderer
- [React](https://react.dev) - UI framework
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge computing
- [Vite](https://vitejs.dev) - Build tool

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- Report issues: [GitHub Issues](https://github.com/franzenzenhofer/floktoid/issues)
- Game URL: [floktoid.franzai.com](https://floktoid.franzai.com)
- Leaderboard: [floktoid.franzai.com/leaderboard](https://floktoid.franzai.com/leaderboard)

---

**Remember**: In FLOKTOID, the asteroids are the heroes!