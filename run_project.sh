#!/usr/bin/env bash
# ==============================================================================
# SAIOTAF PLATFORM - UNIX/MACOS/LINUX STARTUP SCRIPT
# ==============================================================================

set -e

echo "=============================================================================="
echo "   SAIOTAF: SEMANTIC-AWARE OPPORTUNITY ALIGNMENT PLATFORM (UNIX RUNNER)"
echo "=============================================================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect layout
if [ -d "$ROOT_DIR/student-dashboard" ]; then
    FRONTEND_DIR="$ROOT_DIR/student-dashboard"
else
    FRONTEND_DIR="$ROOT_DIR"
fi

if [ -d "$ROOT_DIR/backend" ]; then
    BACKEND_DIR="$ROOT_DIR/backend"
else
    BACKEND_DIR="$ROOT_DIR"
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.10+."
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js LTS."
    exit 1
fi

# Copy .env if not present
if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$ROOT_DIR/.env.example" ]; then
    cp "$ROOT_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "[INFO] Created .env configuration file."
fi

# Backend Dependencies & Migrations
echo "[1/3] Setting up backend dependencies & migrations..."
cd "$BACKEND_DIR"
pip3 install -r requirements.txt --quiet || pip install -r requirements.txt --quiet
python3 manage.py makemigrations --no-input >/dev/null 2>&1 || true
python3 manage.py migrate --run-syncdb >/dev/null 2>&1 || true

# Frontend Dependencies
echo "[2/3] Setting up frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install --legacy-peer-deps
fi

# Concurrently run Backend & Frontend
echo "[3/3] Starting Backend (Port 8000) and Frontend (Port 5173)..."

cd "$BACKEND_DIR"
python3 manage.py runserver 8000 &
BACKEND_PID=$!

cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit" SIGINT SIGTERM EXIT

echo "=============================================================================="
echo "   PLATFORM IS RUNNING!"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://127.0.0.1:8000/api"
echo "   Press Ctrl+C to stop both servers."
echo "=============================================================================="

wait
