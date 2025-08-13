import { chromium } from 'playwright';
import fs from 'fs';

const SITE_URL = 'https://color-me-same.franzai.com';
const SCREENSHOT_DIR = './screenshots-analysis';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const analysisReport = [];
  
  // Test key viewport sizes
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },    // iPhone SE
    { name: 'tablet', width: 768, height: 1024 },   // iPad
    { name: 'desktop', width: 1366, height: 768 }   // Laptop
  ];

  for (const viewport of viewports) {
    console.log(`\n📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    
    try {
      // 1. START SCREEN
      console.log('  📸 Start screen...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${viewport.name}-01-start.png`,
        fullPage: false
      });
      
      // Check if start button is visible
      const startBtn = await page.$('button:has-text("Start Game")');
      if (!startBtn) {
        analysisReport.push({
          viewport: viewport.name,
          view: 'start',
          issue: 'Start button not found!'
        });
      } else {
        const box = await startBtn.boundingBox();
        if (box && box.y + box.height > viewport.height) {
          analysisReport.push({
            viewport: viewport.name,
            view: 'start',
            issue: `Start button cut off - bottom at ${box.y + box.height}px, viewport ${viewport.height}px`
          });
        }
      }
      
      // 2. GAME SCREEN
      console.log('  📸 Game screen...');
      // Select easy and start
      const easyBtn = await page.$('button:has-text("easy")');
      if (easyBtn) await easyBtn.click();
      await page.waitForTimeout(500);
      
      const startGame = await page.$('button:has-text("Start Game")');
      if (startGame) await startGame.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: `${SCREENSHOT_DIR}/${viewport.name}-02-game.png`,
        fullPage: false
      });
      
      // Check if game board is visible
      const gameBoard = await page.$('.grid');
      if (!gameBoard) {
        analysisReport.push({
          viewport: viewport.name,
          view: 'game',
          issue: 'Game board not found!'
        });
      } else {
        const box = await gameBoard.boundingBox();
        if (box && box.y + box.height > viewport.height) {
          analysisReport.push({
            viewport: viewport.name,
            view: 'game',
            issue: `Game board cut off - bottom at ${box.y + box.height}px, viewport ${viewport.height}px`
          });
        }
      }
      
      // 3. TUTORIAL MODAL
      console.log('  📸 Tutorial modal...');
      await page.goto(SITE_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      
      // Click tutorial if available
      const tutorial = await page.$('button:has-text("How to Play"), button:has-text("Tutorial")');
      if (tutorial) {
        await tutorial.click();
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `${SCREENSHOT_DIR}/${viewport.name}-03-tutorial.png`,
          fullPage: false
        });
        
        // Check modal visibility
        const modal = await page.$('.modal-content');
        if (modal) {
          const box = await modal.boundingBox();
          if (box && box.y + box.height > viewport.height) {
            analysisReport.push({
              viewport: viewport.name,
              view: 'tutorial',
              issue: `Modal cut off - bottom at ${box.y + box.height}px, viewport ${viewport.height}px`
            });
          }
        }
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      analysisReport.push({
        viewport: viewport.name,
        view: 'error',
        issue: error.message
      });
    }
    
    await context.close();
  }
  
  await browser.close();
  return analysisReport;
}

// Generate reports
async function generateReports(issues) {
  // Create markdown report
  let markdown = '# Color Me Same - UI Analysis\n\n';
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  const viewports = ['mobile', 'tablet', 'desktop'];
  
  for (const vp of viewports) {
    markdown += `## ${vp.toUpperCase()}\n\n`;
    
    const vpIssues = issues.filter(i => i.viewport === vp);
    if (vpIssues.length === 0) {
      markdown += '✅ No issues found!\n\n';
    } else {
      vpIssues.forEach(issue => {
        markdown += `### ${issue.view}\n`;
        markdown += `❌ ${issue.issue}\n\n`;
      });
    }
    
    // Add screenshots
    markdown += '### Screenshots\n';
    markdown += `![Start](${SCREENSHOT_DIR}/${vp}-01-start.png)\n`;
    markdown += `![Game](${SCREENSHOT_DIR}/${vp}-02-game.png)\n`;
    markdown += `![Tutorial](${SCREENSHOT_DIR}/${vp}-03-tutorial.png)\n\n`;
  }
  
  // Create bugs.txt
  let bugs = 'COLOR ME SAME - UI BUGS\n';
  bugs += '=======================\n\n';
  
  if (issues.length === 0) {
    bugs += 'NO BUGS FOUND!\n';
  } else {
    issues.forEach(issue => {
      bugs += `${issue.viewport.toUpperCase()} - ${issue.view.toUpperCase()}\n`;
      bugs += `• ${issue.issue}\n\n`;
    });
  }
  
  fs.writeFileSync('UI-ANALYSIS-REPORT.md', markdown);
  fs.writeFileSync('bugs.txt', bugs);
  
  console.log('\n📄 Reports generated!');
  console.log(`Found ${issues.length} issues`);
}

// Run analysis
console.log('🚀 Starting UI analysis...');

captureScreenshots()
  .then(generateReports)
  .then(() => {
    console.log('✅ Complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });