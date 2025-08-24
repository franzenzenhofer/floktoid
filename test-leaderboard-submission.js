#!/usr/bin/env node

console.log('='.repeat(60));
console.log('LEADERBOARD SUBMISSION TEST & DEBUGGING');
console.log('='.repeat(60));

// Test different username formats
async function testSubmissions() {
  const testCases = [
    { username: 'TauPi776', score: 5000, wave: 20, gameId: 'test-taup1' },
    { username: 'AlphaBeta123', score: 3000, wave: 15, gameId: 'test-ab123' },
    { username: 'Test User 123', score: 2000, wave: 10, gameId: 'test-space' },
    { username: 'τπ776', score: 1000, wave: 5, gameId: 'test-unicode' },
  ];
  
  for (const test of testCases) {
    console.log(`\nTesting: ${test.username}`);
    
    try {
      const response = await fetch('https://floktoid.franzai.com/api/leaderboard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test)
      });
      
      console.log(`  Status: ${response.status}`);
      const result = await response.json();
      console.log(`  Result:`, result);
      
      if (result.success) {
        // Check if it appears
        const leaderboard = await fetch('https://floktoid.franzai.com/api/leaderboard?period=24h');
        const data = await leaderboard.json();
        const found = data.last24h?.find(e => e.username === test.username);
        console.log(`  Found in 24h: ${found ? 'YES' : 'NO'}`);
      }
    } catch (error) {
      console.error(`  ERROR:`, error.message);
    }
  }
}

// Root cause analysis
console.log('\n' + '='.repeat(60));
console.log('ROOT CAUSE ANALYSIS:');
console.log('='.repeat(60));

console.log(`
1. USERNAME ISSUES:
   - TauPi776 might be generated differently each time
   - localStorage might be disabled or cleared
   - Username might contain invalid characters

2. SUBMISSION TIMING:
   - Game over triggers submission
   - But if game crashes, submission never happens
   - No retry mechanism for failed submissions

3. NETWORK ISSUES:
   - No visible error feedback to user
   - Silently fails with console.error only
   - No retry on network failure

4. GAME SESSION:
   - GameSession only submits every 1000 points
   - Final submission on game over might fail
   - No persistence of failed submissions

5. BROWSER ISSUES:
   - Private/Incognito mode blocks localStorage
   - Ad blockers might block API calls
   - CORS issues in some configurations

6. SERVER ISSUES:
   - KV store might have limits
   - Rate limiting might block rapid submissions
   - Timestamp filtering excludes valid entries

7. CODE FLOW:
   - Submission happens in .catch() - errors ignored
   - No user feedback on submission status
   - No debug information available
`);

// Run tests
testSubmissions().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
});