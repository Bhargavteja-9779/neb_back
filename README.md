# NebulaAI – Autonomous Student AI Supercomputer

A lightweight, real distributed AI training system. Laptops connect over the local network to execute PyTorch MNIST training jobs assigned by a central FastAPI scheduler.

## Features
- **Central Scheduler**: FastAPI backend that tracks node resources, trust scores, and assigns jobs to the best available node.
- **Node Agents**: Python scripts that register with the server, send heartbeats, poll for jobs, and execute training.
- **Live Metrics**: Agents stream training metrics back to the server, which can be broadcasted via WebSockets.
- **Failure Detection**: If a node fails to send a heartbeat for 15 seconds, it is marked offline, trust is deducted, and its jobs are reassigned.
- **Trust System**: Nodes gain +5 trust for successful jobs and lose -10 trust on failure.
- **Zero Heavy Frameworks**: Pure Python (FastAPI, PyTorch, requests, sqlite3, psutil). No Docker, no K8s, no Ray.

## Architecture & Folder Structure
```text
nub_back/
├── backend/                  # Central Server
│   ├── main.py               # FastAPI Endpoints
│   ├── database.py           # SQLite Setup
│   ├── models.py             # Pydantic Schemas
│   ├── config.py             # Server Config
│   ├── scheduler.py          # Job Assignment Logic
│   ├── job_manager.py        # Failure/Reassignment Handling
│   ├── trust_manager.py      # Trust & Credits
│   └── websocket_manager.py  # WebSocket Broadcaster
└── node_agent/               # Node Client
    ├── node_agent.py         # Main Polling/Heartbeat Loop
    ├── trainer.py            # PyTorch CNN MNIST Training
    ├── metrics_sender.py     # HTTP Metrics Streamer
    └── config.py             # Agent Config (SERVER_URL)
```

## Setup & Run Instructions

### 1. Prerequisites
Both the server laptop and the worker laptops need Python 3.8+ installed.

```bash
# On all machines, install dependencies (tqdm added for animations):
pip install fastapi uvicorn pydantic python-multipart psutil requests torch torchvision tqdm
```

### 2. Start the Central Server (Laptop 1)
Run this on the machine acting as the central scheduler.
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```
*Note: The server will create a local SQLite database `nebula.db` automatically.*

### 3. Connect the Laptops (Networking Guide for Laptops 2 & 3)
1. **Connect to exactly the same WiFi network** (or Mobile Hotspot) on all 3 laptops.
2. Find the local IP address of the Central Server Laptop (Laptop 1):
   - **Mac**: Open terminal and run `ipconfig getifaddr en0` (or check Network Preferences).
   - **Windows**: Open command prompt, run `ipconfig`, look for "IPv4 Address" under your Wireless LAN adapter.
   - Example IP: `192.168.1.10`.
3. Open `node_agent/config.py` on the worker laptops.
4. Update the `SERVER_URL` to match laptop 1's IP:
   ```python
   SERVER_URL = "http://192.168.1.10:8000"
   ```
   *(If testing locally on just ONE laptop, keep it as `"http://localhost:8000"`)*

#### Connection Troubleshooting
- If you get `[Errno 61] Connection refused` or the worker hangs, **Laptop 1 is blocking incoming connections.**
- **Windows**: Go to "Windows Defender Firewall" -> "Allow an app or feature through Windows Defender Firewall" -> Check both Private/Public boxes for Python/Uvicorn.
- **Mac**: Go to "System Settings" -> "Network" -> "Firewall" -> Add an exception for incoming Python connections, or temporarily disable it for the demo.

### 4. Start the Node Agents
Run this on the worker laptops:
```bash
cd node_agent
python node_agent.py
```
You should see a spinning animation polling for jobs after successful registration.

## Demo Steps (Hackathon Script)

### 1. Verify Nodes are Connected
On your main server laptop, check that the node laptops registered successfully. Open your browser and go to:
[`http://localhost:8000/get_nodes`](http://localhost:8000/get_nodes)
*(You should see the node ID, CPU, and RAM of the connected laptops in JSON format)*

### 2. Understand the Sample Data
The `trainer.py` script comes pre-packaged with a Convolutional Neural Network (CNN) ready to train on the **MNIST Handwritten Digits Dataset**.
*You do not need to download the dataset manually. The script auto-downloads it using PyTorch and uses a tiny 1,000-image subset so epochs complete in seconds!*

### 3. HOW TO START THE TRAINING (Submit a Job)
The node agents are currently just polling and waiting. To give them a job and start the training, you need to call the `/demo_job` API on the central server. 

**Method A (Fastest) - Using Terminal:**
Open a new terminal window on **Laptop 1** and run this command:
```bash
curl -X POST http://localhost:8000/demo_job
```

**Method B - Using the Browser (Swagger UI):**
1. On **Laptop 1**, open your browser and go to: [`http://localhost:8000/docs`](http://localhost:8000/docs)
2. Scroll down to the green `POST /demo_job` endpoint.
3. Click it to expand it, then click the **"Try it out"** button.
4. Click the big blue **"Execute"** button.

### 4. Watch the Real-Time Animated Training
- Immediately after doing Step 3, look at the terminals on your connected laptops.
- One of the Node Agents will catch the job, clear its spinner, and load a `tqdm` animated progress bar showing live batches, Accuracy, and Loss drops as it trains!
- The Central Server terminal will start streaming: `[*] Metrics received for job...` as the training happens.

### 5. Simulate a Laptop Failure (Job Reassignment)
   - While a job is assigned to Node A, either kill the Node A script (Ctrl+C) or hit the failure simulation endpoint:
     `POST http://localhost:8000/simulate_failure/{node_id}`
   - The job will be placed back in the queue and reassigned to the next best Node (e.g. Node B).
