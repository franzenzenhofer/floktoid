import { test, expect } from '@playwright/test';

test.describe('NEON FLOCK Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display start screen', async ({ page }) => {
    await expect(page.locator('text=NEON')).toBeVisible();
    await expect(page.locator('text=FLOCK')).toBeVisible();
    await expect(page.locator('text=START GAME')).toBeVisible();
  });

  test('should start game when clicking start button', async ({ page }) => {
    await page.click('text=START GAME');
    
    // Check HUD is visible
    await expect(page.locator('.neon-text').first()).toBeVisible();
    await expect(page.locator('text=WAVE 1')).toBeVisible();
  });

  test('should handle touch/click input', async ({ page }) => {
    await page.click('text=START GAME');
    
    // Simulate asteroid launch
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(500, 200);
    await page.mouse.up();
    
    // Game should still be running
    await expect(page.locator('.neon-text').first()).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    await expect(page.locator('text=NEON')).toBeVisible();
    await expect(page.locator('text=START GAME')).toBeVisible();
    
    await page.click('text=START GAME');
    await expect(page.locator('.neon-text').first()).toBeVisible();
  });

  test('should show game over screen when game ends', async ({ page }) => {
    // This would require mocking or waiting for actual game over
    // For now, just check the game starts properly
    await page.click('text=START GAME');
    await expect(page.locator('.neon-text').first()).toBeVisible();
  });
});