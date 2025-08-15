/**
 * AnimationUtils - DRY animation utilities
 * Consolidates common animation patterns and easing functions
 */


/**
 * Common easing functions
 */
export const Easing = {
  linear: (t: number) => t,
  
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInExpo: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  
  elasticOut: (t: number) => {
    const p = 0.3;
    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
  },
  
  bounceOut: (t: number) => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  }
};

/**
 * Pulse animation calculator
 * @param time - Current time in milliseconds
 * @param frequency - Pulse frequency (cycles per second)
 * @param minScale - Minimum scale value
 * @param maxScale - Maximum scale value
 * @param phase - Phase offset (0-2π)
 * @returns Current pulse scale
 */
export function calculatePulse(
  time: number,
  frequency: number = 5,
  minScale: number = 0.8,
  maxScale: number = 1.2,
  phase: number = 0
): number {
  const sine = Math.sin((time / 1000) * frequency + phase);
  const amplitude = (maxScale - minScale) / 2;
  const center = (minScale + maxScale) / 2;
  return center + sine * amplitude;
}

/**
 * Shimmer/color animation calculator
 * @param time - Current time in milliseconds
 * @param baseHue - Base hue value (0-360)
 * @param range - Hue variation range
 * @param speed - Animation speed multiplier
 * @returns Current hue value
 */
export function calculateShimmer(
  time: number,
  baseHue: number,
  range: number = 30,
  speed: number = 10
): number {
  const phase = Math.sin(time * speed / 1000) * 0.5 + 0.5;
  return baseHue + range * phase;
}

/**
 * Animated value with easing
 */
export class AnimatedValue {
  private startValue: number;
  private endValue: number;
  private currentValue: number;
  private duration: number;
  private startTime: number;
  private easingFn: (t: number) => number;
  private isAnimating: boolean = false;
  private onComplete?: () => void;
  
  constructor(initialValue: number = 0) {
    this.startValue = initialValue;
    this.endValue = initialValue;
    this.currentValue = initialValue;
    this.duration = 0;
    this.startTime = 0;
    this.easingFn = Easing.linear;
  }
  
  /**
   * Animate to a new value
   * @param target - Target value
   * @param duration - Animation duration in ms
   * @param easing - Easing function
   * @param onComplete - Completion callback
   */
  animateTo(
    target: number,
    duration: number = 300,
    easing: (t: number) => number = Easing.easeOutQuad,
    onComplete?: () => void
  ): void {
    this.startValue = this.currentValue;
    this.endValue = target;
    this.duration = duration;
    this.startTime = performance.now();
    this.easingFn = easing;
    this.isAnimating = true;
    this.onComplete = onComplete;
  }
  
  /**
   * Update animation and get current value
   * @param currentTime - Current time in ms
   * @returns Current interpolated value
   */
  update(currentTime: number = performance.now()): number {
    if (!this.isAnimating) {
      return this.currentValue;
    }
    
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const easedProgress = this.easingFn(progress);
    
    this.currentValue = this.startValue + (this.endValue - this.startValue) * easedProgress;
    
    if (progress >= 1) {
      this.isAnimating = false;
      this.currentValue = this.endValue;
      this.onComplete?.();
    }
    
    return this.currentValue;
  }
  
  /**
   * Set value immediately without animation
   * @param value - New value
   */
  setValue(value: number): void {
    this.currentValue = value;
    this.startValue = value;
    this.endValue = value;
    this.isAnimating = false;
  }
  
  /**
   * Get current value without updating
   */
  get value(): number {
    return this.currentValue;
  }
  
  /**
   * Check if currently animating
   */
  get animating(): boolean {
    return this.isAnimating;
  }
}

/**
 * Fade in/out animation helper
 * @param target - Object with alpha property
 * @param fadeIn - Whether to fade in (true) or out (false)
 * @param duration - Fade duration in ms
 * @param onComplete - Completion callback
 */
export function fade(
  target: { alpha: number },
  fadeIn: boolean,
  duration: number = 300,
  onComplete?: () => void
): AnimatedValue {
  const animator = new AnimatedValue(target.alpha);
  const targetAlpha = fadeIn ? 1 : 0;
  
  animator.animateTo(targetAlpha, duration, Easing.easeOutQuad, onComplete);
  
  // Update target alpha in animation loop
  const updateFn = () => {
    target.alpha = animator.update();
    if (animator.animating) {
      requestAnimationFrame(updateFn);
    }
  };
  updateFn();
  
  return animator;
}

interface ScalableObject {
  scale?: number;
  scaleX?: number;
  scaleY?: number;
}

/**
 * Scale animation helper
 * @param target - Object with scale property or scaleX/scaleY
 * @param from - Starting scale
 * @param to - Target scale
 * @param duration - Animation duration in ms
 * @param easing - Easing function
 */
export function animateScale(
  target: ScalableObject,
  from: number,
  to: number,
  duration: number = 500,
  easing: (t: number) => number = Easing.elasticOut
): AnimatedValue {
  const animator = new AnimatedValue(from);
  
  // Set initial scale
  if ('scale' in target) {
    target.scale = from;
  } else if ('scaleX' in target) {
    target.scaleX = from;
    target.scaleY = from;
  }
  
  animator.animateTo(to, duration, easing);
  
  // Update target scale in animation loop
  const updateFn = () => {
    const scale = animator.update();
    if ('scale' in target) {
      target.scale = scale;
    } else if ('scaleX' in target) {
      target.scaleX = scale;
      target.scaleY = scale;
    }
    
    if (animator.animating) {
      requestAnimationFrame(updateFn);
    }
  };
  updateFn();
  
  return animator;
}

/**
 * Rotation animation helper
 * @param target - Object with rotation property
 * @param speed - Rotation speed in radians per second
 * @param deltaTime - Delta time in seconds
 */
export function rotate(target: { rotation: number }, speed: number, deltaTime: number): void {
  target.rotation += speed * deltaTime;
}

/**
 * Oscillation animation (for floating effects)
 * @param time - Current time in ms
 * @param amplitude - Oscillation amplitude
 * @param frequency - Oscillation frequency
 * @param phase - Phase offset
 * @returns Oscillation offset
 */
export function oscillate(
  time: number,
  amplitude: number = 10,
  frequency: number = 1,
  phase: number = 0
): number {
  return amplitude * Math.sin((time / 1000) * frequency * Math.PI * 2 + phase);
}