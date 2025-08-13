import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://color-me-same.franzai.com'; // Use live site
const SCREENSHOT_DIR = './screenshots-analysis';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureAllViews() {
  const browser = await chromium.launch({ headless: false });
  const analysisReport = [];
  
  // Test multiple viewport sizes
  const viewports = [
    { name: 'mobile-small', width: 375, height: 667 },  // iPhone SE
    { name: 'mobile-large', width: 414, height: 896 },  // iPhone XR
    { name: 'tablet', width: 768, height: 1024 },       // iPad
    { name: 'desktop', width: 1366, height: 768 },      // Common laptop
    { name: 'desktop-large', width: 1920, height: 1080 } // Full HD
  ];

  for (const viewport of viewports) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    
    try {
      // 1. START SCREEN
      console.log('  📸 Capturing start screen...');
      await page.goto(SITE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const startScreenshot = await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${viewport.name}-01-start-screen.png`,
        fullPage: true
      });
      
      // Check if everything is visible
      const startScreenAnalysis = await analyzeVisibility(page, 'start-screen', viewport);
      analysisReport.push(startScreenAnalysis);
      
      // 2. TUTORIAL MODAL
      console.log('  📸 Opening tutorial modal...');
      const tutorialButton = await page.$('button:has-text("Tutorial")');
      if (tutorialButton) {
        await tutorialButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${viewport.name}-02-tutorial-modal.png`,
          fullPage: true
        });
        const tutorialAnalysis = await analyzeVisibility(page, 'tutorial-modal', viewport);
        analysisReport.push(tutorialAnalysis);
        
        // Close tutorial
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      
      // 3. GAME SCREEN - Start with Easy
      console.log('  📸 Starting game (Easy)...');
      await page.click('button:has-text("easy")');
      await page.click('button:has-text("Start Game")');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${viewport.name}-03-game-easy.png`,
        fullPage: true
      });
      const gameAnalysis = await analyzeVisibility(page, 'game-screen-easy', viewport);
      analysisReport.push(gameAnalysis);
      
      // 4. PAUSE MODAL
      console.log('  📸 Opening pause modal...');
      const pauseButton = await page.$('button:has-text("Pause")');
      if (pauseButton) {
        await pauseButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${viewport.name}-04-pause-modal.png`,
          fullPage: true
        });
        const pauseAnalysis = await analyzeVisibility(page, 'pause-modal', viewport);
        analysisReport.push(pauseAnalysis);
        
        // Resume
        await page.click('button:has-text("Resume")');
        await page.waitForTimeout(300);
      }
      
      // 5. INFO PANEL
      console.log('  📸 Opening info panel...');
      const infoButton = await page.$('button:has-text("Info")');
      if (infoButton) {
        await infoButton.click();
        await page.waitForTimeout(500);
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${viewport.name}-05-info-panel.png`,
          fullPage: true
        });
        const infoAnalysis = await analyzeVisibility(page, 'info-panel', viewport);
        analysisReport.push(infoAnalysis);
        
        // Close info
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
      
      // 6. VICTORY MODAL (simulate win)
      console.log('  📸 Simulating victory...');
      // Click tiles to win quickly
      for (let i = 0; i < 20; i++) {
        const tiles = await page.$$('.aspect-square.rounded-lg');
        if (tiles.length > 0) {
          await tiles[0].click();
          await page.waitForTimeout(100);
        }
      }
      
      // Force victory for screenshot
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('force-victory'));
      });
      await page.waitForTimeout(1000);
      
      const victoryModal = await page.$('.modal-backdrop');
      if (victoryModal) {
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${viewport.name}-06-victory-modal.png`,
          fullPage: true
        });
        const victoryAnalysis = await analyzeVisibility(page, 'victory-modal', viewport);
        analysisReport.push(victoryAnalysis);
      }
      
      // 7. ACHIEVEMENT MODAL
      console.log('  📸 Checking achievement modal...');
      // Reload and try to trigger achievement
      await page.goto(SITE_URL);
      await page.waitForLoadState('networkidle');
      
      // 8. Test Different Difficulty Levels
      const difficulties = ['medium', 'hard', 'extreme', 'impossible'];
      for (const diff of difficulties) {
        console.log(`  📸 Testing ${diff} difficulty...`);
        await page.goto(SITE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        
        const diffButton = await page.$(`button:has-text("${diff}")`);
        if (diffButton) {
          await diffButton.click();
          await page.click('button:has-text("Start Game")');
          await page.waitForTimeout(2000);
          
          await page.screenshot({ 
            path: `${SCREENSHOT_DIR}/${viewport.name}-game-${diff}.png`,
            fullPage: true
          });
          
          const diffAnalysis = await analyzeVisibility(page, `game-screen-${diff}`, viewport);
          analysisReport.push(diffAnalysis);
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error in ${viewport.name}:`, error.message);
      analysisReport.push({
        viewport: viewport.name,
        view: 'error',
        error: error.message
      });
    }
    
    await context.close();
  }
  
  await browser.close();
  return analysisReport;
}

async function analyzeVisibility(page, viewName, viewport) {
  const analysis = {
    viewport: viewport.name,
    view: viewName,
    issues: []
  };
  
  // Check if content is cut off
  const viewportHeight = viewport.height;
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
  
  if (scrollHeight > viewportHeight) {
    analysis.issues.push(`Content exceeds viewport: ${scrollHeight}px content vs ${viewportHeight}px viewport`);
  }
  
  // Check specific elements
  const elements = {
    '.btn-primary': 'Primary buttons',
    '.modal-content': 'Modal content',
    '.grid': 'Game grid',
    '.glass-effect': 'Glass panels',
    'button:has-text("Start Game")': 'Start button',
    '.aspect-square': 'Game tiles'
  };
  
  for (const [selector, name] of Object.entries(elements)) {
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box) {
        // Check if element is fully visible
        if (box.y + box.height > viewportHeight) {
          analysis.issues.push(`${name} is cut off at bottom (ends at ${box.y + box.height}px)`);
        }
        if (box.x + box.width > viewport.width) {
          analysis.issues.push(`${name} is cut off at right (ends at ${box.x + box.width}px)`);
        }
        if (box.y < 0) {
          analysis.issues.push(`${name} is cut off at top (starts at ${box.y}px)`);
        }
      }
    }
  }
  
  // Check if scrollbar is present
  const hasScrollbar = await page.evaluate(() => {
    return document.documentElement.scrollHeight > document.documentElement.clientHeight;
  });
  
  if (hasScrollbar) {
    analysis.issues.push('Page has scrollbar - content doesn\'t fit');
  }
  
  // Check overflow
  const overflowElements = await page.$$eval('*', elements => {
    return elements
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.overflow === 'hidden' && el.scrollHeight > el.clientHeight;
      })
      .map(el => ({
        tag: el.tagName,
        class: el.className,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      }));
  });
  
  if (overflowElements.length > 0) {
    overflowElements.forEach(el => {
      analysis.issues.push(`Hidden overflow on ${el.tag}.${el.class}: ${el.scrollHeight}px content in ${el.clientHeight}px container`);
    });
  }
  
  return analysis;
}

async function generateReport(analysisData) {
  if (!analysisData || analysisData.length === 0) {
    console.error('No analysis data collected!');
    return;
  }
  
  let markdown = '# Color Me Same - Complete UI Analysis Report\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Group by viewport
  const viewports = [...new Set(analysisData.map(a => a.viewport))];
  
  for (const viewport of viewports) {
    markdown += `## ${viewport.toUpperCase()}\n\n`;
    
    const viewportData = analysisData.filter(a => a.viewport === viewport);
    
    for (const analysis of viewportData) {
      markdown += `### ${analysis.view}\n`;
      
      if (!analysis.issues || analysis.issues.length === 0) {
        markdown += '✅ **No issues found** - Everything fits perfectly!\n\n';
      } else {
        markdown += '❌ **Issues found:**\n';
        analysis.issues.forEach(issue => {
          markdown += `- ${issue}\n`;
        });
        markdown += '\n';
      }
      
      // Add screenshot reference
      const screenshotName = `${viewport}-${analysis.view}.png`;
      markdown += `![${analysis.view}](${SCREENSHOT_DIR}/${screenshotName})\n\n`;
    }
  }
  
  // Generate bugs.txt
  let bugs = 'COLOR ME SAME - UI BUGS REPORT\n';
  bugs += '================================\n\n';
  
  analysisData.forEach(analysis => {
    if (analysis.issues && analysis.issues.length > 0) {
      bugs += `${analysis.viewport.toUpperCase()} - ${analysis.view.toUpperCase()}\n`;
      bugs += '-'.repeat(50) + '\n';
      analysis.issues.forEach(issue => {
        bugs += `• ${issue}\n`;
      });
      bugs += '\n';
    }
  });
  
  fs.writeFileSync('UI-ANALYSIS-REPORT.md', markdown);
  fs.writeFileSync('bugs.txt', bugs);
  
  console.log('\n📄 Reports generated:');
  console.log('  - UI-ANALYSIS-REPORT.md');
  console.log('  - bugs.txt');
  console.log(`  - ${SCREENSHOT_DIR}/ (screenshots)`);
}

// Run the analysis
console.log('🚀 Starting comprehensive UI analysis...\n');

captureAllViews()
  .then(generateReport)
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });