#!/usr/bin/env node

/**
 * Generate version information at build time
 * Single source of truth for version, date, and commit info
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get build-time information
const packageJson = JSON.parse(fs.readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
const buildDate = new Date().toISOString();
const buildTimestamp = Date.now();

let gitCommit = 'unknown';
let gitBranch = 'unknown';
try {
  gitCommit = execSync('git rev-parse HEAD', { cwd: projectRoot }).toString().trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: projectRoot }).toString().trim();
} catch (e) {
  console.warn('Could not get git info:', e.message);
}

// Generate version object
const versionInfo = {
  version: packageJson.version,
  buildDate,
  buildTimestamp,
  gitCommit,
  gitBranch,
  environment: process.env.NODE_ENV || 'development',
  // For display
  displayVersion: `v${packageJson.version}`,
  displayDate: new Date(buildDate).toLocaleDateString() + ' ' + new Date(buildDate).toLocaleTimeString(),
  displayCommit: gitCommit.slice(0, 7),
};

// Write to src/version.json for runtime access
fs.writeFileSync(
  join(projectRoot, 'src/version.json'),
  JSON.stringify(versionInfo, null, 2)
);

// Write to TypeScript file for import
const tsContent = `// Auto-generated at build time - DO NOT EDIT
export const VERSION_INFO = ${JSON.stringify(versionInfo, null, 2)} as const;

export const {
  version,
  buildDate,
  buildTimestamp,
  gitCommit,
  gitBranch,
  environment,
  displayVersion,
  displayDate,
  displayCommit
} = VERSION_INFO;
`;

fs.writeFileSync(
  join(projectRoot, 'src/version.ts'),
  tsContent
);

console.log(`✅ Version info generated: ${versionInfo.displayVersion} (${versionInfo.displayCommit})`);