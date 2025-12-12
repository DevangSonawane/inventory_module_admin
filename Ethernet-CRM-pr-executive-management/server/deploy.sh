#!/bin/bash

# Deployment script for Inventory Management System
# This script handles database backup, migrations, and deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"
LOG_DIR="$SERVER_DIR/logs"
BACKUP_DIR="$SERVER_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Inventory Management System Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$SERVER_DIR/.env" ]; then
    echo -e "${RED}❌ Error: .env file not found in $SERVER_DIR${NC}"
    echo "Please create a .env file based on .env.example"
    exit 1
fi

# Load environment variables
source "$SERVER_DIR/.env"

# Check required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Error: Required database environment variables not set${NC}"
    exit 1
fi

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Step 1: Backing up database...${NC}"
BACKUP_FILE="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

# Backup database (requires mysqldump)
if command -v mysqldump &> /dev/null; then
    mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Warning: Database backup failed. Continuing anyway...${NC}"
    }
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ Database backed up to: $BACKUP_FILE${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Warning: mysqldump not found. Skipping database backup.${NC}"
fi

echo ""
echo -e "${YELLOW}🔄 Step 2: Running database migrations...${NC}"
cd "$SERVER_DIR"
npm run migrate || {
    echo -e "${YELLOW}⚠️  Warning: Migration script encountered issues. Check logs.${NC}"
}

echo ""
echo -e "${YELLOW}📦 Step 3: Installing dependencies...${NC}"
npm install --production || {
    echo -e "${RED}❌ Error: Failed to install dependencies${NC}"
    exit 1
}

echo ""
echo -e "${YELLOW}🔄 Step 4: Restarting application with PM2...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ Error: PM2 is not installed${NC}"
    echo "Install PM2 with: npm install -g pm2"
    exit 1
fi

# Stop existing instance if running
pm2 stop inventory-api 2>/dev/null || true
pm2 delete inventory-api 2>/dev/null || true

# Start with PM2
cd "$SERVER_DIR"
pm2 start ecosystem.config.js --env production || {
    echo -e "${RED}❌ Error: Failed to start application with PM2${NC}"
    exit 1
}

echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}📊 Application Status:${NC}"
pm2 status inventory-api

echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "  View logs:    pm2 logs inventory-api"
echo "  Monitor:      pm2 monit"
echo "  Restart:      pm2 restart inventory-api"
echo "  Stop:         pm2 stop inventory-api"
echo ""
echo -e "${GREEN}Deployment completed at $(date)${NC}"
