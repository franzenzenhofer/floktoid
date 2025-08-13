import { chromium } from 'playwright';

async function debugTiles() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();
  
  console.log('🔍 Debugging tile rendering issue...\n');
  
  // Go to site
  await page.goto('https://color-me-same.franzai.com');
  await page.waitForTimeout(2000);
  
  // Start a game
  await page.click('button:has-text("easy")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Start Game")');
  await page.waitForTimeout(2000);
  
  // Check for game board
  const gameBoard = await page.$('.grid');
  if (!gameBoard) {
    console.log('❌ No game board found!');
    await browser.close();
    return;
  }
  
  console.log('✅ Game board found');
  
  // Check for tiles
  const tiles = await page.$$('.aspect-square');
  console.log(`📦 Found ${tiles.length} tiles`);
  
  if (tiles.length > 0) {
    // Get tile info
    const firstTileInfo = await tiles[0].evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height,
        backgroundColor: styles.backgroundColor,
        display: styles.display,
        position: styles.position,
        className: el.className
      };
    });
    
    console.log('\n🎨 First tile info:', firstTileInfo);
    
    // Check parent grid
    const gridInfo = await gameBoard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        width: styles.width,
        height: styles.height,
        gap: styles.gap
      };
    });
    
    console.log('\n📐 Grid info:', gridInfo);
  }
  
  // Get grid HTML
  const gridHTML = await gameBoard.innerHTML();
  console.log('\n📄 Grid HTML length:', gridHTML.length);
  console.log('First 500 chars:', gridHTML.substring(0, 500));
  
  // Check console errors
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push(msg.text()));
  
  await page.screenshot({ path: 'debug-game-board.png' });
  console.log('\n📸 Screenshot saved as debug-game-board.png');
  
  await browser.close();
}

debugTiles().catch(console.error);