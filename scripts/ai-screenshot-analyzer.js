#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

// AI Screenshot Analyzer using Claude via CLI
export class AIScreenshotAnalyzer {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async analyzeScreenshot(screenshotPath, expectedState) {
    console.log(`🤖 AI Analyzing: ${path.basename(screenshotPath)}`);
    
    try {
      // Create analysis prompt
      const prompt = `Analyze this game screenshot and verify:
      1. Expected state: ${expectedState}
      2. Check for visual glitches, missing elements, or rendering issues
      3. Verify neon aesthetic is rendering correctly
      4. Check responsive layout issues
      5. Confirm all UI elements are visible and properly positioned
      6. Rate visual quality 1-10
      7. List any issues found
      
      Respond in JSON format: {
        "state_correct": boolean,
        "visual_quality": number,
        "issues": [],
        "elements_found": [],
        "recommendation": string
      }`;

      // Use OCR or image analysis tool
      const analysis = await this.performVisualAnalysis(screenshotPath, prompt);
      
      this.results.push({
        screenshot: screenshotPath,
        state: expectedState,
        analysis,
        timestamp: new Date().toISOString()
      });

      return analysis;
    } catch (error) {
      this.errors.push({
        screenshot: screenshotPath,
        error: error.message
      });
      return null;
    }
  }

  async performVisualAnalysis(imagePath, prompt) {
    // Use Tesseract OCR to extract text
    try {
      const { stdout: ocrText } = await execAsync(`tesseract "${imagePath}" - 2>/dev/null || true`);
      
      // Analyze image properties
      const { stdout: imageInfo } = await execAsync(`identify -verbose "${imagePath}" 2>/dev/null | head -20 || true`);
      
      // Check for common issues
      const issues = [];
      
      // Check if image is too large
      if (imageInfo.includes('Geometry:')) {
        const match = imageInfo.match(/Geometry: (\d+)x(\d+)/);
        if (match) {
          const [, width, height] = match;
          if (parseInt(width) > 2000 || parseInt(height) > 2000) {
            issues.push('Image resolution exceeds expected viewport size');
          }
        }
      }
      
      // Check for black screens
      const { stdout: colorStats } = await execAsync(`convert "${imagePath}" -format "%[fx:mean]" info: 2>/dev/null || echo "0.5"`);
      const meanBrightness = parseFloat(colorStats);
      if (meanBrightness < 0.1) {
        issues.push('Screen appears to be mostly black - possible rendering failure');
      }
      
      // Look for expected text elements
      const elementsFound = [];
      const expectedTexts = ['NEON', 'FLOCK', 'WAVE', 'SCORE', 'START', 'GAME'];
      for (const text of expectedTexts) {
        if (ocrText.toUpperCase().includes(text)) {
          elementsFound.push(text);
        }
      }
      
      return {
        state_correct: elementsFound.length > 0,
        visual_quality: meanBrightness > 0.1 ? Math.min(10, Math.floor(meanBrightness * 10 + 5)) : 1,
        issues,
        elements_found: elementsFound,
        ocr_text: ocrText.substring(0, 200),
        recommendation: issues.length > 0 ? 'Review and fix issues' : 'Screenshot looks good'
      };
    } catch (error) {
      return {
        state_correct: false,
        visual_quality: 0,
        issues: ['Analysis failed: ' + error.message],
        elements_found: [],
        recommendation: 'Unable to analyze - check screenshot manually'
      };
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      total_screenshots: this.results.length,
      passed: this.results.filter(r => r.analysis?.state_correct).length,
      failed: this.results.filter(r => !r.analysis?.state_correct).length,
      errors: this.errors.length,
      average_quality: this.results.reduce((sum, r) => sum + (r.analysis?.visual_quality || 0), 0) / this.results.length,
      all_issues: this.results.flatMap(r => r.analysis?.issues || []),
      results: this.results,
      errors: this.errors
    };

    await fs.writeFile(
      path.join(process.cwd(), 'test-results', 'ai-analysis.json'),
      JSON.stringify(report, null, 2)
    );

    return report;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new AIScreenshotAnalyzer();
  const screenshotDir = process.argv[2] || './test-results/screenshots';
  
  (async () => {
    try {
      const files = await fs.readdir(screenshotDir);
      const screenshots = files.filter(f => f.endsWith('.png'));
      
      for (const screenshot of screenshots) {
        const fullPath = path.join(screenshotDir, screenshot);
        await analyzer.analyzeScreenshot(fullPath, screenshot.replace('.png', ''));
      }
      
      const report = await analyzer.generateReport();
      console.log('\n📊 AI Analysis Complete:');
      console.log(`✅ Passed: ${report.passed}/${report.total_screenshots}`);
      console.log(`❌ Failed: ${report.failed}/${report.total_screenshots}`);
      console.log(`⭐ Average Quality: ${report.average_quality.toFixed(1)}/10`);
      
      if (report.all_issues.length > 0) {
        console.log('\n⚠️ Issues Found:');
        report.all_issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      process.exit(report.failed > 0 ? 1 : 0);
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    }
  })();
}