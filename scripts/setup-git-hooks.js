#!/usr/bin/env node

/**
 * Setup Git hooks for automatic linting, type checking, and version bumping
 */

import fs from 'fs';
import { execSync } from 'child_process';

const gitHooksDir = '.git/hooks';
const preCommitHook = `${gitHooksDir}/pre-commit`;

// Create git hooks directory if it doesn't exist
if (!fs.existsSync(gitHooksDir)) {
  fs.mkdirSync(gitHooksDir, { recursive: true });
}

// Pre-commit hook content
const preCommitContent = `#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Run lint with zero warnings policy
echo "📝 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed! Fix errors and warnings before committing."
  exit 1
fi

# Run type checking
echo "🔧 Type checking..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed! Fix type errors before committing."
  exit 1
fi

# Bump patch version (0.0.1)
echo "📈 Bumping version (patch)..."
npm run version:bump:patch
if [ $? -ne 0 ]; then
  echo "❌ Version bump failed!"
  exit 1
fi

echo "✅ Pre-commit checks passed!"
`;

// Write pre-commit hook
fs.writeFileSync(preCommitHook, preCommitContent);

// Make executable
try {
  execSync(`chmod +x ${preCommitHook}`);
  console.log('✅ Git pre-commit hook installed successfully!');
  console.log('🎯 Every commit will now:');
  console.log('   • Run ESLint with zero warnings policy');
  console.log('   • Run TypeScript type checking');
  console.log('   • Automatically bump patch version (+0.0.1)');
  console.log('');
  console.log('🚀 Every deploy will:');
  console.log('   • Run all the above checks');
  console.log('   • Automatically bump minor version (+0.1.0)');
  console.log('   • Deploy to production');
  console.log('   • Run post-deployment tests');
} catch (error) {
  console.error('❌ Failed to make pre-commit hook executable:', error.message);
  process.exit(1);
}