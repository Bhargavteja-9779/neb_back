#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  start_node.sh — Start a NebulaAI Compute Node
#  Usage on Laptop A:         ./start_node.sh
#  Usage on Laptop B/C:       SERVER_URL=http://<LAPTOP_A_IP>:8000 ./start_node.sh
# ─────────────────────────────────────────────────────────────────────────────

# Automatically find Python if the venv doesn't exist (e.g., on other laptops)
if [ -f "/Users/bhargavtejap.n/Desktop/PROJECTS/visageux/.venv/bin/python" ]; then
    PYTHON="/Users/bhargavtejap.n/Desktop/PROJECTS/visageux/.venv/bin/python"
elif command -v python3 &> /dev/null; then
    PYTHON="python3"
else
    PYTHON="python"
fi

cd "$(dirname "$0")/node_agent"

# Helpful tip if SERVER_URL isn't set
if [ -z "$SERVER_URL" ]; then
    echo "⚠️  INFO: SERVER_URL not set. Defaulting to localhost."
    echo "    To join from another laptop, run this instead:"
    echo "    SERVER_URL=http://<IP_OF_LAPTOP_A>:8000 ./start_node.sh"
    echo ""
fi

echo "Starting NebulaAI Node Agent using $PYTHON..."
$PYTHON node_agent.py
