import puppeteer from 'puppeteer';

console.log('🎯 DIRECT BOSS SHIELD TEST - WAVE 5');
console.log('='.repeat(60));

const browser = await puppeteer.launch({ 
  headless: false,
  defaultViewport: { width: 1280, height: 720 }
});

const page = await browser.newPage();

// Capture important logs
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('Shield') || text.includes('Boss') || text.includes('COLLISION')) {
    console.log('[LOG]', text);
  }
});

await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 1000));

// Click start button
await page.click('button');
console.log('Game started');
await new Promise(r => setTimeout(r, 3000)); // Wait for game to initialize

// Enable autopilot and directly jump to wave 5
await page.evaluate(() => {
  const engine = window.gameEngine;
  if (engine) {
    engine.autopilotEnabled = true;
    
    // Debug mode for collision
    if (engine.collisionManager) {
      engine.collisionManager.debug = true;
    }
    
    // Force jump to wave 4 (so next completion goes to 5)
    engine.wave = 4;
    engine.score = 1000;
    
    // Clear all birds to trigger wave completion
    engine.boids.forEach(b => b.destroy());
    engine.boids = [];
    
    console.log('Forced to wave 4, clearing birds to trigger wave 5...');
  }
});

// Wait for wave 5 to start
await new Promise(r => setTimeout(r, 3000));

// Check if boss spawned
const bossCheck = await page.evaluate(() => {
  const engine = window.gameEngine;
  const boss = engine?.boids.find(b => b.isBoss);
  return {
    wave: engine?.wave,
    hasBoss: !!boss,
    bossHealth: boss?.health,
    shieldRadius: boss?.getShieldRadius?.(),
    boids: engine?.boids.length,
    asteroids: engine?.asteroids.length
  };
});

console.log('\n📊 WAVE 5 STATUS:');
console.log(`  Wave: ${bossCheck.wave}`);
console.log(`  Has Boss: ${bossCheck.hasBoss}`);
console.log(`  Boss Health: ${bossCheck.bossHealth}`);
console.log(`  Shield Radius: ${bossCheck.shieldRadius}px`);
console.log(`  Total Birds: ${bossCheck.boids}`);
console.log(`  Asteroids: ${bossCheck.asteroids}`);

if (bossCheck.hasBoss) {
  // Screenshot before
  await page.screenshot({ path: '/tmp/boss_shield_before.png' });
  console.log('\n📸 Before: /tmp/boss_shield_before.png');
  
  // Force an asteroid collision with the boss
  await page.evaluate(() => {
    const engine = window.gameEngine;
    const boss = engine?.boids.find(b => b.isBoss);
    
    if (boss && engine.asteroids.length > 0) {
      // Move an asteroid to collide with boss shield
      const ast = engine.asteroids[0];
      ast.x = boss.x + 30; // Within shield radius
      ast.y = boss.y;
      console.log(`Forced asteroid to boss position for collision test`);
    }
  });
  
  // Wait for collision to process
  await new Promise(r => setTimeout(r, 1000));
  
  // Check results
  const afterCheck = await page.evaluate(() => {
    const engine = window.gameEngine;
    const boss = engine?.boids.find(b => b.isBoss);
    return {
      bossHealth: boss?.health,
      bossAlive: boss?.alive,
      asteroids: engine?.asteroids.length
    };
  });
  
  console.log('\n📊 AFTER COLLISION:');
  console.log(`  Boss Health: ${afterCheck.bossHealth} (was ${bossCheck.bossHealth})`);
  console.log(`  Asteroids: ${afterCheck.asteroids} (was ${bossCheck.asteroids})`);
  
  if (afterCheck.asteroids > bossCheck.asteroids) {
    console.log('  ✅ Asteroid split into fragments!');
  } else {
    console.log('  ❌ Asteroid did not split!');
  }
  
  if (afterCheck.bossHealth < bossCheck.bossHealth) {
    console.log('  ✅ Boss took damage from shield hit!');
  } else {
    console.log('  ❌ Boss did not take damage!');
  }
  
  // Screenshot after
  await page.screenshot({ path: '/tmp/boss_shield_after.png' });
  console.log('\n📸 After: /tmp/boss_shield_after.png');
  
} else {
  console.log('\n❌ NO BOSS SPAWNED AT WAVE 5!');
  
  // Debug what's happening
  const debug = await page.evaluate(() => {
    const engine = window.gameEngine;
    return {
      wave: engine?.wave,
      boids: engine?.boids.map(b => ({ 
        isBoss: b.isBoss, 
        isShooter: b.isShooter,
        isNavigator: b.isNavigator 
      }))
    };
  });
  console.log('Debug info:', JSON.stringify(debug, null, 2));
}

await browser.close();
console.log('\n✅ Test complete');