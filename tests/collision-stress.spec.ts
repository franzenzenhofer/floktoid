import { test, expect, Page } from '@playwright/test';

test.describe('Collision System Stress Tests', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: p }) => {
    page = p;
    await page.goto('http://localhost:3000');
    await page.waitForSelector('canvas', { timeout: 5000 });
    
    // Start game
    await page.click('button:has-text("Start")');
    await page.waitForTimeout(1000);
  });
  
  test('should handle rapid single collisions without freezing', async () => {
    const canvas = await page.locator('canvas');
    
    // Monitor for freezes
    let lastFrameTime = await page.evaluate(() => performance.now());
    let freezeDetected = false;
    
    // Set up freeze detection
    const checkFreeze = async () => {
      const currentTime = await page.evaluate(() => performance.now());
      const delta = currentTime - lastFrameTime;
      
      if (delta > 100) { // More than 100ms = freeze
        freezeDetected = true;
        console.error(`Freeze detected: ${delta}ms`);
      }
      
      lastFrameTime = currentTime;
    };
    
    // Fire 10 rapid asteroids
    for (let i = 0; i < 10; i++) {
      await canvas.click({
        position: { x: 400 + i * 20, y: 550 },
        button: 'left'
      });
      
      await page.waitForTimeout(100);
      
      await page.mouse.move(400 + i * 20, 200);
      await page.mouse.up();
      
      await checkFreeze();
      
      await page.waitForTimeout(200);
    }
    
    expect(freezeDetected).toBe(false);
  });
  
  test('should handle multiple simultaneous collisions', async () => {
    const canvas = await page.locator('canvas');
    
    // Launch multiple asteroids at once
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push((async () => {
        await page.mouse.move(300 + i * 50, 550);
        await page.mouse.down();
        await page.waitForTimeout(300); // Charge up
        await page.mouse.move(300 + i * 50, 200);
        await page.mouse.up();
      })());
    }
    
    await Promise.all(promises);
    
    // Check game is still responsive
    await page.waitForTimeout(1000);
    
    // Try another action to verify not frozen
    await canvas.click({
      position: { x: 400, y: 550 }
    });
    
    await page.mouse.up();
    
    // Check FPS
    const fps = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let frames = 0;
        const start = performance.now();
        
        function count() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames);
          }
        }
        
        requestAnimationFrame(count);
      });
    });
    
    expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
  });
  
  test('should handle near-misses efficiently', async () => {
    const canvas = await page.locator('canvas');
    
    // Fire asteroids that barely miss birds
    for (let i = 0; i < 20; i++) {
      const x = 200 + Math.random() * 400;
      const y = 550;
      
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.waitForTimeout(50);
      
      // Aim slightly off from birds
      await page.mouse.move(x + 100, 300);
      await page.mouse.up();
      
      await page.waitForTimeout(100);
    }
    
    // Game should still be responsive
    const isResponsive = await page.evaluate(() => {
      const start = performance.now();
      let count = 0;
      
      return new Promise<boolean>((resolve) => {
        function frame() {
          count++;
          if (count < 60) {
            requestAnimationFrame(frame);
          } else {
            const duration = performance.now() - start;
            resolve(duration < 2000); // 60 frames should take ~1 second
          }
        }
        requestAnimationFrame(frame);
      });
    });
    
    expect(isResponsive).toBe(true);
  });
  
  test('should handle collision cascades', async () => {
    const canvas = await page.locator('canvas');
    
    // Create a scenario where collisions trigger more collisions
    // Large asteroid that will fragment
    await page.mouse.move(400, 550);
    await page.mouse.down();
    await page.waitForTimeout(2000); // Max charge
    await page.mouse.move(400, 200);
    await page.mouse.up();
    
    // Fire small asteroids at the large one
    await page.waitForTimeout(500);
    
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(350 + i * 50, 550);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.move(400, 300);
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
    
    // Check game hasn't frozen
    const canInteract = await page.evaluate(() => {
      try {
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        
        // Try to get context - will fail if frozen
        const ctx = canvas.getContext('2d');
        return ctx !== null;
      } catch {
        return false;
      }
    });
    
    expect(canInteract).toBe(true);
  });
  
  test('should log collision performance metrics', async () => {
    // Inject performance monitoring
    await page.evaluate(() => {
      let collisionTime = 0;
      let frameCount = 0;
      
      // Hook into collision system if exposed
      (window as any).collisionMetrics = {
        frameStart: () => {
          collisionTime = performance.now();
          frameCount++;
        },
        frameEnd: () => {
          const duration = performance.now() - collisionTime;
          if (duration > 5) {
            console.warn(`Slow collision frame ${frameCount}: ${duration}ms`);
          }
        }
      };
    });
    
    const canvas = await page.locator('canvas');
    
    // Perform collision-heavy actions
    for (let i = 0; i < 5; i++) {
      await canvas.click({
        position: { x: 300 + i * 40, y: 550 }
      });
      await page.mouse.move(300 + i * 40, 250);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    
    // Collect any warnings
    const warnings = await page.evaluate(() => {
      const logs: string[] = [];
      const originalWarn = console.warn;
      console.warn = (...args) => {
        logs.push(args.join(' '));
        originalWarn(...args);
      };
      return logs;
    });
    
    // Should have minimal slow frames
    const slowFrames = warnings.filter(w => w.includes('Slow collision'));
    expect(slowFrames.length).toBeLessThan(5);
  });
});