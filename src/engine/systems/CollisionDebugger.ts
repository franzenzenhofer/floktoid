/**
 * CollisionDebugger - Real-time collision analysis and logging
 */

export class CollisionDebugger {
  private performanceMarks: Map<string, number> = new Map();
  private slowFrames: Array<{ frame: number; time: number; reason: string }> = [];
  private currentFrame = 0;
  private enabled = true;
  
  startFrame() {
    this.currentFrame++;
    this.mark('frame_start');
  }
  
  mark(label: string) {
    if (!this.enabled) return;
    this.performanceMarks.set(label, performance.now());
  }
  
  measure(startLabel: string, endLabel: string): number {
    if (!this.enabled) return 0;
    
    const start = this.performanceMarks.get(startLabel);
    const end = this.performanceMarks.get(endLabel);
    
    if (start && end) {
      const duration = end - start;
      
      // Log if slow (>5ms)
      if (duration > 5) {
        console.warn(`[Frame ${this.currentFrame}] Slow operation: ${startLabel} -> ${endLabel}: ${duration.toFixed(2)}ms`);
        
        // CRITICAL FIX: Prevent unbounded memory growth in slowFrames array
        const MAX_SLOW_FRAMES = 100;
        if (this.slowFrames.length >= MAX_SLOW_FRAMES) {
          this.slowFrames.shift(); // Remove oldest entry
        }
        
        this.slowFrames.push({
          frame: this.currentFrame,
          time: duration,
          reason: `${startLabel} -> ${endLabel}`
        });
      }
      
      return duration;
    }
    
    return 0;
  }
  
  logCollisionCheck(type: string, count1: number, count2: number) {
    if (!this.enabled) return;
    const totalChecks = count1 * count2;
    console.log(`[Frame ${this.currentFrame}] ${type}: ${count1} x ${count2} = ${totalChecks} checks`);
  }
  
  logNearMiss(_entity1: unknown, _entity2: unknown, distance: number, threshold: number) {
    if (!this.enabled) return;
    console.log(`[Frame ${this.currentFrame}] Near miss: dist=${distance.toFixed(1)}, threshold=${threshold.toFixed(1)}, ratio=${(distance/threshold).toFixed(2)}`);
  }
  
  endFrame() {
    const frameTime = this.measure('frame_start', 'frame_end');
    
    // Alert if frame took too long (>16ms = 60fps threshold)
    if (frameTime > 16) {
      console.error(`[Frame ${this.currentFrame}] SLOW FRAME: ${frameTime.toFixed(2)}ms`);
      
      // Dump all marks for this frame
      console.log('Frame timeline:');
      const marks = Array.from(this.performanceMarks.entries()).sort((a, b) => a[1] - b[1]);
      const frameStart = marks[0]?.[1] || 0;
      
      marks.forEach(([label, time]) => {
        console.log(`  ${((time - frameStart)).toFixed(2)}ms: ${label}`);
      });
    }
    
    // Clear marks for next frame
    this.performanceMarks.clear();
  }
  
  getReport() {
    return {
      currentFrame: this.currentFrame,
      slowFrames: this.slowFrames,
      avgSlowFrameTime: this.slowFrames.reduce((acc, f) => acc + f.time, 0) / (this.slowFrames.length || 1)
    };
  }
  
  reset() {
    this.performanceMarks.clear();
    this.slowFrames = [];
    this.currentFrame = 0;
  }
}