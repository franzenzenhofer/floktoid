# 🎮 Color Me Same - Progressive Puzzle Game

A challenging and addictive puzzle game where you make all tiles the same color, featuring a revolutionary level progression system, mathematical puzzle generation, and comprehensive difficulty scaling.

<img src="https://img.shields.io/badge/version-1.21.1-blue.svg" alt="Version" />
<img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
<img src="https://img.shields.io/badge/deployment-Cloudflare_Workers-orange.svg" alt="Deployment" />

**🎯 Play Now**: [https://color-me-same.franzai.com](https://color-me-same.franzai.com)

## 🎮 Game Features

- **70+ Progressive Levels**: From beginner-friendly 3x3 to master-level 20x20 grids
- **100% Solvable Puzzles**: Mathematical generation guarantees every puzzle can be solved
- **Belt Progression System**: Advance from White to Black belt as you master the game
- **Dynamic Difficulty**: Automatic progression through Easy → Medium → Hard modes
- **Undo/Reset System**: Strategic gameplay with difficulty-appropriate undo limits
- **Responsive Design**: Fully playable on all devices from mobile to desktop
- **Hint System**: Smart hints that guide you along the optimal path
- **XP & Achievements**: Track your progress and unlock rewards

## 📈 Level Progression System

### 🟢 Easy Mode (Levels 1-10)
- **Grid Size**: 3x3 throughout
- **Colors**: 3
- **Starting Moves**: 2 clicks from solved state
- **Progression**: Gradually increases to 8 moves
- **Time Limit**: None - Play at your own pace
- **Undos**: Unlimited - Perfect for learning
- **Hints**: Auto-enabled on level 1

### 🟡 Medium Mode (Levels 11-20)
- **Grid Size**: 6x6 throughout
- **Colors**: 4
- **Starting Moves**: 4 clicks from solved state (challenging!)
- **Progression**: Increases to 14 moves
- **Time Limit**: 5 minutes per puzzle
- **Undos**: 5 per puzzle
- **Hints**: Auto-enabled on level 11

### 🔴 Hard Mode (Levels 21+)
- **Grid Size**: Progressive scaling
  - Levels 21-30: 10x10
  - Levels 31-40: 12x12
  - Levels 41-50: 14x14
  - Levels 51-60: 16x16
  - Levels 61-70: 18x18
  - Levels 71+: 20x20
- **Colors**: 4+ (increases every 20 levels)
- **Starting Moves**: 5 clicks from solved state (very challenging!)
- **Progression**: Aggressive difficulty scaling
- **Time Limit**: 3 minutes per puzzle
- **Undos**: Only 1 per puzzle
- **Hints**: Auto-enabled on level 21

### 🥋 Belt Progression
Progress through martial arts-inspired belts as you master the game:

| Belt | Level Required | XP Required | Achievement |
|------|----------------|-------------|-------------|
| ⚪ White | 1 | 0 | Starting Belt |
| 🟡 Yellow | 3+ | 500 | Novice Player |
| 🟠 Orange | 6+ | 1,500 | Getting Good |
| 🟢 Green | 11+ | 3,000 | Medium Master |
| 🔵 Blue | 21+ | 5,000 | Hard Mode Hero |
| 🟣 Purple | 30+ | 8,000 | Puzzle Expert |
| ⚫ Black | 50+ | 15,000 | True Master |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/color-me-same.git
cd color-me-same

# Install dependencies
npm install

# Authenticate with Cloudflare
wrangler login

# Start development server
npm run dev
```

Visit `http://localhost:8787` to play locally.

### Deployment

1. **Create KV Namespace**:
```bash
wrangler kv:namespace create "GAME_STATE"
wrangler kv:namespace create "GAME_STATE" --preview
```

2. **Update wrangler.toml** with your KV namespace IDs:
```toml
[[kv_namespaces]]
binding = "GAME_STATE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

3. **Deploy to Cloudflare**:
```bash
# Production deployment
npm run deploy

# Preview deployment
npm run deploy:preview
```

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 with TypeScript
- **State Management**: React Context + useReducer
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with optimized production builds
- **Deployment**: Cloudflare Workers with edge computing
- **Package Manager**: npm with strict dependency management

### Core Components

#### 🎮 Game Engine (`/src/utils/`)
- **Grid System**: Pure functional grid manipulation
- **Puzzle Generator**: Reverse-move algorithm for 100% solvability
- **Hint System**: BFS-based optimal path calculation
- **Score Engine**: Multi-factor scoring with efficiency tracking

#### 🧩 React Components (`/src/components/`)
- **GameBoard**: Responsive grid with dynamic tile sizing
- **Tile**: Interactive tiles with animation states
- **StatusBar**: Real-time game stats and controls
- **PowerUps**: Undo/Reset/Hint functionality
- **VictoryModal**: Achievement and progression display

#### 🔄 State Management (`/src/context/`)
- **GameContext**: Centralized game state with reducer pattern
- **Actions**: Type-safe action dispatch system
- **Persistence**: Local storage for progress tracking

#### 🎨 Design System
- **Colors**: Carefully selected accessible palette
- **Typography**: Mono font for consistency
- **Spacing**: 8px grid system
- **Animations**: 200ms transitions for smooth UX

### Mathematical Foundation
The puzzle generation uses a **reverse-move algorithm** that guarantees 100% solvability:

1. Start with solved state (all tiles same color)
2. Apply N reverse moves (subtract color instead of add)
3. The scrambled state can always be solved in exactly N moves
4. No BFS verification needed - solvability is mathematical certainty

For detailed mathematical proof, see [Solvability Mathematics](./solvability-mathematics.md)

## 🎯 Game Rules

1. **Objective**: Make all tiles the same color
2. **Clicking**: Changes tile and adjacent tiles (cross pattern)
3. **Power Tiles** (⚡): Affect 3x3 area
4. **Locked Tiles** (🔒): Cannot be clicked, unlock over time
5. **Optimal Play**: Try to match the BFS solution move count

## 🛠️ Development

### Getting Started

1. **Clone and Install**:
```bash
git clone https://github.com/yourusername/color-me-same.git
cd color-me-same
npm install
```

2. **Environment Setup**:
```bash
# Copy environment template
cp .env.example .env

# Configure Cloudflare
wrangler login
```

3. **Development Server**:
```bash
# Start local dev server (hot reload enabled)
npm run dev

# Open http://localhost:8787
```

### Code Standards

#### TypeScript Guidelines
- **Strict mode enabled** - No implicit any
- **Functional programming** - Pure functions preferred
- **Type safety** - Explicit types for all exports
- **No magic numbers** - Use constants

#### React Best Practices
- **Functional components** - No class components
- **Custom hooks** - Extract complex logic
- **Memoization** - Use React.memo for expensive renders
- **Error boundaries** - Graceful error handling

#### Testing Strategy

```bash
# Unit tests (Vitest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Coverage report
npm run test:coverage

# Watch mode
npm test -- --watch
```

#### Code Quality Tools

```bash
# ESLint - Code linting
npm run lint
npm run lint:fix

# Prettier - Code formatting
npm run format

# TypeScript - Type checking
npm run typecheck

# Bundle analysis
npm run analyze
```

### Performance Optimization

#### Build Optimization
- **Tree shaking** - Remove unused code
- **Code splitting** - Lazy load components
- **Asset optimization** - Compress images/fonts
- **Minification** - Production builds optimized

#### Runtime Performance
- **Virtual DOM optimization** - Minimize re-renders
- **Web Workers** - Offload heavy computation
- **Request caching** - Cache API responses
- **Progressive enhancement** - Core functionality first

### Debugging

```bash
# Enable debug logs
DEBUG=true npm run dev

# Production debugging
wrangler tail

# Browser DevTools
# Use React Developer Tools extension
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/amazing-feature

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and create PR
git push origin feature/amazing-feature
```

#### Commit Convention
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build/tooling changes

## 📦 Project Structure

```
color-me-same/
├── src/
│   ├── components/          # React components
│   │   ├── board/          # GameBoard, Tile components
│   │   ├── controls/       # StatusBar, PowerUps, Navigation
│   │   ├── feedback/       # VictoryModal, achievements
│   │   └── layout/         # PageShell, responsive containers
│   ├── context/            # State management
│   │   └── GameContext.tsx # Global game state & reducer
│   ├── hooks/              # Custom React hooks
│   │   ├── useGenerator.ts # Puzzle generation logic
│   │   ├── useGame.ts      # Game state hook
│   │   └── useTimer.ts     # Game timer management
│   ├── utils/              # Core game utilities
│   │   ├── grid.ts         # Grid manipulation functions
│   │   ├── gridV2.ts       # Pure functional grid operations
│   │   ├── score.ts        # Score calculation
│   │   └── logger.ts       # Debug logging system
│   ├── constants/          # Game configuration
│   │   └── gameConfig.ts   # Difficulties, colors, belts
│   ├── styles/             # CSS modules
│   ├── App.tsx             # Main app component
│   ├── index.tsx           # React entry point
│   └── worker.ts           # Cloudflare Worker entry
├── public/                 # Static assets
│   └── favicon.png         # Game icon
├── docs/                   # Documentation
│   ├── API.md              # API reference
│   ├── DEPLOYMENT_BEST_PRACTICES.md
│   └── IMPLEMENTATION_ROADMAP.md
├── scripts/                # Build & deployment
│   ├── bump-version.js     # Version management
│   └── deploy-cloudflare.sh # Deployment automation
├── tests/                  # Test suites
│   └── playwright/         # E2E tests
├── wrangler.toml           # Cloudflare config
├── vite.config.ts          # Vite build config
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # Tailwind CSS config
└── package.json            # Dependencies & scripts
```

## 🌐 Custom Domain Setup

1. Add custom route in `wrangler.toml`:
```toml
[[routes]]
pattern = "color-me-same.yourdomain.com/*"
zone_name = "yourdomain.com"
```

2. Deploy and configure DNS in Cloudflare dashboard

## 🔧 Environment Variables

Set in `wrangler.toml` or dashboard:

```toml
[vars]
ENVIRONMENT = "production"
SENTRY_DSN = "your-sentry-dsn"
POSTHOG_API_KEY = "your-posthog-key"
```

## 📈 Analytics Integration

The game tracks:
- Player retention (D1, D7, D30)
- Average session length
- Puzzle completion rates
- Power-up usage patterns
- Device and browser stats

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🎮 Play Now

- **Production**: https://color-me-same.franzai.com
- **Preview**: https://preview.color-me-same.pages.dev

## 🐛 Known Issues

- Mobile haptic feedback requires HTTPS
- WebSocket connections limited to 1000 concurrent
- KV storage has 1MB value limit

## 📚 Documentation

### Core Documentation
- **[README.md](./README.md)** - This file, main project documentation
- **[SUMMARY.md](./SUMMARY.md)** - Project overview and key features
- **[solvability-mathematics.md](./solvability-mathematics.md)** - Mathematical proof of 100% puzzle solvability
- **[CHANGELOG-v1.19.0.md](./CHANGELOG-v1.19.0.md)** - Version history and updates

### Development Guides
- **[docs/API.md](./docs/API.md)** - Complete API reference
- **[docs/IMPLEMENTATION_ROADMAP.md](./docs/IMPLEMENTATION_ROADMAP.md)** - Development roadmap and planning
- **[docs/DEPLOYMENT_BEST_PRACTICES.md](./docs/DEPLOYMENT_BEST_PRACTICES.md)** - Production deployment guide
- **[MIGRATION_PLAN.md](./MIGRATION_PLAN.md)** - Migration strategies for updates

### Technical Analysis
- **[UI-ANALYSIS-REPORT.md](./UI-ANALYSIS-REPORT.md)** - UI/UX analysis and improvements
- **[UI-ISSUES-ANALYSIS.md](./UI-ISSUES-ANALYSIS.md)** - Known UI issues and fixes
- **[solveable-readme-md.md](./solveable-readme-md.md)** - Alternative solvability documentation

## 🚀 Roadmap

### Version 2.0 Features
- [ ] **Multiplayer Mode**: Real-time competitive puzzles
- [ ] **Level Editor**: Create and share custom puzzles
- [ ] **Tournament System**: Weekly competitions with prizes
- [ ] **Mobile Apps**: Native iOS/Android apps
- [ ] **AI Opponent**: Play against intelligent bots
- [ ] **Custom Themes**: Dark mode, colorblind modes
- [ ] **Achievement System**: 50+ achievements to unlock
- [ ] **Daily Challenges**: New puzzle every day
- [ ] **Replay System**: Watch and share game replays
- [ ] **Global Leaderboards**: Compete worldwide

### Technical Improvements
- [ ] **WebAssembly**: Performance-critical paths in WASM
- [ ] **PWA Support**: Offline play capability
- [ ] **WebGL Renderer**: GPU-accelerated animations
- [ ] **Social Integration**: Share progress on social media
- [ ] **Analytics Dashboard**: Player statistics and insights

---

Built with ❤️ using React, TypeScript, and Cloudflare Workers