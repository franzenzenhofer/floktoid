#!/usr/bin/env node

/**
 * Test that leaderboard submissions work at all save points
 */

import { execSync } from 'child_process';

console.log('🧪 Testing Leaderboard Submission Flow...\n');

// Generate test username
const testUser = `TestBot${Math.floor(Math.random() * 1000)}`;
const testScores = [
  { score: 2000, wave: 2, event: 'wave-complete' },
  { score: 3500, wave: 3, event: 'home-button' },
  { score: 5000, wave: 5, event: 'game-over' }
];

console.log(`📝 Test user: ${testUser}\n`);

// Submit test scores
for (const test of testScores) {
  const gameId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`Submitting ${test.event}: Score ${test.score}, Wave ${test.wave}`);
  
  const response = execSync(`curl -s -X POST https://floktoid.franzai.com/api/leaderboard/submit \
    -H "Content-Type: application/json" \
    -d '{"username":"${testUser}","score":${test.score},"wave":${test.wave},"gameId":"${gameId}"}'`, 
    { encoding: 'utf-8' }
  );
  
  const result = JSON.parse(response);
  if (result.success) {
    console.log(`✅ ${test.event} submission successful`);
  } else {
    console.log(`❌ ${test.event} submission failed:`, result);
  }
  
  // Small delay between submissions
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Check if user appears in leaderboard
console.log('\n📊 Checking leaderboard...');

const leaderboard = execSync('curl -s https://floktoid.franzai.com/api/leaderboard', { encoding: 'utf-8' });
const data = JSON.parse(leaderboard);

// Check 24h leaderboard
const found24h = data.last24h?.filter(entry => entry.username === testUser);
const foundAllTime = data.allTime?.filter(entry => entry.username === testUser);

console.log('\n📈 Results:');
if (found24h && found24h.length > 0) {
  console.log(`✅ User appears in 24h leaderboard with ${found24h.length} entries`);
  found24h.forEach(entry => {
    console.log(`   - Score: ${entry.score}, Wave: ${entry.wave}`);
  });
} else {
  console.log('❌ User NOT found in 24h leaderboard');
}

if (foundAllTime && foundAllTime.length > 0) {
  console.log(`✅ User appears in all-time leaderboard`);
  console.log(`   - Highest score: ${foundAllTime[0].score}`);
} else {
  console.log('❌ User NOT found in all-time leaderboard');
}

console.log('\n✨ Test complete!');