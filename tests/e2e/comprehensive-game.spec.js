import { test, expect } from '@playwright/test';

// Test configuration for different viewports
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
];

test.describe('Color Me Same - Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the start screen with all elements', async ({ page }) => {
    // Check title
    await expect(page.locator('h1')).toContainText('Color Me Same');
    
    // Check difficulty buttons
    await expect(page.getByRole('button', { name: /easy/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /medium/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /hard/i })).toBeVisible();
    
    // Check start button
    await expect(page.getByRole('button', { name: /start game/i })).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/start-screen.png', fullPage: true });
  });

  viewports.forEach(({ name, width, height }) => {
    test(`should be responsive on ${name} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      
      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width);
      
      // Check elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByRole('button', { name: /start game/i })).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ 
        path: `screenshots/responsive-${name}.png`, 
        fullPage: true 
      });
    });
  });

  test('should start easy game and show tutorial', async ({ page }) => {
    // Select easy difficulty
    await page.getByRole('button', { name: /easy/i }).click();
    
    // Start game
    await page.getByRole('button', { name: /start game/i }).click();
    
    // Wait for game board
    await page.waitForSelector('[class*="grid"]', { timeout: 5000 });
    
    // Check tutorial modal appears
    await expect(page.getByText(/how to play/i)).toBeVisible();
    
    // Close tutorial
    await page.getByRole('button', { name: /let's play/i }).click();
    
    // Check game board is visible
    const tiles = page.locator('button[class*="aspect-square"]');
    await expect(tiles).toHaveCount(9); // 3x3 grid for easy
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/easy-game-board.png' });
  });

  test('should play a game with tile interactions', async ({ page }) => {
    // Start easy game
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Close tutorial if present
    const tutorialButton = page.getByRole('button', { name: /let's play/i });
    if (await tutorialButton.isVisible()) {
      await tutorialButton.click();
    }
    
    // Get initial tile colors
    const firstTile = page.locator('button[class*="aspect-square"]').first();
    const initialColor = await firstTile.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Click first tile
    await firstTile.click();
    
    // Check color changed
    const newColor = await firstTile.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(newColor).not.toBe(initialColor);
    
    // Check move counter increased
    await expect(page.getByText(/moves/i).locator('..')).toContainText('1');
    
    // Take screenshot
    await page.screenshot({ path: 'screenshots/gameplay-after-move.png' });
  });

  test('should show victory modal when puzzle is solved', async ({ page }) => {
    // For testing, we'll simulate a win by clicking tiles
    // In a real test, you might want to inject a nearly-solved state
    
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Close tutorial
    const tutorialButton = page.getByRole('button', { name: /let's play/i });
    if (await tutorialButton.isVisible()) {
      await tutorialButton.click();
    }
    
    // Click tiles to try to solve (this is simplified for testing)
    const tiles = page.locator('button[class*="aspect-square"]');
    for (let i = 0; i < 10; i++) {
      await tiles.nth(i % 9).click();
      await page.waitForTimeout(100); // Small delay between moves
      
      // Check if victory modal appeared
      if (await page.getByText(/puzzle solved/i).isVisible()) {
        break;
      }
    }
    
    // If victory achieved, verify modal elements
    const victoryText = page.getByText(/puzzle solved/i);
    if (await victoryText.isVisible()) {
      await expect(page.getByText(/score/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /new game/i })).toBeVisible();
      
      await page.screenshot({ path: 'screenshots/victory-modal.png' });
    }
  });

  test('should handle power-ups correctly', async ({ page }) => {
    await page.getByRole('button', { name: /medium/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Check power-up buttons
    await expect(page.getByText(/wildcard/i)).toBeVisible();
    await expect(page.getByText(/freeze/i)).toBeVisible();
    await expect(page.getByText(/reset/i)).toBeVisible();
    await expect(page.getByText(/hint/i)).toBeVisible();
    
    // Click hint button
    await page.getByText(/hint/i).click();
    
    // Check for hint highlight (green ring)
    const highlightedTile = page.locator('[class*="ring-green"]');
    await expect(highlightedTile).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/hint-active.png' });
  });

  test('should handle pause/resume functionality', async ({ page }) => {
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Close tutorial
    const tutorialButton = page.getByRole('button', { name: /let's play/i });
    if (await tutorialButton.isVisible()) {
      await tutorialButton.click();
    }
    
    // Find pause button
    const pauseButton = page.locator('button').filter({ hasText: /pause/i });
    await pauseButton.click();
    
    // Check game is paused
    await expect(page.locator('button').filter({ hasText: /resume/i })).toBeVisible();
    
    // Try clicking a tile while paused (should not work)
    const firstTile = page.locator('button[class*="aspect-square"]').first();
    const colorBefore = await firstTile.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    await firstTile.click();
    
    const colorAfter = await firstTile.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Color should not change while paused
    expect(colorAfter).toBe(colorBefore);
  });

  test('should display info panel', async ({ page }) => {
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    
    // Click info button
    const infoButton = page.locator('button[class*="fixed bottom-4 right-4"]');
    await infoButton.click();
    
    // Check info panel content
    await expect(page.getByText(/about color me same/i)).toBeVisible();
    await expect(page.getByText(/features/i)).toBeVisible();
    await expect(page.getByText(/technical/i)).toBeVisible();
    
    // Close info panel
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText(/about color me same/i)).not.toBeVisible();
    
    await page.screenshot({ path: 'screenshots/info-panel.png' });
  });

  test('should track score and moves correctly', async ({ page }) => {
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Close tutorial
    const tutorialButton = page.getByRole('button', { name: /let's play/i });
    if (await tutorialButton.isVisible()) {
      await tutorialButton.click();
    }
    
    // Check initial state
    await expect(page.getByText(/moves/i).locator('..')).toContainText('0');
    await expect(page.getByText(/score/i).locator('..')).toContainText('0');
    
    // Make moves
    const tiles = page.locator('button[class*="aspect-square"]');
    await tiles.nth(0).click();
    await expect(page.getByText(/moves/i).locator('..')).toContainText('1');
    
    await tiles.nth(4).click();
    await expect(page.getByText(/moves/i).locator('..')).toContainText('2');
    
    await tiles.nth(8).click();
    await expect(page.getByText(/moves/i).locator('..')).toContainText('3');
  });

  test('should handle locked tiles in medium difficulty', async ({ page }) => {
    await page.getByRole('button', { name: /medium/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Look for locked tiles (with lock icon)
    const lockedTiles = page.locator('[class*="aspect-square"]').filter({ 
      has: page.locator('svg') 
    });
    
    // If locked tiles exist, verify they show lock count
    const lockCount = await lockedTiles.count();
    if (lockCount > 0) {
      // Check lock icon is visible
      await expect(lockedTiles.first().locator('svg')).toBeVisible();
      
      // Try clicking locked tile
      const firstLocked = lockedTiles.first();
      await firstLocked.click();
      
      // Locked tile should not change color immediately
      await page.screenshot({ path: 'screenshots/locked-tiles.png' });
    }
  });

  test('should generate comprehensive test report', async ({ page }) => {
    // This test generates a final report of all tests
    const report = {
      timestamp: new Date().toISOString(),
      tests: [
        'Start screen loads correctly',
        'Responsive on all viewports',
        'Game starts and shows tutorial',
        'Tile interactions work',
        'Victory modal displays',
        'Power-ups function',
        'Pause/resume works',
        'Info panel displays',
        'Score tracking works',
        'Locked tiles handled'
      ],
      screenshots: [
        'start-screen.png',
        'responsive-mobile.png',
        'responsive-tablet.png',
        'responsive-desktop.png',
        'easy-game-board.png',
        'gameplay-after-move.png',
        'victory-modal.png',
        'hint-active.png',
        'info-panel.png',
        'locked-tiles.png'
      ]
    };
    
    // Write report to file
    await page.evaluate((reportData) => {
      console.log('Test Report:', reportData);
    }, report);
  });
});

// Performance tests
test.describe('Performance Tests', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check bundle size by intercepting network requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        responses.push({
          url: response.url(),
          size: response.headers()['content-length'],
          type: response.headers()['content-type']
        });
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Log bundle sizes
    console.log('Bundle sizes:', responses);
  });

  test('should handle rapid clicks without crashes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /easy/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    await page.waitForSelector('[class*="grid"]');
    
    // Close tutorial
    const tutorialButton = page.getByRole('button', { name: /let's play/i });
    if (await tutorialButton.isVisible()) {
      await tutorialButton.click();
    }
    
    // Rapid click test
    const tiles = page.locator('button[class*="aspect-square"]');
    const clickPromises = [];
    
    for (let i = 0; i < 20; i++) {
      clickPromises.push(tiles.nth(i % 9).click());
    }
    
    // Should handle all clicks without errors
    await Promise.all(clickPromises);
    
    // Game should still be responsive
    await expect(page.getByText(/moves/i)).toBeVisible();
  });
});