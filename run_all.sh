#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  ApexAgile Pro - Enterprise Agile Project Management"
echo "========================================================"
PORT="${PORT:-8001}"
export PORT
echo "Installing dependencies if needed..."
python3 -m pip install -r backend/requirements.txt

echo ""
echo "Starting application server..."
echo "Access Web UI at:               http://127.0.0.1:${PORT}"
echo "Access Interactive API Docs at: http://127.0.0.1:${PORT}/docs"
echo "========================================================"
export PYTHONPATH=backend
python3 backend/run.py
