#!/bin/bash

# Always use absolute paths
PROJECT_ROOT="/Users/benserota/Documents/Code Projects/smartcat-smart-uploader"

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
lsof -ti:5173,4000,9000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start Mock S3
echo "1️⃣ Starting Mock S3..."
cd "$PROJECT_ROOT/mock-s3" && node server.js > mock-s3.log 2>&1 &
echo "   Started on http://localhost:9000"

# Start Backend
echo "2️⃣ Starting Backend..."
cd "$PROJECT_ROOT/backend" && npm run build && node dist/index.js > backend.log 2>&1 &
echo "   Started on http://localhost:4000"

# Start Frontend
echo "3️⃣ Starting Frontend..."
cd "$PROJECT_ROOT/frontend" && npm run dev > frontend.log 2>&1 &
echo "   Started on http://localhost:5173"

sleep 5

echo ""
echo "✅ All services should be running!"
echo ""
echo "🔍 Check logs if something isn't working:"
echo "   Mock S3: tail -f $PROJECT_ROOT/mock-s3/mock-s3.log"
echo "   Backend: tail -f $PROJECT_ROOT/backend/backend.log"
echo "   Frontend: tail -f $PROJECT_ROOT/frontend/frontend.log"
echo ""
echo "🛑 To stop all: kill \$(lsof -ti:5173,4000,9000)"
