#!/bin/bash

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
lsof -ti:5173,4000,9000 | xargs kill -9 2>/dev/null || true

# Start all services
echo "🚀 Starting all services..."

# Start Mock S3
cd mock-s3
node server.js &
MOCK_PID=$!
echo "✅ Mock S3 started (PID: $MOCK_PID)"

# Start Backend
cd ../backend
npm run build && node dist/index.js &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Start Frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 All services are starting up!"
echo ""
echo "📌 Access your application at:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   🔧 Backend API: http://localhost:4000"
echo "   💾 Mock S3: http://localhost:9000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $MOCK_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
