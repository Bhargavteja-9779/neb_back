import sys
import os
import uvicorn

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

if __name__ == "__main__":
    print("Starting NebulaAI Orchestrator (Cross-Platform)...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
