import os

# ─────────────────────────────────────────────────────────────────────────────
#  SERVER_URL — can be overridden via environment variable for multi-laptop demo
#
#  Laptop A (server host):
#    python node_agent.py          ← uses localhost automatically
#
#  Laptop B / C (joining from another machine on the same WiFi):
#    SERVER_URL=http://192.168.x.x:8000 python node_agent.py
#    OR edit the fallback below to your server's IP address.
# ─────────────────────────────────────────────────────────────────────────────

SERVER_URL = os.environ.get("SERVER_URL", "http://localhost:8000")
