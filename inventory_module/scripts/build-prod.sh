#!/bin/bash

# Frontend Production Build Script

set -e  # Exit on error

echo "🏗️  Building frontend for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Using defaults.${NC}"
    echo "Create .env.production from PRODUCTION_ENV.md for production settings"
fi

# Install dependencies
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm install

# Build for production
echo -e "${GREEN}🔨 Building production bundle...${NC}"
npm run build:prod

# Check build output
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
    echo ""
    echo "Build output is in the 'dist' folder"
    echo "Deploy the contents of 'dist' to your web server"
    echo ""
    echo "Build size:"
    du -sh dist/
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

