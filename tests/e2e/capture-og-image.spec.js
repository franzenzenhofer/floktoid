import { test } from '@playwright/test';

test('capture og:image screenshot', async ({ page }) => {
  // Set viewport to standard og:image size
  await page.setViewportSize({ width: 1200, height: 630 });
  
  // Go to the live game
  await page.goto('https://color-me-same.franzai.com', { waitUntil: 'networkidle' });
  
  // Wait for game to load
  await page.waitForSelector('text=Color Me Same', { timeout: 10000 });
  
  // If there's a Continue button, click New Game instead
  const newGameButton = page.locator('button:has-text("NEW GAME")');
  if (await newGameButton.isVisible()) {
    await newGameButton.click();
    await page.waitForTimeout(1500);
  }
  
  // Wait for game board to be visible
  await page.waitForSelector('[class*="grid-cols-3"]', { timeout: 5000 });
  
  // Make some moves to create a colorful board
  // Click different tiles to show the game in action
  const tiles = page.locator('[class*="aspect-square"]');
  const tileCount = await tiles.count();
  
  if (tileCount > 0) {
    // Click center tile
    await tiles.nth(4).click();
    await page.waitForTimeout(300);
    
    // Click top-left corner
    await tiles.nth(0).click();
    await page.waitForTimeout(300);
    
    // Click bottom-right corner
    await tiles.nth(8).click();
    await page.waitForTimeout(300);
  }
  
  // Take screenshot
  await page.screenshot({ 
    path: 'public/game-screenshot.png',
    fullPage: false
  });
  
  console.log('✅ OG image captured and saved to public/game-screenshot.png');
});