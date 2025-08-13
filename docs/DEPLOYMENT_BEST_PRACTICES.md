# Color Me Same - Deployment Best Practices

## 🚀 Overview

This guide outlines the current deployment process for Color Me Same and best practices for future enhancements. The game is currently deployed as a static site to Cloudflare Workers.

## 🎯 Current Deployment Process

### Quick Deploy
The project uses a simple deployment script that handles everything:

```bash
# Deploy to production
npm run deploy

# This runs the deploy-cloudflare.sh script which:
# 1. Bumps version number
# 2. Builds the project with Vite
# 3. Deploys to Cloudflare Workers
# 4. Tags the release in git
```

### Manual Steps
1. Ensure you're logged in to Cloudflare:
   ```bash
   wrangler login
   ```

2. Run the deployment:
   ```bash
   npm run deploy
   ```

3. Verify deployment:
   - Check https://color-me-same.franzai.com
   - Test game functionality
   - Monitor console for errors

## 📋 Table of Contents (Advanced Setup)

1. [Prerequisites](#prerequisites)
2. [GitHub Repository Setup](#github-repository-setup)
3. [Cloudflare Configuration](#cloudflare-configuration)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Environment Management](#environment-management)
6. [Security Best Practices](#security-best-practices)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring & Observability](#monitoring--observability)
9. [Rollback Strategy](#rollback-strategy)
10. [Cost Optimization](#cost-optimization)

## Prerequisites

### Required Accounts
- GitHub account with repository access
- Cloudflare account with Workers subscription
- Custom domain (optional but recommended)

### Required Secrets
Configure these in GitHub Settings → Secrets:

```yaml
CLOUDFLARE_API_TOKEN      # Cloudflare API token with Workers permissions
CLOUDFLARE_ACCOUNT_ID     # Your Cloudflare account ID
CLOUDFLARE_ZONE_ID        # Zone ID for custom domain (if applicable)
CLOUDFLARE_WORKERS_SUBDOMAIN  # Your workers.dev subdomain
```

### API Token Permissions
Create a Cloudflare API token with these permissions:
- Account:Cloudflare Workers Scripts:Edit
- Account:Cloudflare Workers KV Storage:Edit
- Zone:Cache Purge:Edit (for custom domain)

## GitHub Repository Setup

### 1. Branch Protection Rules

**Main Branch Protection:**
```yaml
- Require pull request reviews before merging
- Require status checks to pass before merging
  - Required checks: test, lint, security
- Require branches to be up to date before merging
- Include administrators
- Restrict who can push to matching branches
```

**Development Branch:**
```yaml
- Allow force pushes by maintainers only
- Require status checks but not reviews
```

### 2. Repository Structure

```
color-me-same/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml         # Main deployment workflow
│   │   ├── pr-checks.yml      # PR validation
│   │   └── security.yml       # Security scanning
│   ├── CODEOWNERS            # Code ownership rules
│   └── dependabot.yml        # Dependency updates
├── src/                      # Source code
├── tests/                    # Test suites
├── scripts/                  # Build/deploy scripts
├── docs/                     # Documentation
└── wrangler.toml            # Cloudflare config
```

### 3. Code Owners File

Create `.github/CODEOWNERS`:
```
# Global owners
* @your-username

# Deployment configuration
/.github/workflows/ @devops-team
/wrangler.toml @devops-team

# Game logic
/src/game-logic.js @game-team
/src/worker.js @backend-team
```

## Cloudflare Configuration

### 1. Wrangler Configuration

**wrangler.toml** best practices:
```toml
name = "color-me-same"
main = "src/worker.js"
compatibility_date = "2024-01-01"
workers_dev = false  # Disable workers.dev in production

# Account settings
account_id = "YOUR_ACCOUNT_ID"  # Can be overridden by env var

# KV Namespaces
[[kv_namespaces]]
binding = "GAME_STATE"
id = "production-kv-id"
preview_id = "preview-kv-id"

# Durable Objects
[[durable_objects.bindings]]
name = "GAME_SESSION"
class_name = "GameSession"

# Environment-specific configuration
[env.production]
name = "color-me-same-prod"
route = "color-me-same.franzai.com/*"
vars = { ENVIRONMENT = "production", LOG_LEVEL = "error" }

[env.preview]
name = "color-me-same-preview"
workers_dev = true
vars = { ENVIRONMENT = "preview", LOG_LEVEL = "debug" }

[env.development]
name = "color-me-same-dev"
vars = { ENVIRONMENT = "development", LOG_LEVEL = "debug" }

# Build configuration
[build]
command = "npm run build"
watch_paths = ["src/**/*.js"]

# Usage model (for cost optimization)
[usage_model]
default = "bundled"  # or "unbound" for high-traffic
```

### 2. KV Namespace Setup

```bash
# Create production namespace
wrangler kv:namespace create "GAME_STATE"

# Create preview namespace
wrangler kv:namespace create "GAME_STATE" --preview

# List namespaces
wrangler kv:namespace list
```

### 3. Custom Domain Configuration

1. Add route in wrangler.toml
2. Configure DNS in Cloudflare:
   - Type: CNAME
   - Name: color-me-same
   - Target: color-me-same.workers.dev
   - Proxy: Enabled (orange cloud)

## CI/CD Pipeline

### 1. Enhanced GitHub Actions Workflow

Create `.github/workflows/deploy-enhanced.yml`:

```yaml
name: Deploy ColorMeSame

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [development, preview, production]

env:
  NODE_VERSION: '20'
  WRANGLER_VERSION: '3.24.0'

jobs:
  # Validate code quality
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.npm
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
      
      - name: Install dependencies
        run: npm ci --prefer-offline --no-audit
      
      - name: Lint code
        run: npm run lint -- --max-warnings=0
      
      - name: Type check
        if: hashFiles('tsconfig.json') != ''
        run: npx tsc --noEmit
      
      - name: Check formatting
        run: npm run format -- --check

  # Run all tests
  test:
    name: Test Suite (${{ matrix.test-type }})
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, integration, e2e]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        if: matrix.test-type == 'unit'
        run: npm test -- --coverage --reporters=default --reporters=jest-junit
      
      - name: Run integration tests
        if: matrix.test-type == 'integration'
        run: npm run test:integration
      
      - name: Setup Playwright
        if: matrix.test-type == 'e2e'
        run: npx playwright install --with-deps chromium
      
      - name: Run E2E tests
        if: matrix.test-type == 'e2e'
        run: npm run test:e2e -- --reporter=html
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.test-type }}
          path: |
            coverage/
            test-results/
            playwright-report/

  # Security scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: npm audit --production --audit-level=moderate

  # Build application
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [quality, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: |
          npm run build
          npx wrangler deploy --dry-run --outdir=dist
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/
          retention-days: 7

  # Deploy to preview environment
  deploy-preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.event_name == 'pull_request'
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    outputs:
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Cloudflare
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env preview
      
      - name: Comment deployment URL
        uses: actions/github-script@v7
        with:
          script: |
            const url = '${{ steps.deploy.outputs.deployment-url }}';
            const comment = `### 🚀 Preview Deployment Ready!
            
            **URL**: ${url}
            **Environment**: Preview
            **Commit**: \`${{ github.event.pull_request.head.sha }}\`
            
            #### Deployment Checklist
            - [ ] Visual regression tests passed
            - [ ] Performance metrics acceptable
            - [ ] Security headers configured
            - [ ] Mobile responsiveness verified`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });

  # Performance testing
  performance:
    name: Performance Testing
    runs-on: ubuntu-latest
    needs: deploy-preview
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: ${{ needs.deploy-preview.outputs.url }}
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: .lighthouserc.json
      
      - name: Run WebPageTest
        run: |
          # Run performance test
          npm run test:performance -- --url=${{ needs.deploy-preview.outputs.url }}

  # Deploy to production
  deploy-production:
    name: Deploy Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://color-me-same.franzai.com
    steps:
      - uses: actions/checkout@v4
      
      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: dist/
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
      
      - name: Purge cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ secrets.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"files":["https://color-me-same.franzai.com/*"]}'
      
      - name: Smoke tests
        run: |
          npm run test:smoke -- --url=https://color-me-same.franzai.com
      
      - name: Create deployment record
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              description: 'Production deployment',
              auto_merge: false,
              required_contexts: ['quality', 'test', 'security']
            });
```

### 2. Pre-deployment Checklist

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Deployment Checklist
- [ ] Environment variables updated
- [ ] Database migrations ready
- [ ] Feature flags configured
- [ ] Monitoring alerts set up
- [ ] Rollback plan documented

## Screenshots (if applicable)
Add screenshots here
```

## Environment Management

### 1. Environment Strategy

```
main branch → production
develop branch → preview
feature/* → development
```

### 2. Environment Variables

**Development:**
```env
ENVIRONMENT=development
LOG_LEVEL=debug
API_URL=http://localhost:8787
FEATURE_FLAGS=all
```

**Preview:**
```env
ENVIRONMENT=preview
LOG_LEVEL=info
API_URL=https://color-me-same-preview.workers.dev
FEATURE_FLAGS=beta
```

**Production:**
```env
ENVIRONMENT=production
LOG_LEVEL=error
API_URL=https://color-me-same.franzai.com
FEATURE_FLAGS=stable
```

### 3. Feature Flags

Implement feature flags for gradual rollouts:

```javascript
// src/features.js
export const FEATURES = {
  MULTIPLAYER: {
    development: true,
    preview: true,
    production: false
  },
  NEW_POWERUPS: {
    development: true,
    preview: true,
    production: process.env.ROLLOUT_PERCENTAGE > 50
  }
};

export function isFeatureEnabled(feature) {
  const env = process.env.ENVIRONMENT || 'development';
  return FEATURES[feature]?.[env] ?? false;
}
```

## Security Best Practices

### 1. Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate API tokens regularly
- Use least-privilege principle for tokens

### 2. Security Headers

Configure in worker:
```javascript
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
};
```

### 3. Rate Limiting

Implement rate limiting in worker:
```javascript
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 100 // requests per window
};

async function rateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  const key = `rate-limit:${ip}`;
  
  const current = await env.GAME_STATE.get(key) || 0;
  if (current >= RATE_LIMIT.max) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  await env.GAME_STATE.put(key, current + 1, {
    expirationTtl: RATE_LIMIT.windowMs / 1000
  });
}
```

## Performance Optimization

### 1. Caching Strategy

```javascript
// Cache static assets
const CACHE_CONTROL = {
  'text/html': 'public, max-age=3600', // 1 hour
  'application/javascript': 'public, max-age=31536000, immutable', // 1 year
  'text/css': 'public, max-age=31536000, immutable', // 1 year
  'image/*': 'public, max-age=86400' // 1 day
};

// Cache API responses
const API_CACHE = {
  '/api/leaderboard': 300, // 5 minutes
  '/api/daily-puzzle': 3600, // 1 hour
  '/api/generate': 0 // No cache
};
```

### 2. Bundle Optimization

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'game-logic': ['./src/game-logic.js'],
          'vendor': ['react', 'react-dom'],
          'utils': ['./src/utils/']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
};
```

### 3. Asset Optimization

- Use WebP/AVIF for images
- Implement lazy loading
- Use CDN for static assets
- Enable Brotli compression

## Monitoring & Observability

### 1. Logging Strategy

```javascript
class Logger {
  constructor(env) {
    this.env = env;
    this.level = env.LOG_LEVEL || 'info';
  }
  
  log(level, message, data = {}) {
    if (this.shouldLog(level)) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...data,
        environment: this.env.ENVIRONMENT,
        requestId: this.requestId
      }));
    }
  }
  
  error(message, error) {
    this.log('error', message, {
      error: error.message,
      stack: error.stack
    });
  }
}
```

### 2. Metrics Collection

```javascript
// Track key metrics
async function trackMetric(env, metric, value, tags = {}) {
  const data = {
    metric,
    value,
    timestamp: Date.now(),
    tags: {
      environment: env.ENVIRONMENT,
      ...tags
    }
  };
  
  // Send to analytics service
  await fetch(env.METRICS_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// Usage
await trackMetric(env, 'game.completed', 1, {
  difficulty: 'hard',
  moves: 25,
  time: 180
});
```

### 3. Error Tracking

Integrate with Sentry:
```javascript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENVIRONMENT,
  tracesSampleRate: process.env.ENVIRONMENT === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    return event;
  }
});
```

## Rollback Strategy

### 1. Automated Rollback

```yaml
# In deploy workflow
- name: Health check
  id: health
  run: |
    for i in {1..5}; do
      STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://color-me-same.franzai.com/health)
      if [ $STATUS -eq 200 ]; then
        echo "Health check passed"
        exit 0
      fi
      sleep 10
    done
    exit 1

- name: Rollback on failure
  if: failure() && steps.health.outcome == 'failure'
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    command: rollback
```

### 2. Manual Rollback

```bash
# List deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback --deployment-id=abc123

# Rollback to previous version
wrangler rollback
```

### 3. Database Rollback

For KV data changes:
```javascript
// Before making changes, create backup
async function backupKV(env, prefix) {
  const list = await env.GAME_STATE.list({ prefix });
  const backup = {};
  
  for (const key of list.keys) {
    backup[key.name] = await env.GAME_STATE.get(key.name);
  }
  
  await env.GAME_STATE.put(
    `backup:${Date.now()}:${prefix}`,
    JSON.stringify(backup)
  );
}
```

## Cost Optimization

### 1. Worker Usage

Monitor and optimize:
- Request count
- CPU time
- Memory usage
- KV operations

### 2. Bundled vs Unbound

```toml
# For < 50ms CPU time per request
[usage_model]
default = "bundled"

# For > 50ms CPU time or high memory
[usage_model]
default = "unbound"
```

### 3. KV Optimization

```javascript
// Batch KV operations
async function batchGet(env, keys) {
  const promises = keys.map(key => env.GAME_STATE.get(key));
  return Promise.all(promises);
}

// Use TTL to auto-expire
await env.GAME_STATE.put(key, value, {
  expirationTtl: 3600 // 1 hour
});
```

## Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Security scan clean
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Change log updated

### During deployment
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify cache purge
- [ ] Test critical paths

### Post-deployment
- [ ] Smoke tests passing
- [ ] Metrics normal
- [ ] No error spike
- [ ] User reports monitored
- [ ] Rollback plan ready

## Troubleshooting

### Common Issues

1. **Deployment fails**
   - Check API token permissions
   - Verify account ID
   - Check wrangler.toml syntax

2. **KV not working**
   - Ensure namespace IDs are correct
   - Check binding names match
   - Verify KV operations quota

3. **Custom domain issues**
   - Confirm DNS settings
   - Check SSL certificate
   - Verify route configuration

### Debug Commands

```bash
# Check worker status
wrangler tail

# View real-time logs
wrangler tail --format pretty

# Test locally
wrangler dev

# Validate configuration
wrangler publish --dry-run
```

## Conclusion

Following these best practices ensures:
- Reliable deployments
- Quick rollbacks
- Performance optimization
- Security compliance
- Cost efficiency

Regular reviews and updates of these practices keep the deployment pipeline modern and efficient.