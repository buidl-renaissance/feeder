#!/bin/bash

# Development script to run Next.js and Inngest together
# This script starts both services in parallel

echo "🚀 Starting Feeder Development Environment with Inngest..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $NEXT_PID $INNGEST_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Next.js development server
echo "📱 Starting Next.js development server..."
yarn dev &
NEXT_PID=$!

# Wait a moment for Next.js to start
sleep 3

# Start Inngest development server
echo "⚡ Starting Inngest development server..."
yarn inngest:dev &
INNGEST_PID=$!

echo ""
echo "✅ Development environment is running!"
echo "📱 Next.js: http://localhost:3003"
echo "⚡ Inngest Dev Server: http://localhost:8288"
echo "🔧 Inngest Functions: http://localhost:8288/functions"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $NEXT_PID $INNGEST_PID
