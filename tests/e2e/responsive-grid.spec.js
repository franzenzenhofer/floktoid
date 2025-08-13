import { test, expect } from '@playwright/test';

// Test different grid sizes in mobile viewport
const gridSizes = [
  { difficulty: 'easy', gridSize: 3 },
  { difficulty: 'easy', gridSize: 6 },
  { difficulty: 'medium', gridSize: 8 },
  { difficulty: 'hard', gridSize: 10 },
  { difficulty: 'hard', gridSize: 12 },
  { difficulty: 'hard', gridSize: 15 },
  { difficulty: 'hard', gridSize: 20 }
];

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'Pixel 5', width: 393, height: 851 },
  { name: 'Galaxy S8+', width: 360, height: 740 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'Desktop', width: 1920, height: 1080 }
];

test.describe('Responsive Grid Tests', () => {
  for (const viewport of viewports) {
    for (const { difficulty, gridSize } of gridSizes) {
      test(`${gridSize}x${gridSize} grid on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
        // Set viewport
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to the game
        await page.goto('http://localhost:3000');
        
        // Select difficulty and start game
        await page.getByRole('button', { name: new RegExp(difficulty, 'i') }).click();
        await page.getByRole('button', { name: /start game/i }).click();
        
        // Wait for game board to render
        await page.waitForSelector('button[class*="rounded-lg"][class*="transition-all"]', { timeout: 5000 });
        
        // Check that there's no horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
        
        // Check that the game board container doesn't overflow
        const boardContainer = await page.locator('.grid').first();
        const boardBox = await boardContainer.boundingBox();
        
        if (boardBox) {
          // Board should not extend beyond viewport
          expect(boardBox.x + boardBox.width).toBeLessThanOrEqual(viewport.width);
          
          // Board should be visible
          expect(boardBox.width).toBeGreaterThan(0);
          expect(boardBox.height).toBeGreaterThan(0);
        }
        
        // Count tiles to verify grid size
        const tiles = await page.locator('button[class*="rounded-lg"][class*="transition-all"]').count();
        expect(tiles).toBeGreaterThanOrEqual(gridSize * gridSize);
        
        // Take screenshot for visual verification
        await page.screenshot({ 
          path: `test-results/responsive-${gridSize}x${gridSize}-${viewport.name.replace(/\s+/g, '-')}.png`,
          fullPage: false 
        });
        
        // Check that all tiles are clickable (not obscured)
        const firstTile = page.locator('button[class*="rounded-lg"][class*="transition-all"]').first();
        await expect(firstTile).toBeVisible();
        
        // Verify no horizontal scrollbar appears
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
        
        // Check header is visible and not overlapping
        const header = page.getByRole('link', { name: /color me same/i });
        await expect(header).toBeVisible();
        
        // Verify the header doesn't overlap game content
        const headerBox = await header.boundingBox();
        const dashboardBox = await page.locator('[class*="grid-cols-4"]').first().boundingBox();
        
        if (headerBox && dashboardBox) {
          expect(headerBox.y + headerBox.height).toBeLessThanOrEqual(dashboardBox.y);
        }
      });
    }
  }
  
  // Special test for very small screens
  test('Extreme small viewport test', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('http://localhost:3000');
    
    // Start a hard game (largest grid)
    await page.getByRole('button', { name: /hard/i }).click();
    await page.getByRole('button', { name: /start game/i }).click();
    
    // Wait for game to load
    await page.waitForSelector('button[class*="rounded-lg"][class*="transition-all"]', { timeout: 5000 });
    
    // Verify no overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth ||
             document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
    
    await page.screenshot({ path: 'test-results/extreme-small-viewport.png' });
  });
});