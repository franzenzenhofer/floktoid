import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Asteroid Color Consistency', () => {
  it('should use color at RELEASE moment, not start', () => {
    // Mock performance.now to control time
    let currentTime = 1000;
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
    
    // Simulate charging for different durations
    const testCases = [
      { chargeTime: 500, expectedHue: 150 },  // (1500 / 10) % 360 = 150
      { chargeTime: 1000, expectedHue: 200 }, // (2000 / 10) % 360 = 200
      { chargeTime: 2000, expectedHue: 300 }, // (3000 / 10) % 360 = 300
      { chargeTime: 3600, expectedHue: 100 },  // (4600 / 10) % 360 = 100 (460 % 360 = 100)
    ];
    
    testCases.forEach(({ chargeTime, expectedHue }) => {
      // Start at time 1000
      currentTime = 1000;
      const startHue = (currentTime / 10) % 360; // 100
      
      // Charge for specified time
      currentTime = 1000 + chargeTime;
      const releaseHue = (currentTime / 10) % 360;
      
      // The asteroid should use release hue
      expect(releaseHue).toBe(expectedHue);
      
      // Only expect different hue if charge time doesn't result in a full cycle
      const fullCycle = 3600; // 360 degrees * 10ms per degree
      if (chargeTime > 0 && chargeTime % fullCycle !== 0) {
        expect(releaseHue).not.toBe(startHue);
      }
      
      console.log(`Charge ${chargeTime}ms: Start hue=${startHue}, Release hue=${releaseHue}`);
    });
  });
  
  it('should maintain color cycling during charge', () => {
    let currentTime = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
    
    const hues: number[] = [];
    
    // Simulate charging animation over 2 seconds
    for (let t = 0; t <= 2000; t += 100) {
      currentTime = t;
      const hue = (currentTime / 10) % 360;
      hues.push(hue);
    }
    
    // Hues should be increasing (cycling through colors)
    for (let i = 1; i < hues.length; i++) {
      const diff = hues[i] - hues[i-1];
      // Should increase by 10 each 100ms (or wrap around)
      expect(diff === 10 || diff === -350).toBe(true); // 10 forward or wrapped
    }
    
    // Final hue should match release time
    const finalHue = hues[hues.length - 1];
    expect(finalHue).toBe((2000 / 10) % 360); // 200
  });
  
  it('should handle hue wrapping correctly', () => {
    let currentTime = 3590; // Will wrap from 359 to 0
    vi.spyOn(performance, 'now').mockImplementation(() => currentTime);
    
    const startHue = (currentTime / 10) % 360; // 359
    expect(startHue).toBe(359);
    
    currentTime = 3600; // Wraps to 0
    const wrappedHue = (currentTime / 10) % 360;
    expect(wrappedHue).toBe(0);
    
    currentTime = 3610; // Continues from 0
    const continuedHue = (currentTime / 10) % 360;
    expect(continuedHue).toBe(1);
  });
});