#!/usr/bin/env node

/**
 * Clean up test and fake users from Cloudflare KV store
 */

import { execSync } from 'child_process';

console.log('🧹 Cleaning test data from leaderboard...\n');

// Patterns to identify test/fake users
const testPatterns = [
  'TestUser',
  'test_',
  'dev_test',
  'ΓαμμαΔέλτα',  // Greek test name
  '🎮Player',     // Emoji test name
  'TauPi776',     // Test user from debugging
  'AlphaBeta123', // Test user
  'Player123',    // Generic test
  'TestUser999'   // Test user
];

async function cleanupKV() {
  try {
    // First, list all keys to see what we have
    console.log('📋 Listing all KV keys...');
    const listCmd = `wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614`;
    const output = execSync(listCmd, { encoding: 'utf-8' });
    
    let keys;
    try {
      keys = JSON.parse(output);
    } catch (e) {
      console.error('Failed to parse KV list output:', e);
      console.log('Raw output:', output);
      return;
    }
    
    console.log(`Found ${keys.length} total keys\n`);
    
    // Identify keys to delete
    const keysToDelete = [];
    
    for (const key of keys) {
      const keyName = key.name;
      
      // Check if it's a test key
      let isTest = false;
      
      // Check for test patterns in the key name
      for (const pattern of testPatterns) {
        if (keyName.includes(pattern) || keyName.includes(pattern.replace(/[^a-zA-Z0-9_-]/g, '_'))) {
          isTest = true;
          break;
        }
      }
      
      // Also check for keys with "test" in them
      if (keyName.toLowerCase().includes('test')) {
        isTest = true;
      }
      
      if (isTest) {
        keysToDelete.push(keyName);
      }
    }
    
    console.log(`🗑️  Found ${keysToDelete.length} test keys to delete:\n`);
    keysToDelete.forEach(key => console.log(`  - ${key}`));
    
    if (keysToDelete.length === 0) {
      console.log('\n✅ No test data found to clean!');
      return;
    }
    
    console.log('\n🚮 Deleting test keys...');
    
    // Delete keys in batches
    const batchSize = 10;
    for (let i = 0; i < keysToDelete.length; i += batchSize) {
      const batch = keysToDelete.slice(i, i + batchSize);
      
      for (const key of batch) {
        try {
          const deleteCmd = `wrangler kv key delete "${key}" --namespace-id=7c325dba740147a48c9cd836075a2614 --force`;
          execSync(deleteCmd, { encoding: 'utf-8' });
          console.log(`  ✓ Deleted: ${key}`);
        } catch (e) {
          console.error(`  ✗ Failed to delete ${key}:`, e.message);
        }
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    
    // Show remaining keys
    console.log('\n📊 Verifying cleanup...');
    const verifyOutput = execSync(listCmd, { encoding: 'utf-8' });
    const remainingKeys = JSON.parse(verifyOutput);
    
    console.log(`Remaining keys: ${remainingKeys.length}`);
    
    // Show non-test usernames
    const usernames = new Set();
    for (const key of remainingKeys) {
      if (key.name.startsWith('alltime:')) {
        const username = key.name.replace('alltime:', '');
        usernames.add(username);
      }
    }
    
    if (usernames.size > 0) {
      console.log('\n👥 Real users remaining:');
      Array.from(usernames).forEach(user => console.log(`  - ${user}`));
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanupKV();