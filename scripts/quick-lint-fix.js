#!/usr/bin/env node

/**
 * Quick lint fixes for deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';

const files = [
  'src/hooks/useSolver.ts',
  'src/hooks/useProgression.ts',
  'src/worker.js',
  'src/components/modals/VictoryModal.tsx'
];

// Fix unused imports in useSolver.ts
const useSolverPath = 'src/hooks/useSolver.ts';
if (fs.existsSync(useSolverPath)) {
  let content = fs.readFileSync(useSolverPath, 'utf-8');
  content = content.replace("import { clone, isWinningState }", "import { isWinningState }");
  fs.writeFileSync(useSolverPath, content);
}

// Fix unused variables in useProgression.ts
const useProgressionPath = 'src/hooks/useProgression.ts';
if (fs.existsSync(useProgressionPath)) {
  let content = fs.readFileSync(useProgressionPath, 'utf-8');
  content = content.replace("const currentBeltData = BELT_COLORS[progress.currentBelt];", "// const currentBeltData = BELT_COLORS[progress.currentBelt];");
  content = content.replace("const [nextBelt, nextData] = belts[currentIndex + 1];", "const [_nextBelt, nextData] = belts[currentIndex + 1];");
  fs.writeFileSync(useProgressionPath, content);
}

// Fix worker.js issues
const workerPath = 'src/worker.js';
if (fs.existsSync(workerPath)) {
  let content = fs.readFileSync(workerPath, 'utf-8');
  content = content.replace("import { html } from './templates.js';", "// import { html } from './templates.js';");
  content = content.replace("function getMimeType(filename) {", "// function getMimeType(filename) {");
  content = content.replace("const ext = filename.split('.').pop().toLowerCase();", "//   const ext = filename.split('.').pop().toLowerCase();");
  fs.writeFileSync(workerPath, content);
}

// Fix VictoryModal unused parameter
const victoryModalPath = 'src/components/modals/VictoryModal.tsx';
if (fs.existsSync(victoryModalPath)) {
  let content = fs.readFileSync(victoryModalPath, 'utf-8');
  content = content.replace("{ onShowAchievements }", "{ onShowAchievements: _onShowAchievements }");
  content = content.replace(/'/g, "&apos;");
  fs.writeFileSync(victoryModalPath, content);
}

console.log('✅ Quick lint fixes applied');