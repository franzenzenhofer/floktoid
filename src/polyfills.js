// iOS Polyfills for better compatibility

// Add globalThis polyfill for older iOS versions
if (typeof globalThis === 'undefined') {
  window.globalThis = window;
}

// Ensure requestAnimationFrame exists
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = function(callback) {
    return window.setTimeout(callback, 1000 / 60);
  };
}

// Ensure cancelAnimationFrame exists
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

// Add performance.now polyfill
if (!window.performance || !window.performance.now) {
  window.performance = window.performance || {};
  window.performance.now = function() {
    return Date.now();
  };
}

// iOS Safari WebGL context fix
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(type, options) {
  // iOS Safari may fail with certain WebGL options
  if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
    try {
      const context = originalGetContext.call(this, type, options);
      if (!context && type === 'webgl2') {
        // Fallback to WebGL 1 if WebGL 2 fails
        console.warn('[iOS] WebGL2 not available, falling back to WebGL1');
        return originalGetContext.call(this, 'webgl', options) || 
               originalGetContext.call(this, 'experimental-webgl', options);
      }
      return context;
    } catch (e) {
      console.error('[iOS] WebGL context creation failed:', e);
      // Try with minimal options
      return originalGetContext.call(this, 'webgl', {}) || 
             originalGetContext.call(this, 'experimental-webgl', {});
    }
  }
  return originalGetContext.call(this, type, options);
};

console.log('[POLYFILLS] iOS compatibility polyfills loaded');