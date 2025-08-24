#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔍 Identifying non-conforming usernames...\n');

// Valid Greek letters that appear in real usernames
const VALID_GREEK = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 
  'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
  'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron',
  'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon',
  'Phi', 'Chi', 'Psi', 'Omega'
];

// Get all usernames
const output = execSync('wrangler kv key list --namespace-id=7c325dba740147a48c9cd836075a2614 --remote', { encoding: 'utf-8' });
const keys = JSON.parse(output);

// Extract unique usernames
const usernames = new Set();
for (const key of keys) {
  if (key.name.startsWith('alltime:')) {
    usernames.add(key.name.replace('alltime:', ''));
  }
}

console.log(`Total unique usernames: ${usernames.size}\n`);

// Check each username
const invalidUsers = [];
const validUsers = [];

for (const username of usernames) {
  // Valid format: Greek letters + 3 digits (e.g., AlphaBeta123, PiTauGamma101)
  // Single Greek letter + 3 digits is also valid (e.g., Pi776)
  
  let isValid = false;
  
  // Check if it ends with 3 digits
  if (/\d{3}$/.test(username)) {
    const nameWithoutDigits = username.replace(/\d{3}$/, '');
    
    // Check if the name part consists only of valid Greek letters
    let tempName = nameWithoutDigits;
    let foundGreek = false;
    
    for (const greek of VALID_GREEK) {
      if (tempName.includes(greek)) {
        tempName = tempName.replace(new RegExp(greek, 'g'), '');
        foundGreek = true;
      }
    }
    
    // If we found Greek letters and nothing is left, it's valid
    if (foundGreek && tempName === '') {
      isValid = true;
    }
  }
  
  if (isValid) {
    validUsers.push(username);
  } else {
    invalidUsers.push(username);
  }
}

console.log(`✅ Valid Greek usernames: ${validUsers.length}`);
console.log(`❌ Invalid/test usernames: ${invalidUsers.length}\n`);

if (invalidUsers.length > 0) {
  console.log('Invalid usernames to delete:');
  invalidUsers.sort().forEach(user => console.log(`  - ${user}`));
  
  // Save to file for deletion
  import('fs').then(fs => fs.writeFileSync('invalid-users.txt', invalidUsers.join('\n')));
  console.log('\nSaved to invalid-users.txt');
}

console.log('\nSample valid usernames:');
validUsers.slice(0, 10).forEach(user => console.log(`  ✓ ${user}`));