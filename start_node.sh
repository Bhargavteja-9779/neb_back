#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  start_node.sh — Start a NebulaAI Compute Node
#  Usage on Laptop A:         ./start_node.sh
#  Usage on Laptop B/C:       SERVER_URL=http://192.168.x.x:8000 ./start_node.sh
# ─────────────────────────────────────────────────────────────────────────────
PYTHON="/Users/bhargavtejap.n/Desktop/PROJECTS/visageux/.venv/bin/python"
cd "$(dirname "$0")/node_agent"
echo "Starting NebulaAI Node Agent..."
$PYTHON node_agent.py
