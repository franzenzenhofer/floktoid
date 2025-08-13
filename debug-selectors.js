/**
 * Debug script to check what selectors are available in the game
 */

import { chromium } from 'playwright';

async function debugSelectors() {
  console.log('🔍 Debugging selectors...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Start the game
    const startButton = await page.locator('button').filter({ hasText: /NEW GAME|start/i }).first();
    await startButton.click();
    await page.waitForTimeout(2000);
    
    // Debug: Check all elements
    console.log('\n🎯 Available buttons:');
    const buttons = await page.locator('button').all();
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const className = await buttons[i].getAttribute('class');
      console.log(`  Button ${i}: "${text}" class="${className}"`);
    }
    
    console.log('\n🎯 Available divs with classes:');
    const divs = await page.locator('div[class]').all();
    for (let i = 0; i < Math.min(divs.length, 20); i++) {
      const className = await divs[i].getAttribute('class');
      console.log(`  Div ${i}: class="${className}"`);
    }
    
    console.log('\n🎯 Grid structure:');
    const gridSelectors = ['.grid', '[data-testid="game-grid"]', '.game-grid', '[class*="grid"]'];
    for (const selector of gridSelectors) {
      const count = await page.locator(selector).count();
      console.log(`  ${selector}: ${count} elements`);
    }
    
    console.log('\n🎯 Clickable elements in game area:');
    const clickables = await page.locator('button, [role="button"], [data-testid*="tile"], [class*="tile"]').all();
    for (let i = 0; i < clickables.length; i++) {
      const tagName = await clickables[i].evaluate(el => el.tagName);
      const className = await clickables[i].getAttribute('class');
      const dataTestId = await clickables[i].getAttribute('data-testid');
      console.log(`  Clickable ${i}: <${tagName}> class="${className}" data-testid="${dataTestId}"`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugSelectors();