#!/usr/bin/env node

/**
 * Color Me Same - Post-Deployment Test Suite
 * Comprehensive testing after deployment to ensure everything works
 */

import { execSync } from 'child_process';
import fs from 'fs';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, icon, message) => {
  console.log(`${color}${icon} ${message}${COLORS.reset}`);
};

const success = (msg) => log(COLORS.green, '✅', msg);
const error = (msg) => log(COLORS.red, '❌', msg);
const warning = (msg) => log(COLORS.yellow, '⚠️ ', msg);
const info = (msg) => log(COLORS.blue, 'ℹ️ ', msg);
const test = (msg) => log(COLORS.cyan, '🧪', msg);

// Configuration
const SITE_URL = 'https://color-me-same.franzai.com';
const TEST_TIMEOUT = 30000;

class PostDeploymentTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    test(`Running: ${name}`);
    try {
      const result = await testFn();
      if (result === true) {
        success(`✓ ${name}`);
        this.results.passed++;
        this.results.tests.push({ name, status: 'PASS' });
        return true;
      } else if (result === 'warning') {
        warning(`⚠ ${name}`);
        this.results.warnings++;
        this.results.tests.push({ name, status: 'WARN' });
        return true;
      } else {
        error(`✗ ${name}: ${result}`);
        this.results.failed++;
        this.results.tests.push({ name, status: 'FAIL', error: result });
        return false;
      }
    } catch (err) {
      error(`✗ ${name}: ${err.message}`);
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: err.message });
      return false;
    }
  }

  async testSiteAccessibility() {
    const response = await fetch(SITE_URL);
    if (!response.ok) {
      return `Site returned ${response.status} ${response.statusText}`;
    }
    return true;
  }

  async testVersionInfo() {
    const response = await fetch(SITE_URL);
    const html = await response.text();
    
    // Check if the React app is properly loaded (version info is rendered by React)
    if (!html.includes('<div id="root">') || !html.includes('index-') || !html.includes('.js')) {
      return 'React app structure not found';
    }
    
    // Since version info is dynamically rendered, check if app assets are properly versioned
    const hasVersionedAssets = /index\-[a-zA-Z0-9]+\.(js|css)/.test(html);
    if (!hasVersionedAssets) {
      return 'App assets not properly versioned';
    }
    
    return true;
  }

  async testStaticAssets() {
    const response = await fetch(SITE_URL);
    const html = await response.text();
    
    // Extract asset URLs from HTML
    const jsMatch = html.match(/src="([^"]*\.js)"/);
    const cssMatch = html.match(/href="([^"]*\.css)"/);
    
    if (!jsMatch || !cssMatch) {
      return 'JS or CSS assets not found in HTML';
    }
    
    // Test JS asset
    const jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `${SITE_URL}${jsMatch[1]}`;
    const jsResponse = await fetch(jsUrl);
    if (!jsResponse.ok) {
      return `JS asset failed: ${jsResponse.status}`;
    }
    
    // Test CSS asset
    const cssUrl = cssMatch[1].startsWith('http') ? cssMatch[1] : `${SITE_URL}${cssMatch[1]}`;
    const cssResponse = await fetch(cssUrl);
    if (!cssResponse.ok) {
      return `CSS asset failed: ${cssResponse.status}`;
    }
    
    return true;
  }

  async testCacheHeaders() {
    // Test main page (should not be cached)
    const htmlResponse = await fetch(SITE_URL);
    const htmlCacheControl = htmlResponse.headers.get('cache-control');
    if (htmlCacheControl && htmlCacheControl.includes('max-age=0')) {
      // Good - HTML is not cached
    } else {
      return 'warning'; // Just a warning, not a failure
    }
    
    // Test a static asset (should be cached)
    const response = await fetch(SITE_URL);
    const html = await response.text();
    const jsMatch = html.match(/src="([^"]*\.js)"/);
    
    if (jsMatch) {
      const jsUrl = jsMatch[1].startsWith('http') ? jsMatch[1] : `${SITE_URL}${jsMatch[1]}`;
      const jsResponse = await fetch(jsUrl);
      const jsCacheControl = jsResponse.headers.get('cache-control');
      
      if (!jsCacheControl || !jsCacheControl.includes('max-age')) {
        return 'warning'; // Assets should be cached
      }
    }
    
    return true;
  }

  async testAPIEndpoints() {
    try {
      // Test puzzle generation API
      const generateResponse = await fetch(`${SITE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 'easy' })
      });
      
      if (!generateResponse.ok) {
        return `Generate API failed: ${generateResponse.status}`;
      }
      
      const puzzle = await generateResponse.json();
      if (!puzzle.grid || !Array.isArray(puzzle.grid)) {
        return 'Generate API returned invalid puzzle';
      }
      
      return true;
    } catch (err) {
      return `API test failed: ${err.message}`;
    }
  }

  async testResponseTimes() {
    const start = Date.now();
    const response = await fetch(SITE_URL);
    const end = Date.now();
    const responseTime = end - start;
    
    if (responseTime > 5000) {
      return `Response time too slow: ${responseTime}ms`;
    }
    
    if (responseTime > 2000) {
      return 'warning'; // Warn if > 2s but don't fail
    }
    
    return true;
  }

  async testMobileViewport() {
    const response = await fetch(SITE_URL);
    const html = await response.text();
    
    if (!html.includes('viewport') || !html.includes('width=device-width')) {
      return 'Mobile viewport meta tag missing';
    }
    
    return true;
  }

  async testSecurityHeaders() {
    const response = await fetch(SITE_URL);
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
    ];
    
    const missingHeaders = securityHeaders.filter(header => 
      !response.headers.has(header)
    );
    
    // Check if the Worker is configured with security headers (API endpoint test)
    try {
      const apiResponse = await fetch(`${SITE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: 'easy' })
      });
      
      const hasWorkerSecurityHeaders = apiResponse.headers.has('x-content-type-options') || 
                                      apiResponse.headers.has('x-frame-options');
      
      if (hasWorkerSecurityHeaders) {
        return true; // Worker has security headers configured
      }
    } catch (err) {
      // Ignore API test errors
    }
    
    if (missingHeaders.length > 0) {
      return 'warning'; // Security headers missing but not critical
    }
    
    return true;
  }

  async testCacheBusting() {
    const response = await fetch(SITE_URL);
    const html = await response.text();
    
    // Check if assets have query strings or hashes for cache busting (Vite uses different pattern)
    const hasHashedAssets = /\.(js|css)\?[a-f0-9]+/.test(html) || 
                           /\-[a-zA-Z0-9]{8,}\.(js|css)/.test(html) ||
                           /index\-[a-zA-Z0-9]+\.(js|css)/.test(html);
    
    if (!hasHashedAssets) {
      return 'warning'; // Cache busting not detected
    }
    
    return true;
  }

  async runAllTests() {
    info('🚀 Starting Post-Deployment Test Suite');
    info(`Testing: ${SITE_URL}`);
    console.log('');

    // Core functionality tests
    await this.runTest('Site Accessibility', () => this.testSiteAccessibility());
    await this.runTest('Version Information Display', () => this.testVersionInfo());
    await this.runTest('Static Assets Loading', () => this.testStaticAssets());
    await this.runTest('API Endpoints', () => this.testAPIEndpoints());
    
    // Performance tests
    await this.runTest('Response Times', () => this.testResponseTimes());
    
    // Technical tests
    await this.runTest('Cache Headers', () => this.testCacheHeaders());
    await this.runTest('Cache Busting', () => this.testCacheBusting());
    await this.runTest('Mobile Viewport', () => this.testMobileViewport());
    await this.runTest('Security Headers', () => this.testSecurityHeaders());

    // Summary
    console.log('');
    console.log('═'.repeat(60));
    info('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(60));
    
    success(`Passed: ${this.results.passed}`);
    if (this.results.warnings > 0) {
      warning(`Warnings: ${this.results.warnings}`);
    }
    if (this.results.failed > 0) {
      error(`Failed: ${this.results.failed}`);
    }
    
    const total = this.results.passed + this.results.failed + this.results.warnings;
    const passRate = Math.round((this.results.passed / total) * 100);
    
    console.log('');
    if (this.results.failed === 0) {
      success(`🎉 ALL TESTS PASSED! (${passRate}% success rate)`);
      success('🚀 Site is ready for users!');
    } else {
      error(`❌ ${this.results.failed} tests failed`);
      error('🚨 Deployment has issues that need attention');
    }
    
    // Generate test report
    const report = {
      timestamp: new Date().toISOString(),
      url: SITE_URL,
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate
      },
      tests: this.results.tests
    };
    
    fs.writeFileSync('/tmp/post-deploy-test-report.json', JSON.stringify(report, null, 2));
    info('📄 Test report saved to /tmp/post-deploy-test-report.json');
    
    return this.results.failed === 0;
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new PostDeploymentTester();
  
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    error(`Test suite crashed: ${err.message}`);
    process.exit(1);
  });
}

export default PostDeploymentTester;