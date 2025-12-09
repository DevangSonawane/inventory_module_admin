#!/bin/bash

# Script to start both backend and frontend servers
# Usage: ./start.sh

echo "🚀 Starting Inventory Management System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "Ethernet-CRM-pr-executive-management" ] || [ ! -d "inventory_module" ]; then
    echo "❌ Error: Please run this script from the inventory_mod root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
}

# Check if ports are available
if check_port 3000; then
    echo "${YELLOW}⚠️  Port 3000 is already in use. Backend might already be running.${NC}"
fi

if check_port 5173; then
    echo "${YELLOW}⚠️  Port 5173 is already in use. Frontend might already be running.${NC}"
fi

echo ""
echo "${BLUE}Starting Backend Server...${NC}"
cd Ethernet-CRM-pr-executive-management/server

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
npm start &
BACKEND_PID=$!
echo "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo "   API available at: http://localhost:3000/api/v1"

# Wait a bit for backend to start
sleep 3

echo ""
echo "${BLUE}Starting Frontend Server...${NC}"
cd ../../inventory_module

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "${GREEN}✅ Frontend starting...${NC}"
echo "   Frontend will be available at: http://localhost:5173"
echo ""
echo "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT













