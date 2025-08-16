import { test, expect } from '@playwright/test';

test('Wave 5 progression test', async ({ page }) => {
  // Collect console logs
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('[WAVE]')) {
      consoleLogs.push(msg.text());
      console.log(msg.text());
    }
  });

  // Go to the game
  await page.goto('http://localhost:3000');
  
  // Start the game
  await page.click('text=Play');
  
  // Wait for game to load
  await page.waitForTimeout(1000);
  
  // Function to clear a wave by clicking repeatedly
  const clearWave = async () => {
    // Click multiple times to launch asteroids and kill birds
    for (let i = 0; i < 20; i++) {
      await page.mouse.click(400, 300);
      await page.waitForTimeout(100);
    }
    // Wait for wave to complete
    await page.waitForTimeout(2000);
  };
  
  // Clear waves 1-6 to see what happens with wave 5
  for (let wave = 1; wave <= 6; wave++) {
    console.log(`\n=== Clearing wave ${wave} ===`);
    await clearWave();
  }
  
  // Print all collected logs
  console.log('\n=== All Wave Logs ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Check if wave 5 was skipped
  const hasWave5Start = consoleLogs.some(log => log.includes('Starting wave 5'));
  const hasWave5Complete = consoleLogs.some(log => log.includes('Wave 5 complete'));
  
  console.log('\n=== Analysis ===');
  console.log(`Wave 5 started: ${hasWave5Start}`);
  console.log(`Wave 5 completed: ${hasWave5Complete}`);
  
  // Assert that wave 5 exists
  expect(hasWave5Start).toBe(true);
});