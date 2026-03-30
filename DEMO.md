# NebulaAI — Complete Hackathon Demo Guide

> **NebulaAI** is a heterogeneous AI orchestration system that turns multiple laptops into a distributed machine learning cluster — with no cloud, no Kubernetes, no heavy frameworks. Pure REST-based pipeline orchestration.

---

## Architecture Recap (30-second pitch)

```
Laptop A (Orchestrator)             Laptop B / C (Compute Nodes)
┌───────────────────────┐           ┌──────────────────────┐
│  FastAPI + SQLite     │  ◄──────► │  node_agent.py       │
│  Pipeline Scheduler   │  Heartbeat│  Preprocessor        │
│  Job Graph (DAG)      │  ◄──────► │  Trainer (GPU/CPU)   │
│  Trust Manager        │  Tasks +  │  Evaluator           │
│  WebSocket Broadcast  │  Tensors  └──────────────────────┘
└───────────────────────┘
```

**3-Stage Pipeline per Job:**
```
[Node A/B/C]              [GPU-preferred Node]      [Any Node]
 Preprocessing   ──.pt──►  Training  ──.pt──►  Evaluation
  (MNIST/        torch.save  (CNN)    torch.save  (metrics)
  Fashion/CIFAR)
```

---

## Prerequisites

Install on every laptop:
```bash
pip install fastapi uvicorn torch torchvision psutil requests tqdm
```

---

## STEP 1 — Start the Orchestrator (Laptop A only)

```bash
cd nub_back
python run_server.py
```

You will see:
```
═══════════════════════════════════════════════════════
   NebulaAI Orchestrator  v2.0  — ONLINE
   Swagger UI : http://localhost:8000/docs
   Status     : http://localhost:8000/status
═══════════════════════════════════════════════════════
```

> **Find your IP address (needed for other laptops):**
> ```bash
> # macOS
> ipconfig getifaddr en0
> # or
> ifconfig | grep "inet " | grep -v 127.0.0.1
> ```
> Example: your IP is `192.168.1.50`

---

## STEP 2 — Connect Laptop A as Node (Terminal 2 on same machine)

```bash
cd nub_back
python run_node.py
```

You will see a banner like:
```
═══════════════════════════════════════════════════════
   NebulaAI Distributed Node — STARTING
═══════════════════════════════════════════════════════
  Node ID    : node_a3f9c21b
  Hostname   : MacBook-Pro-Bhargav
  OS         : Darwin 23.1.0
  CPU Cores  : 8
  RAM        : 16.0 GB
  GPU Active : NO  — CPU  [Intel Iris Xe (Intel Core i7)]
  Compute    : CPU  [Intel Core i7-1185G7 @ 3.00GHz]
  Server     : http://localhost:8000
  Caps       : preprocessing, training, evaluation
═══════════════════════════════════════════════════════
```

> **Intel Iris GPU Note:**  
> On Intel Macs, PyTorch does not natively use the Iris GPU (no CUDA/MPS support).  
> The node detects and **displays** the Intel Iris Xe label clearly.  
> Actual compute runs on the Intel CPU cores — which is exactly what happens in a real distributed system where nodes contribute what they have.  
> If you install `intel_extension_for_pytorch`, the XPU backend will be auto-detected.

---

## STEP 3 — Connect Laptop B (Different machine on same WiFi)

On **Laptop B**, open terminal:

```bash
cd nub_back

# Replace with Laptop A's IP address
python run_node.py --server-url http://192.168.1.50:8000
```

Laptop B's terminal will show its own node ID and hardware details.  
The Orchestrator on Laptop A will print:
```
  [NODE ] Joined: node_bf2a1c4d | CPU | Caps: ['preprocessing', 'training', 'evaluation']
```

---

## STEP 4 — Connect Laptop C (Third machine)

Same as Laptop B:
```bash
python run_node.py --server-url http://192.168.1.50:8000
```

---

## STEP 5 — Verify All Nodes Are Connected

Open browser on any machine:  
**`http://192.168.1.50:8000/status`**

You should see JSON like:
```json
{
  "cluster": {
    "total_nodes": 3,
    "online_nodes": 3,
    "offline_nodes": 0
  },
  "nodes": [
    { "node_id": "node_a3f9c21b", "cpu_cores": 8, "ram_gb": 16.0, "gpu": false, "trust": 50, "status": "online" },
    { "node_id": "node_bf2a1c4d", "cpu_cores": 4, "ram_gb": 8.0,  "gpu": false, "trust": 50, "status": "online" },
    { "node_id": "node_c91e44aa", "cpu_cores": 6, "ram_gb": 12.0, "gpu": true,  "trust": 50, "status": "online" }
  ]
}
```

Or use the interactive Swagger UI:  
**`http://192.168.1.50:8000/docs`**

---

## STEP 6 — Run the Demo

### Option A: One-command demo script (recommended for judges)
```bash
cd nub_back
chmod +x demo.sh
./demo.sh
```

### Option B: Launch individual training jobs via Swagger UI

Open `http://localhost:8000/docs` and click **Try it out** on:

| Endpoint | What it does |
|---|---|
| `POST /demo_mnist` | Trains on MNIST (handwritten digits 0–9) |
| `POST /demo_fashion` | Trains on FashionMNIST (T-shirts, sneakers...) |
| `POST /demo_cifar` | Trains on CIFAR-10 (cars, birds, planes...) |
| `POST /demo_all` | 🚀 **Launches all 3 simultaneously** |

### Option C: curl commands (fastest for live demo)
```bash
# Get cluster status
curl http://localhost:8000/status | python3 -m json.tool

# Launch MNIST pipeline
curl -X POST http://localhost:8000/demo_mnist

# Launch FashionMNIST pipeline
curl -X POST http://localhost:8000/demo_fashion

# Launch CIFAR-10 pipeline
curl -X POST http://localhost:8000/demo_cifar

# Launch ALL 3 at once (big demo moment!)
curl -X POST http://localhost:8000/demo_all
```

---

## STEP 7 — What Judges Will See

### On Laptop A/B/C terminals (Compute Nodes):

**When a preprocessing task arrives:**
```
[NODE ] Task received!
  Task ID   : task_9a3f1b2c
  Stage     : PREPROCESSING
  Dataset   : FASHION

[PREP ] ── Preprocessing Stage ─────────────────
[PREP ] Dataset : FashionMNIST Clothing
[PREP ] Train   : 1000 samples
[PREP ] Test    : 200  samples
[PREP ] Downloading FashionMNIST Clothing...
[PREP ] Done. Serialised tensor bundle → ./workspace/task_9a3f1b2c.pt
```

**When a training task arrives:**
```
┌───────────────────────────────────────────────────┐
│  [CPU] Compute Device Detected                    │
│  CPU          [Intel Iris Xe (Intel Core i7-...)] │
└───────────────────────────────────────────────────┘

[TRAIN] ── Training Stage ──────────────────────────
[TRAIN] Dataset  : FashionMNIST Clothing
[TRAIN] Device   : CPU [Intel Iris Xe]
[TRAIN] Samples  : 1000
[TRAIN] Epochs   : 3

  Epoch 1/3  |  Acc:  71.50%  |  Loss: 0.8821  |  [CPU [Intel Iris Xe]]
  Epoch 2/3  |  Acc:  78.20%  |  Loss: 0.6214  |  [CPU [Intel Iris Xe]]
  Epoch 3/3  |  Acc:  82.40%  |  Loss: 0.4831  |  [CPU [Intel Iris Xe]]
```

**When an evaluation task arrives:**
```
[EVAL ] ── Evaluation Stage ────────────────────────
[EVAL ] Dataset  : FashionMNIST Clothing

──────────────────────────────────────────────────
  FINAL EVALUATION RESULTS
──────────────────────────────────────────────────
  Dataset  : FashionMNIST Clothing
  Accuracy : 82.50%   (165/200 correct)
  Loss     : 0.4712

  Per-Class Breakdown:
       T-shirt: [████████░░] 83.3%
       Trouser: [█████████░] 90.0%
      Pullover: [███████░░░] 73.3%
         Dress: [████████░░] 83.3%
──────────────────────────────────────────────────
```

---

## STEP 8 — Demonstrate Failure Rerouting (wow factor!)

While a job is running, simulate a node failure:

```bash
# Replace node_XXXXXXXX with an actual node ID from /status
curl -X POST http://localhost:8000/simulate_failure/node_XXXXXXXX
```

The Orchestrator terminal will show:
```
  [FAIL ] Heartbeat lost: node_XXXXXXXX — marking offline
  [REROUTE] Task task_9a3f1b2c → node_bf2a1c4d
```

The pipeline **continues automatically** on a different node.  
This demonstrates the fault-tolerance and dynamic rerouting capability.

---

## Intel Iris GPU — Technical Note for Judges

| Platform | GPU Support | Status |
|---|---|---|
| NVIDIA GPU (any) | `torch.cuda` | Full CUDA — highest priority |
| Apple M1/M2/M3 | `torch.backends.mps` | Metal GPU — second priority |
| Intel Iris Xe (Linux) | `intel_extension_for_pytorch` | XPU support if installed |
| Intel Iris Xe (macOS) | Not supported by PyTorch | Detected and labeled, runs on Intel CPU cores |

> **The key point for judges:** NebulaAI is designed to work with **whatever hardware each node has**. It detects, labels, and schedules accordingly. An Intel Iris node is identified and assigned work; the scheduler just preferentially picks GPU nodes for training tasks when available.

To install Intel Extension for PyTorch (enables XPU on Linux/Windows Intel Iris):
```bash
pip install intel-extension-for-pytorch
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Laptop B can't connect | Check WiFi — both on same network? Try `ping 192.168.1.50` |
| `Connection refused` | Is `uvicorn main:app --host 0.0.0.0` running? |
| CIFAR-10 takes too long | Normal first time (170MB download). Next runs are instant |
| `No tasks available` | No jobs have been submitted yet — run `/demo_all` |
| Node disappears from /status | Heartbeat lost — restart `node_agent.py` |

---

## Quick Reference Card (print this for judges)

```
LAPTOP A — ORCHESTRATOR
  cd nub_back
  python run_server.py

LAPTOP A — NODE 1 (new terminal)
  cd nub_back
  python run_node.py

LAPTOP B / C — NODE 2 / 3
  cd nub_back
  python run_node.py --server-url http://<LAPTOP_A_IP>:8000

FIRE ALL JOBS:
  curl -X POST http://localhost:8000/demo_all

WATCH LIVE:
  http://<LAPTOP_A_IP>:8000/status
  http://<LAPTOP_A_IP>:8000/docs
```
