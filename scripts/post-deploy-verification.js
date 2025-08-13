#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import puppeteer from 'puppeteer';

const execAsync = promisify(exec);

const DEPLOYMENT_URL = 'https://floktoid.franzai.com';
const CHECKS = {
  HTTP: '🌐 HTTP Health',
  PERFORMANCE: '⚡ Performance',
  LIGHTHOUSE: '🏗️ Lighthouse',
  CONSOLE: '📝 Console Errors',
  NETWORK: '🔌 Network Errors',
  VISUAL: '👁️ Visual Tests',
  MOBILE: '📱 Mobile Tests',
  SECURITY: '🔒 Security',
  WRANGLER: '☁️ Wrangler Logs',
  AI_ANALYSIS: '🤖 AI Analysis'
};

class PostDeploymentVerifier {
  constructor() {
    this.results = {};
    this.errors = [];
    this.browser = null;
  }

  async runAllChecks() {
    console.log('\n🚀 STARTING POST-DEPLOYMENT VERIFICATION\n');
    console.log('=' .repeat(50));
    
    await this.httpHealthCheck();
    await this.performanceCheck();
    await this.lighthouseCheck();
    await this.browserChecks();
    await this.securityCheck();
    await this.wranglerLogCheck();
    await this.aiScreenshotAnalysis();
    
    return this.generateReport();
  }

  // 1. HTTP Health Checks
  async httpHealthCheck() {
    console.log(`\n${CHECKS.HTTP}`);
    const results = {};
    
    try {
      // Main page
      const response = await fetch(DEPLOYMENT_URL);
      results.status = response.status;
      results.statusOK = response.ok;
      results.headers = Object.fromEntries(response.headers);
      
      // Check response time
      const startTime = Date.now();
      await fetch(DEPLOYMENT_URL);
      results.responseTime = Date.now() - startTime;
      
      // Check specific endpoints
      const endpoints = [
        '/',
        '/index.html',
        '/assets/index-BVd1wHJM.js',
        '/favicon.svg'
      ];
      
      results.endpoints = {};
      for (const endpoint of endpoints) {
        try {
          const res = await fetch(`${DEPLOYMENT_URL}${endpoint}`);
          results.endpoints[endpoint] = {
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get('content-type')
          };
        } catch (e) {
          results.endpoints[endpoint] = { error: e.message };
        }
      }
      
      this.results.http = results;
      console.log(`  ✅ HTTP Status: ${results.status}`);
      console.log(`  ⏱️ Response Time: ${results.responseTime}ms`);
      
    } catch (error) {
      this.errors.push({ check: 'HTTP', error: error.message });
      console.log(`  ❌ HTTP Check Failed: ${error.message}`);
    }
  }

  // 2. Performance Metrics
  async performanceCheck() {
    console.log(`\n${CHECKS.PERFORMANCE}`);
    
    try {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await this.browser.newPage();
      await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle2' });
      
      const metrics = await page.metrics();
      const performanceData = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          loadComplete: perf.loadEventEnd - perf.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
          memory: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          } : null
        };
      });
      
      this.results.performance = {
        ...metrics,
        ...performanceData
      };
      
      console.log(`  ✅ DOM Load: ${performanceData.domContentLoaded?.toFixed(2)}ms`);
      console.log(`  ✅ First Paint: ${performanceData.firstPaint?.toFixed(2)}ms`);
      console.log(`  ✅ JS Heap: ${(metrics.JSHeapUsedSize / 1048576).toFixed(2)}MB`);
      
    } catch (error) {
      this.errors.push({ check: 'Performance', error: error.message });
      console.log(`  ❌ Performance Check Failed: ${error.message}`);
    }
  }

  // 3. Lighthouse Audit
  async lighthouseCheck() {
    console.log(`\n${CHECKS.LIGHTHOUSE}`);
    
    try {
      const { stdout } = await execAsync(
        `npx lighthouse ${DEPLOYMENT_URL} --output=json --output-path=./test-results/lighthouse.json --chrome-flags="--headless --no-sandbox" --only-categories=performance,accessibility,best-practices,seo 2>/dev/null || true`
      );
      
      const report = JSON.parse(await fs.readFile('./test-results/lighthouse.json', 'utf-8'));
      
      this.results.lighthouse = {
        performance: report.categories.performance.score * 100,
        accessibility: report.categories.accessibility.score * 100,
        bestPractices: report.categories['best-practices'].score * 100,
        seo: report.categories.seo.score * 100
      };
      
      console.log(`  🎯 Performance: ${this.results.lighthouse.performance}/100`);
      console.log(`  ♿ Accessibility: ${this.results.lighthouse.accessibility}/100`);
      console.log(`  📋 Best Practices: ${this.results.lighthouse.bestPractices}/100`);
      console.log(`  🔍 SEO: ${this.results.lighthouse.seo}/100`);
      
    } catch (error) {
      this.errors.push({ check: 'Lighthouse', error: error.message });
      console.log(`  ❌ Lighthouse Check Failed: ${error.message}`);
    }
  }

  // 4. Browser Console & Network Errors
  async browserChecks() {
    console.log(`\n${CHECKS.CONSOLE} & ${CHECKS.NETWORK}`);
    
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }
      
      const page = await this.browser.newPage();
      const consoleErrors = [];
      const networkErrors = [];
      
      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            text: msg.text(),
            location: msg.location()
          });
        }
      });
      
      // Listen for page errors
      page.on('pageerror', error => {
        consoleErrors.push({
          text: error.message,
          stack: error.stack
        });
      });
      
      // Listen for failed requests
      page.on('requestfailed', request => {
        networkErrors.push({
          url: request.url(),
          failure: request.failure()
        });
      });
      
      // Navigate and interact with the page
      await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle2' });
      await page.waitForTimeout(2000);
      
      // Click start game
      const startButton = await page.$('button:has-text("START GAME")');
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(2000);
        
        // Simulate gameplay
        await page.mouse.move(400, 300);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.mouse.move(500, 200);
        await page.mouse.up();
        await page.waitForTimeout(1000);
      }
      
      this.results.console = {
        errors: consoleErrors,
        errorCount: consoleErrors.length
      };
      
      this.results.network = {
        errors: networkErrors,
        errorCount: networkErrors.length
      };
      
      if (consoleErrors.length === 0) {
        console.log(`  ✅ No console errors detected`);
      } else {
        console.log(`  ⚠️ Found ${consoleErrors.length} console errors`);
        consoleErrors.slice(0, 3).forEach(err => 
          console.log(`    - ${err.text.substring(0, 100)}`)
        );
      }
      
      if (networkErrors.length === 0) {
        console.log(`  ✅ No network errors detected`);
      } else {
        console.log(`  ⚠️ Found ${networkErrors.length} network errors`);
      }
      
    } catch (error) {
      this.errors.push({ check: 'Browser', error: error.message });
      console.log(`  ❌ Browser Check Failed: ${error.message}`);
    }
  }

  // 5. Security Headers Check
  async securityCheck() {
    console.log(`\n${CHECKS.SECURITY}`);
    
    try {
      const response = await fetch(DEPLOYMENT_URL);
      const headers = Object.fromEntries(response.headers);
      
      const securityHeaders = {
        'content-security-policy': headers['content-security-policy'] ? '✅' : '❌',
        'x-content-type-options': headers['x-content-type-options'] ? '✅' : '❌',
        'x-frame-options': headers['x-frame-options'] ? '✅' : '❌',
        'strict-transport-security': headers['strict-transport-security'] ? '✅' : '❌',
        'x-xss-protection': headers['x-xss-protection'] ? '✅' : '❌'
      };
      
      this.results.security = securityHeaders;
      
      Object.entries(securityHeaders).forEach(([header, status]) => {
        console.log(`  ${status} ${header}`);
      });
      
    } catch (error) {
      this.errors.push({ check: 'Security', error: error.message });
      console.log(`  ❌ Security Check Failed: ${error.message}`);
    }
  }

  // 6. Wrangler Logs Analysis
  async wranglerLogCheck() {
    console.log(`\n${CHECKS.WRANGLER}`);
    
    try {
      // Get recent logs
      const { stdout } = await execAsync('wrangler tail --format json | head -100 || true');
      const logs = stdout.split('\n').filter(line => line.trim()).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      const errors = logs.filter(log => log.level === 'error' || log.exceptions?.length > 0);
      const warnings = logs.filter(log => log.level === 'warn');
      
      this.results.wrangler = {
        totalLogs: logs.length,
        errors: errors.length,
        warnings: warnings.length,
        recentErrors: errors.slice(0, 5)
      };
      
      console.log(`  📊 Total Logs: ${logs.length}`);
      console.log(`  ${errors.length === 0 ? '✅' : '⚠️'} Errors: ${errors.length}`);
      console.log(`  ${warnings.length === 0 ? '✅' : '⚠️'} Warnings: ${warnings.length}`);
      
    } catch (error) {
      // Wrangler tail might not be available in all environments
      console.log(`  ℹ️ Wrangler logs not available`);
      this.results.wrangler = { unavailable: true };
    }
  }

  // 7. AI Screenshot Analysis
  async aiScreenshotAnalysis() {
    console.log(`\n${CHECKS.AI_ANALYSIS}`);
    
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({ 
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }
      
      const page = await this.browser.newPage();
      const screenshotDir = path.join(process.cwd(), 'test-results', 'deploy-screenshots');
      await fs.mkdir(screenshotDir, { recursive: true });
      
      // Take screenshots of different states
      const screenshots = [
        { name: 'start-screen', viewport: { width: 1920, height: 1080 } },
        { name: 'mobile-start', viewport: { width: 390, height: 844 } },
        { name: 'tablet-start', viewport: { width: 768, height: 1024 } }
      ];
      
      for (const config of screenshots) {
        await page.setViewport(config.viewport);
        await page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle2' });
        await page.screenshot({ 
          path: path.join(screenshotDir, `${config.name}.png`),
          fullPage: false 
        });
      }
      
      // Run AI analysis
      const { stdout } = await execAsync(`node scripts/ai-screenshot-analyzer.js "${screenshotDir}" 2>&1 || true`);
      
      // Parse results
      const lines = stdout.split('\n');
      const passedLine = lines.find(l => l.includes('Passed:'));
      const qualityLine = lines.find(l => l.includes('Average Quality:'));
      
      this.results.aiAnalysis = {
        output: stdout.substring(0, 500),
        passed: passedLine || 'Unknown',
        quality: qualityLine || 'Unknown'
      };
      
      console.log(`  ${passedLine || '✅ AI Analysis Complete'}`);
      console.log(`  ${qualityLine || '⭐ Quality Check Complete'}`);
      
    } catch (error) {
      this.errors.push({ check: 'AI Analysis', error: error.message });
      console.log(`  ❌ AI Analysis Failed: ${error.message}`);
    }
  }

  // Generate Final Report
  async generateReport() {
    if (this.browser) {
      await this.browser.close();
    }
    
    const report = {
      timestamp: new Date().toISOString(),
      url: DEPLOYMENT_URL,
      results: this.results,
      errors: this.errors,
      summary: {
        totalChecks: Object.keys(CHECKS).length,
        passed: Object.keys(this.results).length,
        failed: this.errors.length,
        httpOK: this.results.http?.statusOK || false,
        performanceOK: (this.results.performance?.firstContentfulPaint || Infinity) < 3000,
        noConsoleErrors: (this.results.console?.errorCount || 1) === 0,
        noNetworkErrors: (this.results.network?.errorCount || 1) === 0
      }
    };
    
    // Save report
    const reportPath = path.join(process.cwd(), 'test-results', 'deployment-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 DEPLOYMENT VERIFICATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${report.summary.passed}/${report.summary.totalChecks}`);
    console.log(`❌ Failed: ${report.summary.failed}/${report.summary.totalChecks}`);
    console.log('\nKey Metrics:');
    console.log(`  HTTP: ${report.summary.httpOK ? '✅' : '❌'}`);
    console.log(`  Performance: ${report.summary.performanceOK ? '✅' : '❌'}`);
    console.log(`  Console Errors: ${report.summary.noConsoleErrors ? '✅' : '❌'}`);
    console.log(`  Network Errors: ${report.summary.noNetworkErrors ? '✅' : '❌'}`);
    
    // Determine overall status
    const allPassed = report.summary.httpOK && 
                     report.summary.performanceOK && 
                     report.summary.noConsoleErrors && 
                     report.summary.noNetworkErrors &&
                     report.errors.length === 0;
    
    if (allPassed) {
      console.log('\n🎉 DEPLOYMENT VERIFICATION PASSED!');
      return 0;
    } else {
      console.log('\n⚠️ DEPLOYMENT VERIFICATION FAILED - Review report for details');
      return 1;
    }
  }
}

// Run verification
if (import.meta.url === `file://${process.argv[1]}`) {
  const verifier = new PostDeploymentVerifier();
  verifier.runAllChecks().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('❌ Verification crashed:', error);
    process.exit(1);
  });
}

export default PostDeploymentVerifier;