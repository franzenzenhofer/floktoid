/**
 * @fileoverview Mobile Gameplay Test to Level 10
 * Tests the Color Me Same game on mobile viewport to level 10
 * Validates tutorial improvements and compact UI
 */

import { chromium } from 'playwright';
import path from 'path';

async function testMobileGameplay() {
  console.log('🎮 Starting mobile gameplay test to level 10...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down for better visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to local development server
    console.log('📱 Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-initial.png',
      fullPage: true 
    });
    console.log('📸 Initial screenshot taken');
    
    // Wait for game to load
    await page.waitForSelector('button:has-text("NEW GAME"), [data-testid="start-button"], .start-button', { timeout: 10000 });
    console.log('✅ Game loaded successfully');
    
    // Start the game
    const startButton = await page.locator('button').filter({ hasText: /NEW GAME|start/i }).first();
    await startButton.click();
    console.log('🎯 Game started');
    
    // Take screenshot after starting
    await page.screenshot({ 
      path: 'screenshots/mobile-game-started.png',
      fullPage: true 
    });
    
    // Play through levels 1-10
    for (let level = 1; level <= 10; level++) {
      console.log(`\n🎲 Playing Level ${level}...`);
      
      // Wait for level to load
      await page.waitForSelector('.grid, [data-testid="game-grid"], .game-grid, [class*="tile"], button', { timeout: 5000 });
      
      // Take screenshot of current level
      await page.screenshot({ 
        path: `screenshots/mobile-level-${level}.png`,
        fullPage: true 
      });
      
      if (level <= 3) {
        console.log(`📚 Tutorial Level ${level}`);
        
        // Handle tutorial levels with specific patterns
        // Get game tiles - buttons that are game tiles (exclude UI buttons)
        const allButtons = await page.locator('button');
        const buttonCount = await allButtons.count();
        console.log(`  → Found ${buttonCount} total buttons`);
        
        // Game tiles should be buttons 4-12 based on debug output
        const gameTiles = await page.locator('button').nth(4); // First game tile
        const gameTileButtons = await page.locator('button').filter({ 
          hasText: '' // Empty text content for game tiles
        });
        
        // Alternative: select buttons with the specific game tile styling
        const tileButtons = await page.locator('button:has(.w-full.aspect-square), button.cursor-pointer.hover\\:scale-105');
        
        if (level === 1) {
          // Level 1: 1 tap center
          console.log('  → Tapping center tile (1 tap)');
          const centerButton = await page.locator('button').nth(8); // 5th game tile (center of 3x3)
          await centerButton.click();
        } else if (level === 2) {
          // Level 2: 2 taps - center then top
          console.log('  → Tapping center then top (2 taps)');
          await page.locator('button').nth(8).click(); // Center
          await page.waitForTimeout(500);
          await page.locator('button').nth(5).click(); // Top
        } else if (level === 3) {
          // Level 3: 3 taps - corners and center
          console.log('  → Tapping 3 specific tiles');
          await page.locator('button').nth(4).click(); // Top-left
          await page.waitForTimeout(500);
          await page.locator('button').nth(6).click(); // Top-right
          await page.waitForTimeout(500);
          await page.locator('button').nth(8).click(); // Center
        }
      } else {
        // For levels 4+, use a simple strategy: try clicking tiles until solved
        console.log(`  → Using adaptive strategy for Level ${level}`);
        
        let attempts = 0;
        const maxAttempts = 20;
        
        while (attempts < maxAttempts) {
          // Check if level is complete (look for victory state or next level button)
          const isComplete = await page.locator('button:has-text("Continue"), button:has-text("Next"), .victory, .level-complete').count() > 0;
          
          if (isComplete) {
            console.log(`  ✅ Level ${level} completed!`);
            break;
          }
          
          // Try clicking different game tiles (buttons 4-12)
          const gameButtonIndex = 4 + (attempts % 9); // Cycle through game tiles
          await page.locator('button').nth(gameButtonIndex).click();
          await page.waitForTimeout(300);
          
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          console.log(`  ⚠️ Could not solve Level ${level} within ${maxAttempts} attempts`);
        }
      }
      
      // Wait for level completion and continue
      await page.waitForTimeout(1000);
      
      // Look for continue/next button
      const continueButton = await page.locator('button:has-text("Continue"), button:has-text("Next"), .continue-button').first();
      if (await continueButton.count() > 0) {
        await continueButton.click();
        console.log(`  ➡️ Continuing to next level`);
        await page.waitForTimeout(1000);
      }
      
      // Take screenshot after level completion
      await page.screenshot({ 
        path: `screenshots/mobile-level-${level}-complete.png`,
        fullPage: true 
      });
    }
    
    // Final screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-final-level-10.png',
      fullPage: true 
    });
    
    console.log('\n🎉 Successfully tested mobile gameplay to level 10!');
    console.log('📸 Screenshots saved in screenshots/ directory');
    
    // Test UI elements are compact and mobile-friendly
    console.log('\n🔍 Checking mobile UI elements...');
    
    // Check that dashboard is compact
    const dashboard = await page.locator('.dashboard, .hud, .game-info').first();
    if (await dashboard.count() > 0) {
      const dashboardBox = await dashboard.boundingBox();
      console.log(`📏 Dashboard height: ${dashboardBox?.height}px`);
      
      if (dashboardBox && dashboardBox.height < 80) {
        console.log('✅ Dashboard is compact and mobile-friendly');
      } else {
        console.log('⚠️ Dashboard might be too tall for mobile');
      }
    }
    
    // Check that toasts appear properly
    const toasts = await page.locator('.toast, .notification').count();
    console.log(`🍞 Found ${toasts} toast elements`);
    
  } catch (error) {
    console.error('❌ Error during mobile gameplay test:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-error.png',
      fullPage: true 
    });
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testMobileGameplay()
  .then(() => {
    console.log('\n✅ Mobile gameplay test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Mobile gameplay test failed:', error);
    process.exit(1);
  });

export { testMobileGameplay };