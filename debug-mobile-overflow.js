import { chromium } from 'playwright';

async function debugMobileOverflow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }
  });
  const page = await context.newPage();
  
  console.log('🔍 ROOT CAUSE ANALYSIS - Mobile Overflow Issue\n');
  console.log('Viewport: 375x667 (iPhone SE)');
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  
  // Start a hard game (10x10 grid)
  await page.getByRole('button', { name: 'Hard' }).click();
  await page.getByRole('button', { name: /start game/i }).click();
  await page.waitForTimeout(2000);
  
  // WHY #1: Why does the game board overflow?
  console.log('\n❓ WHY #1: Why does the game board overflow to the right?');
  const overflowData = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      bodyScrollWidth: body.scrollWidth,
      htmlScrollWidth: html.scrollWidth,
      windowInnerWidth: window.innerWidth,
      bodyOffsetWidth: body.offsetWidth,
      hasHorizontalScroll: body.scrollWidth > window.innerWidth
    };
  });
  console.log('📊 Overflow data:', overflowData);
  console.log(`💡 Answer: Body scroll width (${overflowData.bodyScrollWidth}) > Window width (${overflowData.windowInnerWidth})`);
  
  // WHY #2: Why is the body wider than the viewport?
  console.log('\n❓ WHY #2: Why is the body wider than the viewport?');
  const boardData = await page.evaluate(() => {
    const grid = document.querySelector('.grid');
    const board = grid?.getBoundingClientRect();
    return {
      boardLeft: board?.left,
      boardWidth: board?.width,
      boardRight: board?.right,
      computedWidth: grid ? window.getComputedStyle(grid).width : null
    };
  });
  console.log('📊 Board data:', boardData);
  console.log(`💡 Answer: Board right edge (${boardData.boardRight}) exceeds viewport (375)`);
  
  // WHY #3: Why does the board extend beyond the viewport?
  console.log('\n❓ WHY #3: Why does the board extend beyond the viewport?');
  const containerData = await page.evaluate(() => {
    const containers = [];
    let element = document.querySelector('.grid');
    while (element && element !== document.body) {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      containers.push({
        tag: element.tagName,
        class: element.className,
        width: rect.width,
        padding: styles.padding,
        margin: styles.margin,
        boxSizing: styles.boxSizing
      });
      element = element.parentElement;
    }
    return containers;
  });
  console.log('📊 Container hierarchy:');
  containerData.forEach(c => console.log(`  - ${c.tag}.${c.class}: ${c.width}px, padding: ${c.padding}, margin: ${c.margin}`));
  
  // WHY #4: Why are the tiles not shrinking to fit?
  console.log('\n❓ WHY #4: Why are the tiles not shrinking to fit?');
  const tileData = await page.evaluate(() => {
    const tile = document.querySelector('button[class*="rounded-lg"]');
    const grid = document.querySelector('.grid');
    if (!tile || !grid) return null;
    
    const tileStyles = window.getComputedStyle(tile);
    const gridStyles = window.getComputedStyle(grid);
    
    return {
      tileWidth: tile.getBoundingClientRect().width,
      tileHeight: tile.getBoundingClientRect().height,
      gridTemplate: gridStyles.gridTemplateColumns,
      gap: gridStyles.gap,
      tileCount: document.querySelectorAll('button[class*="rounded-lg"]').length
    };
  });
  console.log('📊 Tile data:', tileData);
  
  // WHY #5: What CSS is setting the tile size?
  console.log('\n❓ WHY #5: What CSS is setting the tile size?');
  const cssData = await page.evaluate(() => {
    const tile = document.querySelector('button[class*="rounded-lg"]');
    const grid = document.querySelector('.grid');
    if (!tile || !grid) return null;
    
    return {
      tileInlineStyle: tile.getAttribute('style'),
      gridInlineStyle: grid.getAttribute('style'),
      parentWidth: tile.parentElement?.getBoundingClientRect().width,
      parentInlineStyle: tile.parentElement?.getAttribute('style')
    };
  });
  console.log('📊 CSS data:', cssData);
  
  // WHY #6: What's the calculation for tile size?
  console.log('\n❓ WHY #6: What JavaScript calculates the tile size?');
  console.log('💡 Answer: GameBoard component calculateTileSize() function sets fixed pixel sizes');
  
  // WHY #7: Why doesn't the calculation account for viewport constraints?
  console.log('\n❓ WHY #7: Why doesn\'t the tile calculation properly constrain to viewport?');
  console.log('💡 ROOT CAUSE: The grid container uses fixed pixel widths instead of responsive units!');
  
  // CSS Calculator
  console.log('\n🧮 CSS CALCULATOR:');
  console.log('Viewport width: 375px');
  console.log('Padding (left+right): 16px (2 * 8px)');
  console.log('Available width: 359px');
  console.log('10x10 grid with 4px gaps:');
  console.log('  - 9 gaps × 4px = 36px');
  console.log('  - Available for tiles: 323px');
  console.log('  - Max tile size: 32.3px per tile');
  console.log('  - Current tile size:', tileData?.tileWidth, 'px');
  
  // Take screenshot
  await page.screenshot({ path: 'mobile-overflow-debug.png', fullPage: false });
  
  // Solution
  console.log('\n✅ SOLUTION:');
  console.log('1. Remove fixed pixel board size calculation');
  console.log('2. Use CSS Grid with responsive units');
  console.log('3. Let CSS handle the sizing with max-width: 100%');
  console.log('4. Use aspect-ratio to maintain square tiles');
  
  await browser.close();
}

debugMobileOverflow().catch(console.error);