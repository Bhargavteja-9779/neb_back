import os
import time
import uuid
import json
import asyncio
from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict

from database import init_db, get_db_connection
from models import NodeRegistration, NodeHeartbeat, JobSubmission, JobMetrics
from trust_manager import add_trust, deduct_trust, add_credits
from websocket_manager import manager
from node_registry import NodeRegistry
from pipeline_manager import PipelineManager

app = FastAPI(
    title="NebulaAI Pipeline Orchestrator",
    description="Heterogeneous AI Orchestration System — Hackathon Demo",
    version="2.0.0"
)

DATA_STORE = "./data_store"
os.makedirs(DATA_STORE, exist_ok=True)


@app.on_event("startup")
async def startup_event():
    init_db()
    print("\n" + "="*55)
    print("   NebulaAI Orchestrator  v2.0  — ONLINE")
    print("   Swagger UI : http://localhost:8000/docs")
    print("   Status     : http://localhost:8000/status")
    print("="*55 + "\n")

    async def failure_detector():
        while True:
            failed = NodeRegistry.check_node_failures()
            for n in failed:
                PipelineManager.handle_failed_node_tasks(n)
            await asyncio.sleep(5)
    asyncio.create_task(failure_detector())


# ─────────────────── Node Management ────────────────────

@app.post("/register_node", tags=["Nodes"])
def register_node(node: NodeRegistration):
    NodeRegistry.register_node(node.id, node.cpu, node.ram, node.gpu, node.hostname, node.capabilities)
    gpu_label = "GPU" if node.gpu else "CPU"
    print(f"  [NODE ] Joined: {node.id} | {gpu_label} | Caps: {node.capabilities}")
    return {"status": "success", "message": f"Node {node.id} registered"}


@app.post("/heartbeat", tags=["Nodes"])
def heartbeat(hb: NodeHeartbeat):
    NodeRegistry.update_heartbeat(hb.node_id, hb.cpu_usage, hb.ram_usage, hb.active_tasks)
    return {"status": "ok"}


@app.get("/get_nodes", tags=["Nodes"])
def get_nodes():
    return NodeRegistry.get_all_nodes()


# ─────────────────── Live Status Dashboard ──────────────

@app.get("/status", tags=["Dashboard"])
def cluster_status():
    """
    Judge-facing status endpoint.
    Shows all nodes, active tasks, and pipeline progress at a glance.
    """
    conn = get_db_connection()
    c = conn.cursor()

    c.execute("SELECT id, cpu, ram, gpu, trust, credits, status, capabilities, active_tasks, cpu_usage FROM nodes")
    raw_nodes = c.fetchall()

    nodes_out = []
    for n in raw_nodes:
        caps = json.loads(n['capabilities']) if n['capabilities'] else []
        nodes_out.append({
            "node_id": n['id'],
            "cpu_cores": n['cpu'],
            "ram_gb": n['ram'],
            "gpu": bool(n['gpu']),
            "trust": n['trust'],
            "credits": n['credits'],
            "status": n['status'],
            "capabilities": caps,
            "active_tasks": n['active_tasks'],
            "cpu_usage": n['cpu_usage'],
        })

    c.execute("""
        SELECT t.id, t.job_id, t.task_type, t.status, t.assigned_node, j.job_type, j.pipeline_state
        FROM job_tasks t
        LEFT JOIN jobs j ON t.job_id = j.id
        ORDER BY t.queued_at DESC
        LIMIT 30
    """)
    tasks_out = [dict(row) for row in c.fetchall()]

    c.execute("SELECT id, job_type, status, pipeline_state, accuracy, loss FROM jobs ORDER BY rowid DESC LIMIT 10")
    jobs_out = [dict(row) for row in c.fetchall()]

    conn.close()

    online = sum(1 for n in nodes_out if n['status'] == 'online')
    return {
        "cluster": {
            "total_nodes": len(nodes_out),
            "online_nodes": online,
            "offline_nodes": len(nodes_out) - online,
        },
        "nodes": nodes_out,
        "recent_jobs": jobs_out,
        "pipeline_tasks": tasks_out,
    }


# ─────────────────── Job Submission ─────────────────────

@app.post("/submit_job", tags=["Jobs"])
def submit_job(job: JobSubmission):
    job_type = getattr(job, 'job_type', 'mnist')
    PipelineManager.create_pipeline_job(job.id, job_type)
    return {"status": "pipeline_created", "job_id": job.id, "dataset": job_type}


@app.post("/demo_mnist", tags=["Demo"])
def demo_mnist():
    """Demo button #1 — Launch MNIST Handwritten Digits pipeline."""
    job_id = f"mnist_{uuid.uuid4().hex[:6]}"
    PipelineManager.create_pipeline_job(job_id, "mnist")
    return {"status": "launched", "job_id": job_id, "dataset": "MNIST Handwritten Digits"}


@app.post("/demo_fashion", tags=["Demo"])
def demo_fashion():
    """Demo button #2 — Launch FashionMNIST Clothing Classification pipeline."""
    job_id = f"fashion_{uuid.uuid4().hex[:6]}"
    PipelineManager.create_pipeline_job(job_id, "fashion")
    return {"status": "launched", "job_id": job_id, "dataset": "FashionMNIST Clothing"}


@app.post("/demo_cifar", tags=["Demo"])
def demo_cifar():
    """Demo button #3 — Launch CIFAR-10 Object Recognition pipeline."""
    job_id = f"cifar_{uuid.uuid4().hex[:6]}"
    PipelineManager.create_pipeline_job(job_id, "cifar10")
    return {"status": "launched", "job_id": job_id, "dataset": "CIFAR-10 Objects"}


@app.post("/demo_all", tags=["Demo"])
def demo_all():
    """
    ONE-CLICK FULL DEMO — Launches all 3 pipelines simultaneously.
    Each pipeline is independently scheduled across available nodes.
    Perfect for showing heterogeneous multi-job orchestration to judges.
    """
    jobs = []
    for job_type in ["mnist", "fashion", "cifar10"]:
        job_id = f"{job_type}_{uuid.uuid4().hex[:6]}"
        PipelineManager.create_pipeline_job(job_id, job_type)
        jobs.append({"job_id": job_id, "dataset": job_type})

    return {
        "status": "all_3_pipelines_launched",
        "message": "Watch /status for live pipeline progress",
        "jobs": jobs,
    }


# ─────────────────── Task Execution API ─────────────────

@app.get("/get_task/{node_id}", tags=["Tasks"])
def get_task(node_id: str):
    """
    Node polls this endpoint to receive its next assigned task.
    Returns task_type and job_type so the node knows which
    dataset and model architecture to use.
    """
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT t.*, j.job_type
        FROM job_tasks t
        LEFT JOIN jobs j ON t.job_id = j.id
        WHERE t.assigned_node = ? AND t.status = 'assigned'
        ORDER BY t.queued_at ASC
        LIMIT 1
    """, (node_id,))
    task = c.fetchone()
    if task:
        c.execute("UPDATE job_tasks SET status='running' WHERE id=?", (task['id'],))
        # Increase active tasks for this node
        c.execute("UPDATE nodes SET active_tasks = active_tasks + 1 WHERE id=?", (node_id,))
        conn.commit()
        conn.close()
        print(f"  [EXEC ] Node {node_id} accepted [{task['task_type']}] task {task['id']} (dataset: {task['job_type']})")
        return {
            "task_id":   task['id'],
            "job_id":    task['job_id'],
            "task_type": task['task_type'],
            "job_type":  task['job_type'] or "mnist",
            "dependency": task['dependency'],
        }
    conn.close()
    return {"message": "No tasks available"}


@app.post("/task_output/{task_id}", tags=["Tasks"])
async def upload_task_output(task_id: str, file: UploadFile = File(...)):
    """Node uploads its resulting .pt file after finishing a task."""
    file_path = os.path.join(DATA_STORE, f"{task_id}.pt")
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    PipelineManager.complete_task(task_id, file_path)
    return {"status": "success", "message": f"Artifact saved for task {task_id}"}


@app.get("/task_input/{dependency_task_id}", tags=["Tasks"])
def download_task_input(dependency_task_id: str):
    """Node downloads the output .pt file of its dependency task."""
    file_path = os.path.join(DATA_STORE, f"{dependency_task_id}.pt")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dependency artifact not found.")
    return FileResponse(file_path, media_type='application/octet-stream',
                        filename=f"{dependency_task_id}.pt")


@app.post("/task_metrics", tags=["Tasks"])
async def task_metrics(metrics: JobMetrics):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("""
        INSERT INTO metrics (job_id, task_id, epoch, accuracy, loss, node_id, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (metrics.job_id, metrics.task_id, metrics.epoch,
          metrics.accuracy, metrics.loss, metrics.node_id, time.time()))
    c.execute("UPDATE jobs SET accuracy=?, loss=? WHERE id=?",
              (metrics.accuracy, metrics.loss, metrics.job_id))
    conn.commit()
    conn.close()

    metrics_data = dict(metrics)
    await manager.broadcast({"event": "metric_update", "data": metrics_data})
    print(f"  [METR ] Job {metrics.job_id} | Acc: {metrics.accuracy:.2f}% | Loss: {metrics.loss:.4f} | Node: {metrics.node_id}")
    return {"status": "recorded"}


# ─────────────────── Failure Simulation ─────────────────

@app.post("/simulate_failure/{node_id}", tags=["Demo"])
def fail_node(node_id: str):
    """Manually simulate a node failure — then watch the pipeline reroute."""
    NodeRegistry.simulate_failure(node_id)
    PipelineManager.handle_failed_node_tasks(node_id)
    return {"status": "success", "message": f"Simulated failure for {node_id}. Tasks will be rerouted."}


# ─────────────────── WebSocket ───────────────────────────

@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
