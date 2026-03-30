#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  start_server.sh — Start the NebulaAI Orchestrator (Laptop A)
#  Usage: chmod +x start_server.sh && ./start_server.sh
# ─────────────────────────────────────────────────────────────────────────────
PYTHON="/Users/bhargavtejap.n/Desktop/PROJECTS/visageux/.venv/bin/python"
cd "$(dirname "$0")/backend"
echo "Starting NebulaAI Orchestrator..."
$PYTHON -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
