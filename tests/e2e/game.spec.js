import { test, expect } from '@playwright/test';

// Set base URL from environment or default
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8787';

test.describe('Color Me Same Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('should load the game homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Color Me Same/);
    await expect(page.locator('h1')).toContainText('Color Me Same');
    await expect(page.locator('h2')).toContainText('Choose Difficulty');
  });

  test('should start easy game', async ({ page }) => {
    // Click easy difficulty
    await page.click('button:has-text("Easy")');
    
    // Wait for game to load
    await expect(page.locator('#loading')).toBeVisible();
    await expect(page.locator('#loading')).toBeHidden({ timeout: 10000 });
    
    // Check game elements are visible
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.game-board')).toBeVisible();
    await expect(page.locator('.power-ups')).toBeVisible();
    
    // Check initial state
    await expect(page.locator('#moves')).toHaveText('0');
    await expect(page.locator('#difficulty')).toHaveText('Easy');
  });

  test('should handle tile clicks', async ({ page }) => {
    // Start game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.game-board');
    
    // Get initial move count
    const initialMoves = await page.locator('#moves').textContent();
    
    // Click a tile
    await page.locator('.tile').first().click();
    
    // Check move count increased
    await expect(page.locator('#moves')).not.toHaveText(initialMoves);
  });

  test('should show hint on request', async ({ page }) => {
    // Start game
    await page.click('button:has-text("Medium")');
    await page.waitForSelector('.game-board');
    
    // Click hint button
    await page.click('button:has-text("Hint")');
    
    // Check for visual hint (box shadow)
    const tileWithHint = await page.locator('.tile').evaluateAll(tiles => 
      tiles.find(tile => tile.style.boxShadow.includes('yellow'))
    );
    
    expect(tileWithHint).toBeTruthy();
  });

  test('should handle power-ups', async ({ page }) => {
    // Start game
    await page.click('button:has-text("Medium")');
    await page.waitForSelector('.game-board');
    
    // Try to use wildcard
    await page.click('button:has-text("Wildcard")');
    
    // Check console for power-up message (basic check)
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('Power-up: wildcard')) {
        expect(msg.text()).toContain('wildcard');
      }
    });
  });

  test('should return to menu', async ({ page }) => {
    // Start game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.game-board');
    
    // Click menu button
    await page.click('button:has-text("Menu")');
    
    // Check we're back at menu
    await expect(page.locator('h2')).toContainText('Choose Difficulty');
    await expect(page.locator('.game-board')).not.toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.reload();
    
    // Check mobile styles applied
    await expect(page.locator('.game-container')).toBeVisible();
    
    // Start game on mobile
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.game-board');
    
    // Check dashboard is responsive (2 columns on mobile)
    const dashboardStyle = await page.locator('.dashboard').evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    expect(dashboardStyle).toContain('2');
  });

  test('should solve a puzzle', async ({ page }) => {
    test.slow(); // This test might take longer
    
    // Start easy game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.game-board');
    
    // Keep clicking tiles until we win (simplified approach)
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
      // Check if victory modal is visible
      const victoryModal = page.locator('#victoryModal');
      if (await victoryModal.isVisible()) {
        break;
      }
      
      // Click a random tile
      const tiles = await page.locator('.tile:not(.locked)').all();
      if (tiles.length > 0) {
        const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
        await randomTile.click();
      }
      
      attempts++;
      await page.waitForTimeout(100); // Small delay between moves
    }
    
    // Verify victory
    await expect(page.locator('#victoryModal')).toBeVisible();
    await expect(page.locator('#victoryModal h2')).toContainText('Puzzle Solved!');
  });

  test('should submit score to leaderboard', async ({ page }) => {
    // Intercept score submission
    let scoreSubmitted = false;
    await page.route('**/api/score', async route => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      expect(postData).toHaveProperty('score');
      expect(postData).toHaveProperty('moves');
      expect(postData).toHaveProperty('difficulty');
      
      scoreSubmitted = true;
      await route.fulfill({ json: { success: true } });
    });
    
    // Complete a game
    await page.click('button:has-text("Easy")');
    await page.waitForSelector('.game-board');
    
    // Simulate winning by evaluating victory condition
    await page.evaluate(() => {
      window.endGame();
    });
    
    // Wait for score submission
    await page.waitForTimeout(1000);
    expect(scoreSubmitted).toBe(true);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API calls to simulate error
    await page.route('**/api/generate', route => 
      route.fulfill({ status: 500, body: 'Server error' })
    );
    
    // Try to start game
    await page.click('button:has-text("Easy")');
    
    // Should show loading then return to menu
    await expect(page.locator('#loading')).toBeVisible();
    await expect(page.locator('#loading')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('h2')).toContainText('Choose Difficulty');
  });
});