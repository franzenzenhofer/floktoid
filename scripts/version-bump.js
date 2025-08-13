#!/usr/bin/env node

/**
 * Automatic version bumping for Color Me Same
 * - patch: +0.0.1 (for commits)
 * - minor: +0.1.0 (for deploys)  
 * - major: +1.0.0 (for major releases)
 */

import fs from 'fs';
import { execSync } from 'child_process';

const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: patch, minor, or major');
  process.exit(1);
}

// Read package.json
const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
const currentVersion = packageJson.version;

// Parse current version
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calculate new version
let newVersion;
switch (bumpType) {
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

// Update version files
try {
  // Generate version info with new version
  execSync('node scripts/generate-version.js', { stdio: 'inherit' });
  
  console.log(`✅ Version bumped: ${currentVersion} → ${newVersion}`);
  
  // Add version files to git staging
  execSync('git add package.json src/version.ts src/version.json', { stdio: 'pipe' });
  
} catch (error) {
  console.error('❌ Error updating version files:', error.message);
  process.exit(1);
}