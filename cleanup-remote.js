#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🧹 Cleaning test data from REMOTE leaderboard...\n');

// Test patterns
const testPatterns = [
  'TestUser',
  'test',
  'Test',
  'DirectTest',
  'LiveTest',
  'FixedLeaderboard',
  'ΓαμμαΔέλτα',
  '🎮Player',
  '_____Player',
  'TauPi776',
  'AlphaBeta123',
  'Player123',
  'TestUser999'
];

async function cleanRemote() {
  try {
    // Get all remote keys
    console.log('📋 Fetching remote KV keys...');
    const output = execSync('wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote', { encoding: 'utf-8' });
    const keys = JSON.parse(output);
    
    console.log(`Found ${keys.length} total keys\n`);
    
    // Find test keys
    const keysToDelete = [];
    
    for (const key of keys) {
      const keyName = key.name;
      
      // Check patterns
      for (const pattern of testPatterns) {
        const sanitized = pattern.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (keyName.includes(pattern) || keyName.includes(sanitized) || 
            keyName.toLowerCase().includes('test') ||
            keyName.includes('DirectTest') ||
            keyName.includes('LiveTest') ||
            keyName.includes('FixedLeaderboard')) {
          keysToDelete.push(keyName);
          break;
        }
      }
    }
    
    console.log(`🗑️  Found ${keysToDelete.length} test keys to delete:\n`);
    keysToDelete.slice(0, 20).forEach(key => console.log(`  - ${key}`));
    if (keysToDelete.length > 20) {
      console.log(`  ... and ${keysToDelete.length - 20} more`);
    }
    
    if (keysToDelete.length === 0) {
      console.log('✅ No test data found!');
      return;
    }
    
    console.log('\n🚮 Deleting test keys from remote KV...');
    
    // Delete in batches
    for (let i = 0; i < keysToDelete.length; i++) {
      const key = keysToDelete[i];
      try {
        execSync(`wrangler kv key delete "${key}" --namespace-id=7c325dba740147a48c9cd836075a2614 --remote`, { encoding: 'utf-8', stdio: 'pipe' });
        process.stdout.write('.');
        if ((i + 1) % 10 === 0) {
          console.log(` ${i + 1}/${keysToDelete.length}`);
        }
      } catch (e) {
        console.error(`\n✗ Failed to delete ${key}:`, e.message);
      }
    }
    
    console.log('\n\n✅ Cleanup complete!');
    
    // Verify
    console.log('\n📊 Verifying cleanup...');
    const verifyOutput = execSync('wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote', { encoding: 'utf-8' });
    const remaining = JSON.parse(verifyOutput);
    
    console.log(`Remaining keys: ${remaining.length}`);
    
    // Show real users
    const users = new Set();
    for (const key of remaining) {
      if (key.name.startsWith('alltime:')) {
        const user = key.name.replace('alltime:', '');
        if (!user.toLowerCase().includes('test')) {
          users.add(user);
        }
      }
    }
    
    if (users.size > 0) {
      console.log('\n👥 Real users remaining:');
      Array.from(users).slice(0, 10).forEach(user => console.log(`  - ${user}`));
      if (users.size > 10) {
        console.log(`  ... and ${users.size - 10} more`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanRemote();