#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.DEPLOY_URL || 'https://floktoid.franzai.com';
const IS_LOCAL = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');

const requiredImages = [
  '/favicon.svg',
  '/og-image.svg', 
  '/og-image.png'
];

async function checkImage(url) {
  return new Promise((resolve) => {
    const protocol = IS_LOCAL ? http : https;
    
    const req = protocol.get(url, (res) => {
      if (res.statusCode === 200) {
        // Check content type
        const contentType = res.headers['content-type'] || '';
        const isValid = url.endsWith('.svg') ? contentType.includes('svg') : 
                       url.endsWith('.png') ? contentType.includes('png') : true;
        
        resolve({
          url,
          status: res.statusCode,
          valid: isValid,
          contentType
        });
      } else {
        resolve({
          url,
          status: res.statusCode,
          valid: false,
          contentType: null
        });
      }
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        valid: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        valid: false,
        error: 'Timeout'
      });
    });
  });
}

async function testImageDeployment() {
  console.log('🖼️  Testing Image Deployment...');
  console.log(`📍 URL: ${BASE_URL}`);
  
  let allPassed = true;
  
  for (const imagePath of requiredImages) {
    const fullUrl = `${BASE_URL}${imagePath}`;
    const result = await checkImage(fullUrl);
    
    if (result.valid) {
      console.log(`✅ ${imagePath} - OK (${result.contentType})`);
    } else {
      console.log(`❌ ${imagePath} - FAILED (Status: ${result.status}${result.error ? ', Error: ' + result.error : ''})`);
      allPassed = false;
    }
  }
  
  // Also check if files exist locally
  console.log('\n📁 Checking local files:');
  const publicDir = path.join(__dirname, '..', 'public');
  
  for (const imagePath of requiredImages) {
    const localPath = path.join(publicDir, imagePath);
    if (fs.existsSync(localPath)) {
      const stats = fs.statSync(localPath);
      console.log(`✅ ${imagePath} exists locally (${stats.size} bytes)`);
    } else {
      console.log(`❌ ${imagePath} missing locally`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log('\n✅ All image deployment tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some image deployment tests failed!');
    process.exit(1);
  }
}

// Run tests
testImageDeployment().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});