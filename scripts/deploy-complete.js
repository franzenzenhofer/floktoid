#!/usr/bin/env node

/**
 * Complete deployment script for Color Me Same
 * Handles:
 * 1. Version bumping (already done by predeploy)
 * 2. Building (already done by predeploy)
 * 3. Deploying to Cloudflare
 * 4. Running post-deploy tests
 * 5. Committing version changes
 * 6. Tagging release
 * 7. Pushing to GitHub
 */

import { execSync } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.purple}🚀 ${msg}${colors.reset}\n`)
};

// Execute command with error handling
function exec(command, options = {}) {
  try {
    return execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      ...options
    });
  } catch (error) {
    if (!options.ignoreError) {
      throw error;
    }
    return null;
  }
}

// Get output from command
function getOutput(command) {
  try {
    return execSync(command, {
      cwd: rootDir,
      encoding: 'utf8'
    }).trim();
  } catch (error) {
    return null;
  }
}

// Main deployment function
async function deploy() {
  log.section('Starting Complete Deployment Process');

  try {
    // Get current version
    const packageJson = JSON.parse(fs.readFileSync(join(rootDir, 'package.json'), 'utf8'));
    const version = packageJson.version;
    log.info(`Deploying version: ${version}`);

    // Step 1: Deploy to Cloudflare (wrangler deploy is already called by npm run deploy)
    log.section('Deploying to Cloudflare Workers');
    exec('wrangler deploy');
    log.success('Deployed to Cloudflare Workers');

    // Step 2: Run post-deploy tests
    log.section('Running Post-Deploy Tests');
    exec('npm run test:post-deploy');
    log.success('Post-deploy tests passed');

    // Step 3: Commit version changes if any
    const hasChanges = getOutput('git status --porcelain');
    if (hasChanges) {
      log.section('Committing Version Changes');
      exec('git add .');
      exec(`git commit -m "chore: release v${version}"`);
      log.success(`Committed version changes for v${version}`);
    }

    // Step 4: Tag the release
    log.section('Creating Release Tag');
    const tagExists = getOutput(`git tag -l "v${version}"`);
    if (!tagExists) {
      exec(`git tag -a "v${version}" -m "Release v${version}"`);
      log.success(`Created tag v${version}`);
    } else {
      log.warning(`Tag v${version} already exists`);
    }

    // Step 5: Push to GitHub
    log.section('Pushing to GitHub');
    exec('git push origin master --follow-tags');
    log.success('Pushed to GitHub with tags');

    // Final summary
    log.section('Deployment Complete! 🎉');
    console.log(`
📊 Deployment Summary:
  📦 Version: v${version}
  🌐 Live at: https://color-me-same.franzai.com
  🐙 GitHub: https://github.com/franzenzenhofer/color-me-same
  🏷️  Tag: v${version}
  
🎮 The game is now live and ready to play!
    `);

  } catch (error) {
    log.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  }
}

// Run deployment
deploy().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});