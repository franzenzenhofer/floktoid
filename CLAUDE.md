# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with hot reload (Vite on :3000, Wrangler on :8787)
- `npm run build` - Build production bundle
- `npm run deploy` - Deploy to Cloudflare Workers (auto-bumps minor version)
- `npm run deploy:preview` - Deploy to preview environment

### Code Quality
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Auto-fix linting issues  
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

### Testing
- `npm test` - Run unit tests with Vitest
- `npm test -- --watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run test:all` - Run all tests

### Version Management
- `npm run version:bump:patch` - Bump patch version
- `npm run version:bump:minor` - Bump minor version
- `npm run version:bump:major` - Bump major version

## Architecture

### Core Game Engine
The puzzle game uses a mathematically-proven reverse-move algorithm for 100% solvability:

1. **Grid System** (`/src/utils/gridV2.ts`): Pure functional operations using modular arithmetic
   - Colors are integers in Z_n (modulo n)
   - Click operations are additions in this finite field
   - Each operation is self-inverse (clicking twice = original state)

2. **Puzzle Generation** (`/src/hooks/useGenerator.ts`): 
   - Starts with solved state (all tiles same color)
   - Applies N reverse moves (subtract instead of add)
   - Guarantees solvability in exactly N moves

3. **State Management** (`/src/context/GameContext.tsx`):
   - React Context + useReducer pattern
   - Type-safe action dispatch system
   - Local storage persistence

### Frontend Stack
- React 18 with TypeScript (strict mode)
- Tailwind CSS for styling
- Framer Motion for animations
- Vite for bundling

### Backend Infrastructure  
- Cloudflare Workers for edge computing
- KV storage for game state persistence
- Durable Objects for real-time sessions
- Worker serves both API and static assets

### Key Design Patterns
- **Pure Functions**: All grid operations are immutable
- **Functional Components**: No class components
- **Custom Hooks**: Complex logic extracted (useGenerator, useSolver, useTimer)
- **Type Safety**: Explicit types for all exports, no implicit any

### Level Progression
- Easy (1-10): 3x3 grid, 3 colors, unlimited undos
- Medium (11-20): 6x6 grid, 4 colors, 5 undos, 5min timer
- Hard (21+): Progressive grid scaling up to 20x20, 1 undo, 3min timer

## Important Notes

- The game uses a reverse-move algorithm that mathematically guarantees 100% solvability
- All grid operations in `gridV2.ts` are pure functions using modular arithmetic
- The Worker (`src/worker.js`) handles both API endpoints and static asset serving
- Deployment automatically bumps version and updates `src/version.ts`
- Test coverage thresholds are set at 80% for all metrics