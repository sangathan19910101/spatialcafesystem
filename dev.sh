#!/bin/bash
set -e

# Start backend in background
echo "Starting backend..."
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ..
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
