import puppeteer from 'puppeteer';

console.log('🧪 TESTING BOSS SHIELD COLLISION, SPLITTING & PUSH AWAY');
console.log('='.repeat(60));

const browser = await puppeteer.launch({ 
  headless: false,
  defaultViewport: { width: 1280, height: 720 }
});

const page = await browser.newPage();

// Capture console logs
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('COLLISION') || text.includes('Shield') || text.includes('Boss') || text.includes('ASTEROIDS')) {
    console.log('[GAME LOG]', text);
  }
});

console.log('Loading game...');
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 2000));

// Take screenshot of start screen
await page.screenshot({ path: '/tmp/start_screen.png' });
console.log('📸 Start screen: /tmp/start_screen.png');

// Start game
const buttonExists = await page.evaluate(() => !!document.querySelector('button'));
console.log('Start button exists:', buttonExists);

if (buttonExists) {
  await page.click('button');
  console.log('Clicked start button');
} else {
  console.log('ERROR: No start button found!');
  process.exit(1);
}
await new Promise(r => setTimeout(r, 2000));

// Enable autopilot and debug mode
await page.evaluate(() => {
  const engine = window.gameEngine;
  if (engine) {
    engine.autopilotEnabled = true;
    if (engine.collisionManager) {
      engine.collisionManager.debug = true;
    }
    console.log('Autopilot enabled, debug mode ON');
  }
});

// Wait for boss wave
let bossFound = false;
for (let i = 0; i < 60; i++) {  // More iterations
  await new Promise(r => setTimeout(r, 1500));  // Shorter wait
  
  const state = await page.evaluate(() => {
    const engine = window.gameEngine;
    if (!engine) return null;
    
    const boss = engine.boids.find(b => b.isBoss);
    return {
      wave: engine.wave,
      hasBoss: !!boss,
      bossHealth: boss?.health,
      bossShieldRadius: boss?.getShieldRadius?.(),
      asteroids: engine.asteroids.length,
      boids: engine.boids.length
    };
  });
  
  if (state) {
    console.log(`Wave ${state.wave}: ${state.boids} birds, ${state.asteroids} asteroids`);
    
    if (state.hasBoss) {
      console.log(`\n🎯 BOSS FOUND!`);
      console.log(`  Health: ${state.bossHealth}`);
      console.log(`  Shield Radius: ${state.bossShieldRadius}px`);
      console.log(`  Asteroids: ${state.asteroids}`);
      
      // Take before screenshot
      await page.screenshot({ path: '/tmp/boss_before_collision.png' });
      console.log('📸 Screenshot: /tmp/boss_before_collision.png');
      
      // Wait for collisions
      console.log('\n⏳ Waiting for shield collisions...');
      await new Promise(r => setTimeout(r, 5000));
      
      // Check after collision
      const afterState = await page.evaluate(() => {
        const engine = window.gameEngine;
        const boss = engine?.boids.find(b => b.isBoss);
        return {
          bossHealth: boss?.health,
          bossAlive: boss?.alive,
          asteroids: engine?.asteroids.length
        };
      });
      
      console.log('\n📊 AFTER COLLISIONS:');
      console.log(`  Boss Health: ${afterState.bossHealth}`);
      console.log(`  Boss Alive: ${afterState.bossAlive}`);
      console.log(`  Asteroids: ${afterState.asteroids} (should increase if splitting worked)`);
      
      // Take after screenshot
      await page.screenshot({ path: '/tmp/boss_after_collision.png' });
      console.log('📸 Screenshot: /tmp/boss_after_collision.png');
      
      bossFound = true;
      break;
    }
  }
}

if (!bossFound) {
  console.log('❌ Boss never spawned!');
}

await browser.close();
console.log('\n✅ Test complete');