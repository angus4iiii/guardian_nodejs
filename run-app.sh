#!/bin/bash
# Script to launch both frontend and backend servers


# Start backend (Express) in foreground so logs are visible
echo "Starting backend..."
(cd backend && node index.js)

# Start frontend (React) in background
echo "Starting frontend..."
(cd frontend && npm start &)

echo "Backend logs will be shown here. Frontend is running in the background."
