#!/bin/bash

# Color Me Same - Initial Setup Script
set -euo pipefail

echo "🎮 Color Me Same - Initial Setup"
echo "================================"
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Check if wrangler is installed globally
if ! command -v wrangler &> /dev/null; then
    echo ""
    echo "📦 Installing Wrangler CLI globally..."
    npm install -g wrangler
fi

# Login to Cloudflare
echo ""
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null 2>&1; then
    echo "Please login to Cloudflare:"
    wrangler login
else
    echo "✅ Already logged in as: $(wrangler whoami 2>/dev/null | grep -o '".*"' | tr -d '"')"
fi

# Create KV namespaces
echo ""
echo "🗄️  Setting up KV namespaces..."
echo "Creating GAME_STATE namespace..."

# Create production namespace
PROD_ID=$(wrangler kv:namespace create "GAME_STATE" 2>/dev/null | grep -oP 'id = "\K[^"]+' || echo "")
if [ -n "$PROD_ID" ]; then
    echo "✅ Production namespace created: $PROD_ID"
else
    echo "⚠️  Production namespace may already exist"
fi

# Create preview namespace
PREVIEW_ID=$(wrangler kv:namespace create "GAME_STATE" --preview 2>/dev/null | grep -oP 'id = "\K[^"]+' || echo "")
if [ -n "$PREVIEW_ID" ]; then
    echo "✅ Preview namespace created: $PREVIEW_ID"
else
    echo "⚠️  Preview namespace may already exist"
fi

# Update wrangler.toml if we got new IDs
if [ -n "$PROD_ID" ] || [ -n "$PREVIEW_ID" ]; then
    echo ""
    echo "📝 Update your wrangler.toml with these values:"
    echo ""
    echo "[[kv_namespaces]]"
    echo "binding = \"GAME_STATE\""
    [ -n "$PROD_ID" ] && echo "id = \"$PROD_ID\""
    [ -n "$PREVIEW_ID" ] && echo "preview_id = \"$PREVIEW_ID\""
    echo ""
    read -p "Press Enter to continue..."
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📄 Creating .env file..."
    cat > .env << EOF
# Cloudflare Worker Environment Variables
ENVIRONMENT=development

# Optional: Analytics (add your own keys)
# SENTRY_DSN=your-sentry-dsn
# POSTHOG_API_KEY=your-posthog-key

# Optional: Custom domain
# CUSTOM_DOMAIN=color-me-same.yourdomain.com
EOF
    echo "✅ Created .env file"
fi

# Install Playwright browsers
echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install

# Run tests
echo ""
echo "🧪 Running tests..."
npm test || echo "⚠️  Some tests failed - please check"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Update wrangler.toml with your KV namespace IDs (if needed)"
echo "2. Run 'npm run dev' to start local development"
echo "3. Visit http://localhost:8787 to play the game"
echo "4. Run 'npm run deploy' when ready to deploy to Cloudflare"
echo ""
echo "📚 For more information, see README.md"