#!/bin/bash

# Comprehensive Connection Verification Script
# This script helps verify that frontend, backend, and database are properly connected

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="Ethernet-CRM-pr-executive-management/server"
FRONTEND_DIR="inventory_module"
BACKEND_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
API_BASE="${BACKEND_URL}/api/v1"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Connection Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
MISSING_DEPS=0

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    MISSING_DEPS=1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    MISSING_DEPS=1
else
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm installed: $NPM_VERSION${NC}"
fi

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}Please install missing dependencies before running verification${NC}"
    exit 1
fi

echo ""

# Check backend directory
echo -e "${YELLOW}Checking backend setup...${NC}"
if [ -d "$BACKEND_DIR" ]; then
    print_status 0 "Backend directory exists"
    
    if [ -f "$BACKEND_DIR/package.json" ]; then
        print_status 0 "Backend package.json exists"
        
        # Check if node_modules exists
        if [ -d "$BACKEND_DIR/node_modules" ]; then
            print_status 0 "Backend dependencies installed"
        else
            echo -e "${YELLOW}⚠️  Backend dependencies not installed. Run: cd $BACKEND_DIR && npm install${NC}"
        fi
        
        # Check for .env file
        if [ -f "$BACKEND_DIR/.env" ]; then
            print_status 0 "Backend .env file exists"
        else
            if [ -f "$BACKEND_DIR/.env.example" ]; then
                echo -e "${YELLOW}⚠️  Backend .env file not found, but .env.example exists${NC}"
            else
                echo -e "${YELLOW}⚠️  Backend .env file not found${NC}"
            fi
        fi
    else
        print_status 1 "Backend package.json not found"
    fi
else
    print_status 1 "Backend directory not found"
fi

echo ""

# Check frontend directory
echo -e "${YELLOW}Checking frontend setup...${NC}"
if [ -d "$FRONTEND_DIR" ]; then
    print_status 0 "Frontend directory exists"
    
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        print_status 0 "Frontend package.json exists"
        
        # Check if node_modules exists
        if [ -d "$FRONTEND_DIR/node_modules" ]; then
            print_status 0 "Frontend dependencies installed"
        else
            echo -e "${YELLOW}⚠️  Frontend dependencies not installed. Run: cd $FRONTEND_DIR && npm install${NC}"
        fi
        
        # Check for .env file
        if [ -f "$FRONTEND_DIR/.env" ]; then
            print_status 0 "Frontend .env file exists"
        else
            echo -e "${YELLOW}⚠️  Frontend .env file not found (using defaults from vite.config.js)${NC}"
        fi
    else
        print_status 1 "Frontend package.json not found"
    fi
else
    print_status 1 "Frontend directory not found"
fi

echo ""

# Check if backend is running
echo -e "${YELLOW}Checking backend server status...${NC}"
if command_exists curl; then
    if curl -s -f "${BACKEND_URL}/api/v1/health" > /dev/null 2>&1; then
        print_status 0 "Backend server is running"
        
        # Test health endpoint
        HEALTH_RESPONSE=$(curl -s "${BACKEND_URL}/api/v1/health")
        if echo "$HEALTH_RESPONSE" | grep -q "success"; then
            print_status 0 "Backend health endpoint responding"
        else
            print_status 1 "Backend health endpoint returned unexpected response"
        fi
        
        # Test inventory health endpoint
        if curl -s -f "${BACKEND_URL}/api/v1/inventory/health" > /dev/null 2>&1; then
            print_status 0 "Inventory health endpoint responding"
        else
            print_status 1 "Inventory health endpoint not responding"
        fi
    else
        print_status 1 "Backend server is not running"
        echo -e "${YELLOW}   Start backend with: cd $BACKEND_DIR && npm start${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping backend connection test${NC}"
fi

echo ""

# Check if frontend is running
echo -e "${YELLOW}Checking frontend server status...${NC}"
if command_exists curl; then
    if curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        print_status 0 "Frontend server is running"
    else
        print_status 1 "Frontend server is not running"
        echo -e "${YELLOW}   Start frontend with: cd $FRONTEND_DIR && npm run dev${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping frontend connection test${NC}"
fi

echo ""

# Check API endpoints (if backend is running)
if curl -s -f "${BACKEND_URL}/api/v1/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}Testing API endpoints...${NC}"
    
    # Test root endpoint
    if curl -s -f "${BACKEND_URL}/" > /dev/null 2>&1; then
        print_status 0 "Root endpoint accessible"
    else
        print_status 1 "Root endpoint not accessible"
    fi
    
    # Test CORS (if frontend is running)
    if curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
        CORS_HEADERS=$(curl -s -I -X OPTIONS "${API_BASE}/inventory/materials" \
            -H "Origin: ${FRONTEND_URL}" \
            -H "Access-Control-Request-Method: GET" 2>&1)
        
        if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
            print_status 0 "CORS configured correctly"
        else
            print_status 1 "CORS may not be configured correctly"
        fi
    fi
fi

echo ""

# Check database connection (if backend is running and we can check)
if curl -s -f "${BACKEND_URL}/api/v1/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}Checking database connection...${NC}"
    HEALTH_DATA=$(curl -s "${BACKEND_URL}/api/v1/inventory/health")
    
    if echo "$HEALTH_DATA" | grep -q "database\|db"; then
        if echo "$HEALTH_DATA" | grep -qi "connected\|success"; then
            print_status 0 "Database connection appears healthy"
        else
            print_status 1 "Database connection may have issues"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not determine database status from health endpoint${NC}"
    fi
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Ensure backend is running: cd $BACKEND_DIR && npm start"
echo "2. Ensure frontend is running: cd $FRONTEND_DIR && npm run dev"
echo "3. Open browser: $FRONTEND_URL"
echo "4. Check browser console for connection status"
echo "5. Test login and navigation"
echo ""
echo -e "${YELLOW}For detailed verification, see:${NC}"
echo "   COMPREHENSIVE_CONNECTION_VERIFICATION_PLAN.md"
echo ""

