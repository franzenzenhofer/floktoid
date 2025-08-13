#!/usr/bin/env node

import fs from 'fs';

// Fix TutorialModal apostrophe
const tutorialPath = 'src/components/modals/TutorialModal.tsx';
if (fs.existsSync(tutorialPath)) {
  let content = fs.readFileSync(tutorialPath, 'utf-8');
  content = content.replace(/'/g, "&apos;");
  fs.writeFileSync(tutorialPath, content);
}

// Fix test file unused variables
const testPath = 'src/components/modals/__tests__/TutorialModal.test.tsx';
if (fs.existsSync(testPath)) {
  let content = fs.readFileSync(testPath, 'utf-8');
  content = content.replace('contextValue, dispatch: jest.fn() } as any;', '_contextValue, dispatch: jest.fn() } as GameContextType;');
  fs.writeFileSync(testPath, content);
}

// Fix useSolver test
const solverTestPath = 'src/hooks/__tests__/useSolver.test.ts';
if (fs.existsSync(solverTestPath)) {
  let content = fs.readFileSync(solverTestPath, 'utf-8');
  content = content.replace('import { expect, test, vi } from', 'import { expect, test } from');
  fs.writeFileSync(solverTestPath, content);
}

// Fix useSolver
const solverPath = 'src/hooks/useSolver.ts';
if (fs.existsSync(solverPath)) {
  let content = fs.readFileSync(solverPath, 'utf-8');
  content = content.replace('import { clone, isWinningState }', 'import { isWinningState }');
  fs.writeFileSync(solverPath, content);
}

// Fix setup.ts
const setupPath = 'src/test/setup.ts';
if (fs.existsSync(setupPath)) {
  let content = fs.readFileSync(setupPath, 'utf-8');
  content = content.replace('} as any;', '} as Record<string, unknown>;');
  fs.writeFileSync(setupPath, content);
}

// Fix worker.js - remove the broken comment
const workerPath = 'src/worker.js';
if (fs.existsSync(workerPath)) {
  let content = fs.readFileSync(workerPath, 'utf-8');
  content = content.replace(/\/\/ function getMimeType[\s\S]*?$/m, '');
  fs.writeFileSync(workerPath, content);
}

console.log('✅ Final lint fixes applied');